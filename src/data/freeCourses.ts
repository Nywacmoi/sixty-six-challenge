export type FreeResource = { name: string; description: string; url: string };

export const LANGUAGE_RESOURCES: FreeResource[] = [
  { name: 'Duolingo', description: "Leçons courtes et gratuites, parfait pour la régularité", url: 'https://www.duolingo.com' },
  { name: 'italki', description: 'Échange linguistique et cours avec des locuteurs natifs', url: 'https://www.italki.com' },
  { name: 'Anki', description: 'Fiches de vocabulaire à répétition espacée, gratuit', url: 'https://apps.ankiweb.net' },
];

export const SKILL_RESOURCES: FreeResource[] = [
  { name: 'OpenClassrooms', description: 'Cours gratuits en français, tous niveaux', url: 'https://openclassrooms.com' },
  { name: 'Khan Academy', description: "Cours gratuits, du collège à l'université", url: 'https://fr.khanacademy.org' },
  { name: 'freeCodeCamp', description: 'Apprendre à coder gratuitement', url: 'https://www.freecodecamp.org' },
  { name: 'Coursera', description: "Cours d'universités, accès gratuit en mode audit", url: 'https://www.coursera.org' },
];
