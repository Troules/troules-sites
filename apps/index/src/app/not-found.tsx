import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <h1 className="text-4xl font-semibold">Lost in space</h1>
        <p className="mt-3 text-white/70">This page drifted out of orbit.</p>
        <Link href="/" className="mt-6 inline-block underline underline-offset-4">
          Back to the index
        </Link>
      </div>
    </main>
  );
}
