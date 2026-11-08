import datetime as dt
import unittest

import wfm_sweep as w


def stat(day, volume, median, rank=None, subtype=None):
    r = {"datetime": f"{day}T00:00:00.000+00:00", "volume": volume, "min_price": median - 1, "max_price": median + 1,
         "median": median, "avg_price": median, "wa_price": median}
    if rank is not None:
        r["mod_rank"] = rank
    if subtype is not None:
        r["subtype"] = subtype
    return r


def payload(rows):
    return {"payload": {"statistics_closed": {"90days": rows, "48hours": []}}}


REF = dt.date(2026, 11, 2)


class SummarizeTest(unittest.TestCase):
    def test_splits_ranks_and_weights_by_volume(self):
        rows = w.parse_daily(payload([
            stat("2026-11-01", 10, 7, rank=0), stat("2026-11-02", 30, 120, rank=5), stat("2026-11-01", 10, 100, rank=5),
        ]))
        r0, r5 = w.summarize(rows, REF)
        self.assertEqual((r0.rank, r0.price7, r0.vol7, r0.plat7), (0, 7, 1.4, 10))
        self.assertEqual((r5.rank, r5.price7, r5.vol7, r5.plat7), (5, 115, 5.7, 657))

    def test_trend_compares_with_the_30_days_before(self):
        rows = w.parse_daily(payload([stat("2026-10-20", 10, 100), stat("2026-11-02", 10, 110)]))
        (s,) = w.summarize(rows, REF)
        self.assertEqual(s.trend7, 10.0)
        self.assertEqual(len(s.spark30), 30)
        self.assertEqual((s.spark30[-1], s.spark30[-14], s.spark30[0]), (110, 100, None))

    def test_no_trend_without_earlier_trades_and_skips_idle_groups(self):
        rows = w.parse_daily(payload([
            stat("2026-11-01", 3, 15, subtype="intact"), stat("2026-09-01", 3, 40, subtype="radiant"),
        ]))
        (s,) = w.summarize(rows, REF)
        self.assertEqual((s.subtype, s.trend7), ("intact", None))


class HourlyTest(unittest.TestCase):
    def test_keeps_traded_hours_with_rank_and_subtype(self):
        hour = lambda h, v, m, **k: {**stat("2026-11-07", v, m, **k), "datetime": f"2026-11-07T{h}:00:00.000+00:00"}
        p = {"payload": {"statistics_closed": {"90days": [], "48hours": [
            hour("03", 4, 120, rank=5), hour("04", 0, 0, rank=5), hour("18", 2, 15, subtype="radiant"),
        ]}}}
        self.assertEqual(w.parse_hourly(p), [["2026-11-07T03", 5, None, 4, 120.0], ["2026-11-07T18", None, "radiant", 2, 15.0]])

    def test_missing_hourly_bucket_is_empty(self):
        self.assertEqual(w.parse_hourly({"payload": {"statistics_closed": {"90days": []}}}), [])


class OutlierTest(unittest.TestCase):
    def test_drops_fake_days_but_keeps_real_moves(self):
        days = [stat(f"2026-10-{d:02d}", 1, p) for d, p in [(1, 5500), (2, 5750), (3, 6000), (4, 4000), (5, 1),
                                                              (6, 99999), (7, 2000), (8, 5450)]]
        days.append(stat("2026-10-06", 3, 12, rank=0))  # a different variant, judged on its own
        kept = w.drop_outliers(w.parse_daily(payload(days)))
        self.assertEqual([r.median for r in kept], [5500, 5750, 6000, 4000, 2000, 5450, 12])

    def test_hourly_uses_the_daily_reference(self):
        daily = w.parse_daily(payload([stat(f"2026-10-0{d}", 1, 100) for d in range(1, 4)]))
        hourly = [["2026-10-03T01", None, None, 9, 99999.0], ["2026-10-03T02", None, None, 1, 110.0],
                  ["2026-10-03T03", 5, None, 1, 7.0]]
        self.assertEqual(w.drop_hourly_outliers(hourly, daily), hourly[1:])


class ClientTest(unittest.TestCase):
    def make(self, responses):
        log = {"sleeps": [], "requests": 0}

        class Res:
            def __init__(self, status, body=b"{}", retry_after=None):
                self.status, self._body, self._ra = status, body, retry_after

            def read(self):
                return self._body

            def getheader(self, name):
                return self._ra if name == "Retry-After" else None

        class Conn:
            def request(self, *_a, **_k):
                log["requests"] += 1

            def getresponse(self):
                return Res(*responses.pop(0))

            def close(self):
                pass

        now = [0.0]

        def sleep(s):
            log["sleeps"].append(round(s, 2))
            now[0] += s

        return w.Client(sleep=sleep, clock=lambda: now[0], connect=Conn), log

    def test_retries_429_using_retry_after(self):
        client, log = self.make([(429, b"", "7"), (200, b'{"ok": true}')])
        self.assertEqual(client.get("/x"), {"ok": True})
        self.assertEqual(log["sleeps"], [7.0])
        self.assertEqual(log["requests"], 2)

    def test_paces_consecutive_requests(self):
        client, log = self.make([(200, b"{}"), (200, b"{}")])
        client.get("/a")
        client.get("/b")
        self.assertEqual(log["sleeps"], [w.MIN_INTERVAL])

    def test_404_is_none_and_other_errors_raise(self):
        client, _ = self.make([(404,), (403,)])
        self.assertIsNone(client.get("/missing"))
        with self.assertRaises(RuntimeError):
            client.get("/forbidden")


class HelpersTest(unittest.TestCase):
    def test_retry_delay(self):
        self.assertEqual(w.retry_delay(None, 5), 5)
        self.assertEqual(w.retry_delay("bogus", 5), 5)
        self.assertEqual(w.retry_delay("9999", 5), w.MAX_BACKOFF)

    def test_kind_and_merge_books(self):
        self.assertEqual(w.kind_of(["prime", "set", "warframe"]), "Set")
        self.assertEqual(w.kind_of(["legendary", "arcane_enhancement"]), "Arcane")
        o = lambda i, p: {"id": i, "platinum": p, "quantity": 1, "user": {"ingameName": "secret", "reputation": 3}}
        merged = w.merge_books([{"sell": [o("a", 9), o("b", 8)], "buy": [o("c", 5)]},
                                {"sell": [o("a", 9)], "buy": [o("d", 6)]}])
        self.assertEqual([x["platinum"] for x in merged["sell"]], [8, 9])
        self.assertEqual([x["platinum"] for x in merged["buy"]], [6, 5])
        self.assertNotIn("secret", str(merged))


if __name__ == "__main__":
    unittest.main()
