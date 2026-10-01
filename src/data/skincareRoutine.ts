// The skincare module's guided routine. Deliberately generic and short: four
// steps in the morning, three at night, in the order they're applied — the
// version a beginner can actually keep for 99 days, not a ten-step regimen.
// Nothing here names a product or treats a condition; anything beyond basic
// care is a dermatologist's call, and the AI analysis says so when it sees
// a reason to.
export type SkincareStep = { id: string; label: string; hint: string };
export type SkincareSession = { id: 'matin' | 'soir'; label: string; icon: string; steps: SkincareStep[] };

export const SKINCARE_SESSIONS: SkincareSession[] = [
  {
    id: 'matin',
    label: 'Matin',
    icon: 'partly-sunny',
    steps: [
      { id: 'nettoyer', label: 'Nettoyer', hint: 'Eau tiède ou nettoyant doux, 30 secondes' },
      { id: 'serum', label: 'Sérum', hint: 'Facultatif — hydratant ou vitamine C' },
      { id: 'hydrater', label: 'Hydrater', hint: 'Une crème adaptée à ton type de peau' },
      { id: 'spf', label: 'Protéger', hint: 'SPF 30 minimum, même quand il fait gris' },
    ],
  },
  {
    id: 'soir',
    label: 'Soir',
    icon: 'moon',
    steps: [
      { id: 'nettoyer', label: 'Nettoyer', hint: 'Deux fois si tu as mis de la crème solaire' },
      { id: 'traiter', label: 'Traiter', hint: '2 à 3 soirs par semaine — un actif doux, testé sur une petite zone' },
      { id: 'hydrater', label: 'Hydrater', hint: 'Une crème un peu plus riche que le matin' },
    ],
  },
];
