// Converts the original PNGs (kept outside the repo) into the WebP files the site imports.
// Usage: pnpm --filter @troules/papy-eydoux import-images "/mnt/c/Users/…/papy-eydoux"
// Add a line to SOURCES (and an entry in src/lib/timeline.ts) for each new image.
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/** Original filename → slug used in src/lib/timeline.ts and src/assets/timeline/<slug>.webp */
const SOURCES = {
  "Visage spectral dans la carte cosmique.png": "fond-diffus-cosmologique",
  "Artiste préhistorique surpris dans sa grotte.png": "grotte-ornee",
  "Barbecue préhistorique face au mammouth.png": "barbecue-mammouth",
  "Fresque funéraire égyptienne antique 马会.png": "fresque-egyptienne",
  "Mosaïque romaine du banquet bachique.png": "mosaique-bachique",
  "La Cène Renaissance avec invité moderne.png": "la-cene",
  "Tapisserie médiévale du bûcher de Bagneux.png": "tapisserie-de-bagneux",
  "Modèle vitruvien dans l’atelier de Léonard.png": "homme-de-vitruve",
  "Prise de la Bastille en gravure ancienne.png": "prise-de-la-bastille",
  "Napoléon et son état-major au front.png": "etat-major-napoleon",
  "Ouvrier sur la tour Eiffel en construction.png": "tour-eiffel",
  "Photo vintage de Lénine, Staline et un homme central.png": "lenine-staline",
  "Portrait vintage à la distillerie Ricard.png": "distillerie-ricard",
  "Rencontre devant l’Hôtel du Parc.png": "hotel-du-parc",
  "Inspection militaire dans la France des années 1940.png": "france-libre",
  "Dossier secret à Los Alamos.png": "los-alamos",
  "Ingénieur devant l’ENIAC.png": "eniac",
  "Magicien fumeur dans les montagnes fantastiques.png": "magicien",
  "Veillée étoilée avec un ours musicien.png": "bonne-nuit-les-petits",
  "Astronautes sous le parasol Ricard lunaire.png": "apollo-11",
  "Vol dans la lumière lunaire.png": "vol-lunaire",
  "Soirée cinéma pleine de popcorn.png": "seance-de-cinema",
};

const [source] = process.argv.slice(2);
if (!source) {
  console.error("Usage: import-images <folder with the original PNGs>");
  process.exit(1);
}

const out = new URL("../src/assets/timeline/", import.meta.url).pathname;
mkdirSync(out, { recursive: true });

for (const [file, slug] of Object.entries(SOURCES)) {
  // 1440 px on the long edge covers a full-height slide on a 1440p screen; WebP q78 keeps each file ~150–300 kB.
  const info = await sharp(join(source, file))
    .resize({ width: 1440, height: 1440, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 78, effort: 6 })
    .toFile(join(out, `${slug}.webp`));
  process.stdout.write(`${slug}.webp ${info.width}x${info.height} ${Math.round(info.size / 1024)} kB\n`);
}
