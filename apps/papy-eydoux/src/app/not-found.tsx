import Link from "next/link";

export default function NotFound() {
  return (
    <main className="ending slide">
      <div>
        <h1>Perdu dans l’espace-temps</h1>
        <p>Papy est passé partout, mais pas ici.</p>
        <Link href="/">Revenir à la frise</Link>
      </div>
    </main>
  );
}
