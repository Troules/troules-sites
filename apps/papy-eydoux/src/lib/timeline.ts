import type { StaticImageData } from "next/image";
import fondDiffus from "@/assets/timeline/fond-diffus-cosmologique.webp";
import grotte from "@/assets/timeline/grotte-ornee.webp";
import barbecue from "@/assets/timeline/barbecue-mammouth.webp";
import fresque from "@/assets/timeline/fresque-egyptienne.webp";
import mosaique from "@/assets/timeline/mosaique-bachique.webp";
import cene from "@/assets/timeline/la-cene.webp";
import tapisserie from "@/assets/timeline/tapisserie-de-bagneux.webp";
import vitruve from "@/assets/timeline/homme-de-vitruve.webp";
import bastille from "@/assets/timeline/prise-de-la-bastille.webp";
import napoleon from "@/assets/timeline/etat-major-napoleon.webp";
import eiffel from "@/assets/timeline/tour-eiffel.webp";
import lenine from "@/assets/timeline/lenine-staline.webp";
import ricard from "@/assets/timeline/distillerie-ricard.webp";
import hotelDuParc from "@/assets/timeline/hotel-du-parc.webp";
import franceLibre from "@/assets/timeline/france-libre.webp";
import losAlamos from "@/assets/timeline/los-alamos.webp";
import eniac from "@/assets/timeline/eniac.webp";
import magicien from "@/assets/timeline/magicien.webp";
import nounours from "@/assets/timeline/bonne-nuit-les-petits.webp";
import apollo from "@/assets/timeline/apollo-11.webp";
import volLunaire from "@/assets/timeline/vol-lunaire.webp";
import cinema from "@/assets/timeline/seance-de-cinema.webp";

/** Year the "il y a …" labels count from. Bump it once a year (or not: Papy doesn't age). */
export const REFERENCE_YEAR = 2026;

export type Moment = {
  slug: string;
  /** Sort key and "il y a" base. Negative = before our era. */
  year: number;
  /** True when `year` is an order of magnitude rather than a known date. */
  approximate?: boolean;
  /** Date as shown, in French. */
  date: string;
  /** Short label for the timeline rail. */
  short: string;
  place: string;
  title: string;
  description: string;
  alt: string;
  image: StaticImageData;
};

