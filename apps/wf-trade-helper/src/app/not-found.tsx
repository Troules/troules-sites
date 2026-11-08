import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-[1240px] px-5 py-24 text-center">
      <h1 className="text-3xl font-semibold">Item not found</h1>
      <p className="text-muted mt-3">warframe.market has no tradable item at this address.</p>
      <Link href="/" className="text-accent mt-6 inline-block underline underline-offset-4">
        Back to the dashboard
      </Link>
    </main>
  );
}
