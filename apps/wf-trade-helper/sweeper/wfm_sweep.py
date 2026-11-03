#!/usr/bin/env python3
"""warframe.market sweep: fetch item statistics politely and turn them into per-(item, rank, subtype) summaries.

Standard library only, so it runs on the VM without a virtualenv. Commands:

  fixtures OUT_DIR SLUG...   write the sample data the site uses in dev, CI and e2e (src/fixtures/)

The daily Supabase sweep (all items, systemd timer on the VM) reuses the same client and summary code; see
docs/adr/0009-market-data.md. API rules: https://github.com/42bytes-team/wfm-docs (3 requests/s, honest User-Agent,
no concurrent connections).
"""

from __future__ import annotations

import argparse
import datetime as dt
import http.client
import json
import os
import sys
import time
from dataclasses import asdict, dataclass

HOST = "api.warframe.market"
USER_AGENT = "troules-wf-trade-helper/0.1 (+https://wf-trade-helper.troules.dynv6.net)"
MIN_INTERVAL = 0.35  # seconds between request starts: about 2.3 req/s with ~80 ms responses, under the 3 req/s limit
MAX_BACKOFF = 300.0
RETRY_STATUS = {429, 500, 502, 503, 504, 509}


class Client:
    """One keep-alive HTTPS connection, requests strictly one after another (Cloudflare 509s on concurrency)."""

    def __init__(self, sleep=time.sleep, clock=time.monotonic, connect=None):
        self._sleep, self._clock = sleep, clock
        self._connect = connect or (lambda: http.client.HTTPSConnection(HOST, timeout=30))
        self._conn = None
        self._last = -MIN_INTERVAL

    def get(self, path: str, headers: dict[str, str] | None = None, attempts: int = 6):
        hdrs = {"User-Agent": USER_AGENT, "Accept": "application/json", **(headers or {})}
        backoff = 5.0
        for attempt in range(attempts):
            wait = self._last + MIN_INTERVAL - self._clock()
            if wait > 0:
                self._sleep(wait)
            self._last = self._clock()
            try:
                if self._conn is None:
                    self._conn = self._connect()
                self._conn.request("GET", path, headers=hdrs)
                res = self._conn.getresponse()
                body = res.read()
            except (OSError, http.client.HTTPException):
                self._close()
                status, retry_after = None, None
            else:
                status, retry_after = res.status, res.getheader("Retry-After")
                if status == 200:
                    return json.loads(body)
                if status == 404:
                    return None
                if status not in RETRY_STATUS:
                    raise RuntimeError(f"GET {path}: HTTP {status}")
            if attempt == attempts - 1:
                break
            self._sleep(retry_delay(retry_after, backoff))
            backoff = min(backoff * 2, MAX_BACKOFF)
        raise RuntimeError(f"GET {path}: gave up after {attempts} attempts (last status {status})")

    def _close(self):
        if self._conn is not None:
            self._conn.close()
        self._conn = None


def retry_delay(retry_after: str | None, backoff: float) -> float:
    """Honour a numeric Retry-After from Cloudflare, else exponential backoff; never more than MAX_BACKOFF."""
    try:
        return min(max(float(retry_after), 1.0), MAX_BACKOFF) if retry_after else backoff
    except ValueError:
        return backoff


@dataclass(frozen=True)
class DailyRow:
    day: str
    rank: int | None
    subtype: str | None
    volume: int
    min: float
    max: float
    median: float
    avg: float
    wa: float


def parse_daily(payload: dict) -> list[DailyRow]:
    """Completed-trade daily buckets (v1 statistics_closed.90days), one row per day, rank and subtype."""
    rows = payload["payload"]["statistics_closed"]["90days"]
    return [
        DailyRow(
            day=r["datetime"][:10],
            rank=r.get("mod_rank"),
            subtype=r.get("subtype"),
            volume=int(r["volume"]),
            min=float(r["min_price"]),
            max=float(r["max_price"]),
            median=float(r["median"]),
            avg=float(r["avg_price"]),
            wa=float(r["wa_price"]),
        )
        for r in rows
    ]


@dataclass(frozen=True)
class Summary:
    rank: int | None
    subtype: str | None
    price7: float  # volume-weighted mean of the daily medians, last 7 days
    vol7: float  # completed trades per day, last 7 days
    plat7: float  # platinum traded per day, last 7 days (sum of volume x median / 7)
    trend7: float | None  # price7 vs the 30 days before, in percent; None without earlier trades
    last_day: str
    spark30: list[float | None]  # daily median for the last 30 days, None on days without trades


def _days_back(ref: dt.date, n: int) -> list[str]:
    return [(ref - dt.timedelta(days=i)).isoformat() for i in range(n - 1, -1, -1)]


