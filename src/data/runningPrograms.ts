// Mirrors workoutSplits.ts's shape (variants: Segment[][], rotated daily
// via dailyIndex) but for running — segments carry a duration/pace instead
// of a rep count, since a run is measured in time and effort, not sets.
export type RunningSegment = { name: string; duration: string; pace?: string; tip?: string };
export type RunningProgram = { id: string; label: string; emoji: string; variants: RunningSegment[][] };

export const RUNNING_PROGRAMS: RunningProgram[] = [
  {
    id: 'endurance',
    label: 'Endurance',
    emoji: 'infinite',
    variants: [
      [
        { name: 'Échauffement', duration: '10 min', pace: 'Marche rapide', tip: 'Prépare les articulations avant d’accélérer.' },
        { name: 'Footing continu', duration: '30 min', pace: 'Allure confortable', tip: 'Tu dois pouvoir parler sans être essoufflé.' },
        { name: 'Retour au calme', duration: '5 min', pace: 'Marche', tip: 'Marche lentement pour faire redescendre le rythme cardiaque.' },
      ],
      [
        { name: 'Échauffement', duration: '10 min', pace: 'Marche rapide' },
        { name: 'Footing continu', duration: '40 min', pace: 'Allure confortable', tip: 'Augmente légèrement la distance par rapport à la dernière séance.' },
        { name: 'Étirements', duration: '10 min', tip: 'Mollets, ischios, quadriceps.' },
      ],
    ],
  },
  {
    id: 'interval',
    label: 'Fractionné',
    emoji: 'flash',
    variants: [
      [
        { name: 'Échauffement', duration: '10 min', pace: 'Footing léger' },
        { name: '8x400m', duration: '20 min', pace: 'Allure rapide', tip: 'Récupération 1min30 en marche entre chaque répétition.' },
        { name: 'Retour au calme', duration: '10 min', pace: 'Marche' },
      ],
      [
        { name: 'Échauffement', duration: '10 min', pace: 'Footing léger' },
        { name: '30/30 x10', duration: '10 min', pace: '30s rapide / 30s récup', tip: 'Effort maximal sur les 30 secondes rapides.' },
        { name: 'Footing de récupération', duration: '15 min', pace: 'Allure lente' },
      ],
    ],
  },
  {
    id: 'circuit',
    label: 'Circuit training',
    emoji: 'sync',
    variants: [
      [
        { name: 'Course', duration: '5 min', pace: 'Allure modérée' },
        { name: 'Squats', duration: '1 min', tip: 'Descends jusqu’à 90°, dos droit.' },
        { name: 'Pompes', duration: '1 min' },
        { name: 'Course', duration: '5 min', pace: 'Allure modérée' },
        { name: 'Gainage', duration: '1 min' },
      ],
      [
        { name: 'Course', duration: '5 min', pace: 'Allure modérée' },
        { name: 'Burpees', duration: '1 min' },
        { name: 'Fentes', duration: '1 min' },
        { name: 'Course', duration: '5 min', pace: 'Allure modérée' },
        { name: 'Mountain climbers', duration: '1 min' },
      ],
    ],
  },
  {
    id: 'beginner',
    label: 'Découverte',
    emoji: 'leaf-outline',
    variants: [
      [
        { name: 'Marche', duration: '5 min' },
        { name: 'Course / marche', duration: '20 min', pace: '1 min course, 2 min marche', tip: 'Répète l’enchaînement, sans forcer.' },
        { name: 'Marche', duration: '5 min' },
      ],
      [
        { name: 'Marche', duration: '5 min' },
        { name: 'Course / marche', duration: '20 min', pace: '2 min course, 1 min marche', tip: 'Allonge progressivement les phases de course.' },
        { name: 'Étirements', duration: '5 min' },
      ],
    ],
  },
];