/** Every moment, oldest first. Keep this list sorted by `year` (a unit test checks it). */
export const timeline: Moment[] = [
  {
    slug: "fond-diffus-cosmologique",
    year: -13_800_000_000,
    approximate: true,
    date: "380 000 ans après le Big Bang",
    short: "Big Bang",
    place: "Partout à la fois",
    title: "La première photo de famille",
    description:
      "Le fond diffus cosmologique est la plus vieille lumière de l’Univers, émise 380 000 ans après le Big Bang. Le satellite Planck l’a cartographiée degré par degré. En y regardant de près, les fluctuations de température dessinent un visage familier : Papy était là avant les étoiles.",
    alt: "Carte ovale du fond diffus cosmologique, mouchetée de bleu et d’orange, où se dessine le visage barbu de Papy.",
    image: fondDiffus,
  },
  {
    slug: "grotte-ornee",
    year: -36_000,
    approximate: true,
    date: "36 000 av. J.-C.",
    short: "Paléolithique",
    place: "Une grotte ornée, quelque part en Ardèche",
    title: "Le premier artiste de la famille",
    description:
      "Torche de résine, ocre rouge et mains au pochoir : Papy décore la paroi. Le mammouth est très ressemblant. Le dinosaure, en revanche, arrive avec 65 millions d’années de retard, et l’artiste vient d’être surpris en flagrant délit d’anachronisme.",
    alt: "Papy, vêtu de peaux de bête, peint à l’ocre une fresque de dinosaure et de mammouth sur la paroi d’une grotte éclairée par des torches.",
    image: grotte,
  },
  {
    slug: "barbecue-mammouth",
    year: -15_000,
    approximate: true,
    date: "15 000 av. J.-C.",
    short: "Âge glaciaire",
    place: "Fin de l’âge glaciaire",
    title: "Le barbecue avant la civilisation",
    description:
      "Le feu est maîtrisé, la grille aussi. Sur les pierres gravées, deux maximes : « Good meat, better times » et « BBQ before civilization ». Derrière, le mammouth suit la cuisson avec une inquiétude bien compréhensible.",
    alt: "Papy en peaux de bête allume un barbecue de pierres et d’os sous le regard d’un mammouth laineux, devant des montagnes enneigées.",
    image: barbecue,
  },
  {
    slug: "fresque-egyptienne",
    year: -1250,
    approximate: true,
    date: "vers 1250 av. J.-C.",
    short: "Égypte",
    place: "Thèbes, Nouvel Empire",
    title: "La fresque du scribe Eydoux",
    description:
      "Pagne de lin, croix ânkh à la main et sceptre de belle taille : Papy a droit à sa fresque de son vivant, entre deux chats sacrés et le faucon d’Horus. L’ânkh est le symbole de la vie, et il compte bien en profiter. Les hiéroglyphes n’ont pas encore été déchiffrés, mais on soupçonne une recette de grillades.",
    alt: "Fresque égyptienne de profil : Papy en pagne blanc tient une croix ânkh et un bâton, entouré de hiéroglyphes, de chats et d’un faucon.",
    image: fresque,
  },
  {
    slug: "mosaique-bachique",
    year: -50,
    approximate: true,
    date: "Ier siècle av. J.-C.",
    short: "Rome",
    place: "Pompéi",
    title: "Vinum, amor, vita",
    description:
      "Couronne de lierre, amphore sous le bras et compagnie choisie : cette mosaïque de banquet bachique résume la devise inscrite au bas du tableau, le vin, l’amour, la vie. Les archéologues ont daté la scène au premier coup d’œil : un dimanche midi.",
    alt: "Mosaïque romaine : Papy couronné de lierre, une amphore à la main, entouré de convives allongés qui lèvent leur coupe. Inscription « Vinum amor vita ».",
    image: mosaique,
  },
  {
    slug: "la-cene",
    year: 30,
    approximate: true,
    date: "vers l’an 30",
    short: "Jérusalem",
    place: "Jérusalem",
    title: "Un invité de dernière minute",
    description:
      "Treize couverts étaient prévus. Papy, la main sur le cœur, jure qu’il était sur la liste. Personne n’a osé lui demander qui l’avait invité, et c’est sans doute le seul repas de l’Histoire où il n’a pas apporté l’apéritif.",
    alt: "Peinture de style Renaissance de la Cène : Papy est attablé parmi les apôtres, juste à côté de Jésus, la main sur le cœur.",
    image: cene,
  },
  {
    slug: "tapisserie-de-bagneux",
    year: 1077,
    approximate: true,
    date: "XIe siècle",
    short: "Moyen Âge",
    place: "Site de Bagneux",
    title: "La tapisserie de Bagneux",
    description:
      "Cousine méconnue de la tapisserie de Bayeux, brodée sur le site de Bagneux. Sous les bannières fleurdelisées, la scène est sombre ; Papy, bûche à la main, y tient le rôle qu’il occupe depuis la préhistoire : responsable du feu. Cette fois, c’est Jade qui criait OSKOOOOUR.",
    alt: "Tapisserie médiévale brodée portant l’inscription « Site Bagneux » : Papy pousse une bûche dans un bûcher, devant une foule et des soldats aux boucliers fleurdelisés.",
    image: tapisserie,
  },
  {
    slug: "homme-de-vitruve",
    year: 1490,
    date: "1490",
    short: "Renaissance",
    place: "Atelier de Léonard de Vinci",
    title: "L’Homme de Vitruve, version originale",
    description:
      "Bras écartés, pieds bien plantés, pagne réglementaire : Papy pose pour Léonard, qui cherche les proportions idéales du corps humain. Le dessin a été un peu idéalisé par la suite. Le modèle, lui, n’a jamais été crédité.",
    alt: "Dans un atelier de la Renaissance, Papy pose bras écartés, en pagne, pendant que Léonard de Vinci et ses élèves le dessinent.",
    image: vitruve,
  },
  {
    slug: "prise-de-la-bastille",
    year: 1789,
    date: "14 juillet 1789",
    short: "1789",
    place: "Paris, faubourg Saint-Antoine",
    title: "La prise de la Bastille",
    description:
      "Gravure d’époque, tricorne brandi, fusil à la main : Papy mène la charge contre la forteresse. La légende ne dit pas s’il est entré le premier, mais il a sûrement été le premier à proposer d’arroser ça.",
    alt: "Gravure ancienne de la prise de la Bastille : Papy, tricorne levé et fusil à la main, crie en tête de la foule devant la forteresse.",
    image: bastille,
  },
  {
    slug: "etat-major-napoleon",
    year: 1805,
    date: "1805",
    short: "Empire",
    place: "Campagne d’Austerlitz",
    title: "À l’état-major",
    description:
      "Napoléon montre l’horizon ; Papy, carte en main et épaulettes dorées, affiche un léger scepticisme. Le soleil d’Austerlitz s’est levé comme prévu, et l’Empereur n’a jamais su qui lui avait soufflé l’idée.",
    alt: "Peinture d’histoire : Napoléon pointe le champ de bataille du doigt, à côté de Papy en uniforme de maréchal, une carte à la main.",
    image: napoleon,
  },
  {
    slug: "tour-eiffel",
    year: 1888,
    date: "1888",
    short: "Tour Eiffel",
    place: "Paris, Champ-de-Mars",
    title: "Riveteur à cent mètres",
    description:
      "Casquette, gilet et clé à la ceinture : Papy fait partie des ouvriers qui assemblent les 18 000 pièces de la tour de M. Eiffel. Sans harnais, sans vertige, et avec une vue imprenable sur la Seine.",
    alt: "Photo sépia : Papy, casquette sur la tête, se tient aux poutrelles de la tour Eiffel en construction, Paris et la Seine en contrebas.",
    image: eiffel,
  },
  {
    slug: "lenine-staline",
    year: 1922,
    date: "1922",
    short: "1922",
    place: "Gorki, près de Moscou",
    title: "Le troisième homme",
    description:
      "Lénine et Staline posent de part et d’autre d’un camarade au regard étonné. L’homme du milieu disparaîtra mystérieusement des tirages officiels, une habitude de l’époque. Le négatif original, lui, a survécu.",
    alt: "Photo noir et blanc : Papy, assis entre Lénine et Staline, passe un bras derrière eux.",
    image: lenine,
  },
  {
    slug: "distillerie-ricard",
    year: 1932,
    date: "1932",
    short: "1932",
    place: "Marseille",
    title: "Aux distilleries Paul Ricard",
    description:
      "Paul Ricard lance son pastis en 1932. Le premier ouvrier en bleu de travail, c’est Papy, recruté pour son palais exceptionnel. Sa fidélité à la marque ne s’est jamais démentie.",
    alt: "Photo ancienne : Papy en veste de travail pose avec Paul Ricard devant les distilleries Ricard de Marseille.",
    image: ricard,
  },
  {
    slug: "hotel-du-parc",
    year: 1940.5,
    date: "juillet 1940",
    short: "Vichy",
    place: "Vichy, Hôtel du Parc",
    title: "Quelques questions à l’Hôtel du Parc",
    description:
      "Le maréchal Pétain s’installe à l’Hôtel du Parc. Papy, chapeau à la main et index pointé, a visiblement quelques objections. L’Histoire retiendra qu’il n’est pas resté.",
    alt: "Photo noir et blanc devant l’Hôtel du Parc à Vichy : Papy, l’air incrédule, pointe du doigt le maréchal Pétain.",
    image: hotelDuParc,
  },
  {
    slug: "france-libre",
    year: 1940.54,
    date: "14 juillet 1940",
    short: "Londres",
    place: "Londres",
    title: "Revue de la France libre",
    description:
      "Quatre jours après Vichy, Papy a choisi son camp. Aux côtés du général de Gaulle, il passe en revue les premiers volontaires de la France libre. Pardessus impeccable, chapeau à la main : il n’a plus manqué un 14 Juillet depuis.",
    alt: "Photo noir et blanc : Papy en pardessus marche aux côtés du général de Gaulle devant une rangée de soldats au garde-à-vous.",
    image: franceLibre,
  },
  {
    slug: "los-alamos",
    year: 1944,
    date: "1944",
    short: "Los Alamos",
    place: "Los Alamos, Nouveau-Mexique",
    title: "Projet Y",
    description:
      "Au tableau : implosion, masse critique, uranium 235. Papy explique la géométrie des lentilles explosives aux physiciens du projet Manhattan, qui prennent des notes. Le dossier est resté classé secret défense jusqu’à la mise en ligne de ce site.",
    alt: "Dans un bureau de Los Alamos, Papy en veste de tweed se tient devant un tableau noir couvert d’équations, face à des scientifiques.",
    image: losAlamos,
  },
  {
    slug: "eniac",
    year: 1946,
    date: "1946",
    short: "ENIAC",
    place: "Philadelphie",
    title: "Ingénieur sur l’ENIAC",
    description:
      "Trente tonnes, 17 468 tubes à vide et des kilomètres de câbles : le premier ordinateur électronique est présenté au public. Papy en assure la maintenance, carnet à la main. Quand la machine plante, il débranche un câble, le rebranche, et ça repart.",
    alt: "Photo noir et blanc : Papy en blouse blanche branche des câbles sur les panneaux de l’ENIAC, un carnet à la main.",
    image: eniac,
  },
  {
    slug: "magicien",
    year: 1954,
    date: "1954",
    short: "Terre du Milieu",
    place: "Terre du Milieu",
    title: "Un magicien n’est jamais en retard",
    description:
      "Tolkien publie La Communauté de l’anneau. Sur le panneau indicateur : Fondcombe, Mordor… et mauresque, la seule direction que Papy ait jamais sérieusement envisagée. Le paquet de cigarettes dans la besace, lui, ne vient pas de la Comté.",
    alt: "Papy en magicien à longue barbe grise et chapeau pointu fume une cigarette, appuyé sur un bâton, près d’un panneau « Rivendell, Mordor, Mauresque ».",
    image: magicien,
  },
  {
    slug: "bonne-nuit-les-petits",
    year: 1962,
    date: "1962",
    short: "Nounours",
    place: "Studios de la RTF",
    title: "Bonne nuit les petits",
    description:
      "Nicolas et Pimprenelle sont en pyjama, le marchand de sable va passer et Nounours joue l’air du soir à la flûte. On a longtemps su qu’il y avait quelqu’un dans le costume. On sait désormais qui.",
    alt: "Papy dans un costume d’ours brun joue de la flûte entre les marionnettes Nicolas et Pimprenelle, sous un ciel étoilé « Bonne nuit les petits ».",
    image: nounours,
  },
  {
    slug: "apollo-11",
    year: 1969,
    date: "21 juillet 1969",
    short: "Apollo 11",
    place: "Mer de la Tranquillité, la Lune",
    title: "Un grand pas pour le pastis",
    description:
      "Neil Armstrong vient de poser le pied sur la Lune ; Papy a déjà planté le parasol et sorti le verre. La NASA a toujours affirmé que deux hommes avaient marché sur la Lune ce jour-là. Elle n’a jamais précisé lesquels.",
    alt: "Sur la Lune, Papy en combinaison d’astronaute lève le pouce sous un parasol Ricard, à côté de Neil Armstrong, la Terre dans le ciel noir.",
    image: apollo,
  },
  {
    slug: "vol-lunaire",
    year: 1982,
    date: "1982",
    short: "1982",
    place: "Quelque part en Californie",
    title: "Vol au clair de lune",
    description:
      "Un vélo, une caisse en plastique et une couverture : l’extraterrestre rentre chez lui, et Papy a pris la place d’Elliott dans le panier. Il n’a jamais voulu dire s’il avait téléphoné maison.",
    alt: "Un extraterrestre pédale sur un vélo volant devant la pleine lune ; Papy, emmitouflé dans une couverture, est assis dans le panier.",
    image: volLunaire,
  },
  {
    slug: "seance-de-cinema",
    year: REFERENCE_YEAR,
    date: "Aujourd’hui",
    short: "Aujourd’hui",
    place: "Rang C, place 12",
    title: "Séance de rattrapage",
    description:
      "Après 13,8 milliards d’années d’aventures, Papy s’offre enfin une soirée tranquille : un plaid, un seau de pop-corn format familial, et toute l’Histoire à revoir sur grand écran. Il connaît déjà la fin.",
    alt: "Dans une salle de cinéma, Papy emmitouflé dans un plaid dévore un énorme seau de pop-corn, l’air captivé.",
    image: cinema,
  },
];