def summarize(rows: list[DailyRow], ref_day: dt.date) -> list[Summary]:
    """One summary per (rank, subtype) that traded in the 7 days ending at ref_day (inclusive)."""
    groups: dict[tuple, dict[str, DailyRow]] = {}
    for r in rows:
        groups.setdefault((r.rank, r.subtype), {})[r.day] = r
    last7, prev30, spark = _days_back(ref_day, 7), _days_back(ref_day - dt.timedelta(days=7), 30), _days_back(ref_day, 30)
    out = []
    for (rank, subtype), days in groups.items():
        recent = [days[d] for d in last7 if d in days]
        vol = sum(r.volume for r in recent)
        if not vol:
            continue
        plat = sum(r.volume * r.median for r in recent)
        before = [days[d] for d in prev30 if d in days]
        vol_b = sum(r.volume for r in before)
        price, price_b = plat / vol, (sum(r.volume * r.median for r in before) / vol_b if vol_b else None)
        out.append(
            Summary(
                rank=rank,
                subtype=subtype,
                price7=round(price, 1),
                vol7=round(vol / 7, 1),
                plat7=round(plat / 7),
                trend7=round((price / price_b - 1) * 100, 1) if price_b else None,
                last_day=max(days),
                spark30=[days[d].median if d in days else None for d in spark],
            )
        )
    return sorted(out, key=lambda s: (s.rank is None, s.rank or 0, s.subtype or ""))


KIND_TAGS = [  # first match wins
    ("set", "Set"),
    ("relic", "Relic"),
    ("arcane_enhancement", "Arcane"),
    ("mod", "Mod"),
    ("blueprint", "Blueprint"),
    ("component", "Part"),
    ("weapon", "Weapon"),
    ("warframe", "Warframe"),
]


def kind_of(tags: list[str]) -> str:
    return next((label for tag, label in KIND_TAGS if tag in tags), "Item")


def catalog_entry(item: dict) -> dict:
    en = item["i18n"]["en"]
    return {
        "slug": item["slug"],
        "name": en["name"],
        "thumb": en.get("thumb"),
        "kind": kind_of(item.get("tags", [])),
        "maxRank": item.get("maxRank"),
        "subtypes": item.get("subtypes"),
    }


def anonymize_order(o: dict) -> dict:
    """Keep what the order book shows; drop player names and ids from the public fixtures."""
    u = o.get("user", {})
    return {
        "platinum": o["platinum"],
        "quantity": o["quantity"],
        "rank": o.get("rank"),
        "subtype": o.get("subtype"),
        "reputation": u.get("reputation", 0),
        "status": u.get("status", "offline"),
    }


def merge_books(books: list[dict]) -> dict:
    """Merge several /top responses: dedupe by order id, sellers cheapest first, buyers highest first."""
    merged = {}
    for side in ("sell", "buy"):
        by_id = {o["id"]: o for b in books for o in b[side]}
        merged[side] = sorted((anonymize_order(o) for o in by_id.values()),
                              key=lambda o: o["platinum"] if side == "sell" else -o["platinum"])
    return merged


def dump(path: str, data) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")


def cmd_fixtures(out_dir: str, slugs: list[str], client: Client) -> None:
    items = client.get("/v2/items")["data"]
    catalog = sorted((catalog_entry(i) for i in items), key=lambda c: c["slug"])
    by_slug = {c["slug"]: c for c in catalog}
    ref = dt.datetime.now(dt.UTC).date() - dt.timedelta(days=1)  # the last complete UTC day
    summaries, history, orders = [], {}, {}
    for slug in slugs:
        if slug not in by_slug:
            print(f"skip {slug}: not in the catalog", file=sys.stderr)
            continue
        stats = client.get(f"/v1/items/{slug}/statistics")
        if stats is None:
            continue
        rows = parse_daily(stats)
        history[slug] = [[r.day, r.rank, r.subtype, r.volume, r.min, r.max, r.median] for r in rows]
        summaries += [{"slug": slug, **asdict(s)} for s in summarize(rows, ref)]
        top = client.get(f"/v2/orders/item/{slug}/top", {"Platform": "pc", "Crossplay": "true"})
        # /top without filters mixes ranks; ask for the max rank too so the sell helper has real competitors.
        books = [top["data"]] if top else []
        max_rank = by_slug[slug]["maxRank"]
        if max_rank:
            ranked = client.get(f"/v2/orders/item/{slug}/top?rank={max_rank}", {"Platform": "pc", "Crossplay": "true"})
            if ranked:
                books.append(ranked["data"])
        orders[slug] = merge_books(books)
    os.makedirs(out_dir, exist_ok=True)
    dump(os.path.join(out_dir, "catalog.json"), catalog)
    dump(os.path.join(out_dir, "slugs.json"), [c["slug"] for c in catalog])  # small list for proxy.ts
    dump(
        os.path.join(out_dir, "market.json"),
        {"asOf": ref.isoformat(), "fetchedAt": dt.datetime.now(dt.UTC).strftime("%Y-%m-%dT%H:%MZ"),
         "summaries": summaries, "history": history, "orders": orders},
    )
    print(f"{len(catalog)} catalog items, {len(summaries)} summaries for {len(history)} items -> {out_dir}")


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)
    f = sub.add_parser("fixtures", help="write sample data for the site")
    f.add_argument("out_dir")
    f.add_argument("slugs", nargs="+")
    args = p.parse_args(argv)
    if args.cmd == "fixtures":
        cmd_fixtures(args.out_dir, args.slugs, Client())
    return 0


if __name__ == "__main__":
    sys.exit(main())
