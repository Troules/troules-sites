import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mt-24 text-center">
      <h1 className="font-serif text-4xl font-semibold">Not found</h1>
      <p className="text-muted mt-3">No article lives at this address.</p>
      <Link href="/" className="text-accent mt-6 inline-block underline underline-offset-4">
        All articles
      </Link>
    </div>
  );
}
