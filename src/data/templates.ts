export type RoutineTemplateHabit = { name: string; icon: string; color: string };

export type ProgramWeek = { label: string; focus: string; actions: string[] };
export type RoutineProgram = { subtitle: string; weeks: ProgramWeek[] };

export type RoutineTemplate = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  habits: RoutineTemplateHabit[];
  program?: RoutineProgram;
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'morning',
    title: 'Routine matinale',
    emoji: 'partly-sunny',
    description: 'Bien démarrer chaque journée',
    habits: [
      { name: "Boire un verre d'eau", icon: 'water', color: '#4E9BFF' },
      { name: 'Étirements', icon: 'body', color: '#3ECF5B' },
      { name: 'Pas de téléphone au réveil', icon: 'phone-portrait', color: '#FF4D8D' },
    ],
    program: {
      subtitle: '4 semaines pour ancrer un vrai rituel du matin',
      weeks: [
        {
          label: 'Semaine 1',
          focus: 'Un seul geste, sans se mettre la pression',
          actions: [
            "Bois ton verre d'eau avant même de prendre ton téléphone",
            "Laisse le téléphone en dehors de la chambre le soir",
          ],
        },
        {
          label: 'Semaine 2',
          focus: 'Ajouter le mouvement',
          actions: [
            '5 minutes d’étirements dès le levé, même courtes',
            'Garde le même ordre de gestes chaque matin',
          ],
        },
        {
          label: 'Semaine 3',
          focus: 'Tenir sans les week-ends',
          actions: [
            'Fais la routine aussi le samedi et le dimanche',
            'Repère le moment de la journée où tu es le plus motivé et avance ton réveil de 10 min si besoin',
          ],
        },
        {
          label: 'Semaine 4',
          focus: 'Rendre ça automatique',
          actions: [
            'Enchaîne les 3 habitudes sans y penser, dans le même ordre',
            'Note comment tu te sens au bout de 4 semaines',
          ],
        },
      ],
    },
  },
  {
    id: 'sport',
    title: 'Routine sportive',
    emoji: 'fitness',
    description: 'Bouger tous les jours',
    habits: [
      { name: 'Séance de sport', icon: 'barbell', color: '#FF5A2E' },
      { name: '10 000 pas', icon: 'walk', color: '#2EC4B6' },
      { name: 'Étirements', icon: 'body', color: '#3ECF5B' },
    ],
    program: {
      subtitle: 'Programme sportif progressif sur 4 semaines',
      weeks: [
        {
          label: 'Semaine 1 — Reprise en douceur',
          focus: '3 séances de 20-30 min',
          actions: [
            'Lundi / Mercredi / Vendredi : cardio léger (marche rapide, vélo, natation)',
            'Vise 6 000 à 8 000 pas par jour',
            '5 min d’étirements après chaque séance',
          ],
        },
        {
          label: 'Semaine 2 — Monter en intensité',
          focus: '4 séances, 30-40 min',
          actions: [
            'Ajoute une séance de renforcement (pompes, squats, gainage)',
            'Vise 8 000 à 10 000 pas par jour',
            'Une vraie séance d’étirements de 10 min, 2x/semaine',
          ],
        },
        {
          label: 'Semaine 3 — Varier les efforts',
          focus: '4-5 séances, alterner cardio et renfo',
          actions: [
            '2 séances cardio + 2 séances renforcement musculaire',
            '10 000 pas par jour en objectif fixe',
            'Ajoute une séance de mobilité ou yoga',
          ],
        },
        {
          label: 'Semaine 4 — Consolider',
          focus: 'Tenir le rythme sans te blesser',
          actions: [
            'Garde le même volume que la semaine 3',
            'Une journée de récupération active (marche, étirements) minimum',
            'Note tes progrès : distance, poids, sensations',
          ],
        },
      ],
    },
  },
  {
    id: 'wellbeing',
    title: 'Bien-être & mental',
    emoji: 'leaf',
    description: "Prendre soin de ton esprit",
    habits: [
      { name: 'Méditation', icon: 'leaf', color: '#B15AFF' },
      { name: 'Écriture / journaling', icon: 'pencil', color: '#FFC542' },
      { name: 'Sommeil régulier', icon: 'bed', color: '#4E9BFF' },
    ],
    program: {
      subtitle: '4 semaines pour calmer le mental et mieux dormir',
      weeks: [
        {
          label: 'Semaine 1',
          focus: 'Découvrir 5 minutes de calme',
          actions: [
            '5 minutes de respiration ou méditation guidée par jour',
            'Note 1 phrase le soir sur ta journée',
            'Fixe une heure de coucher et couche-toi à cette heure-là',
          ],
        },
        {
          label: 'Semaine 2',
          focus: 'Approfondir l’écriture',
          actions: [
            '10 minutes de méditation',
            'Journaling : 3 choses positives de la journée',
            'Coupe les écrans 30 min avant le coucher',
          ],
        },
        {
          label: 'Semaine 3',
          focus: 'Créer un vrai rituel du soir',
          actions: [
            'Enchaîne méditation puis journaling au même moment chaque soir',
            'Vise un horaire de sommeil stable, y compris le week-end',
          ],
        },
        {
          label: 'Semaine 4',
          focus: 'Observer les effets',
          actions: [
            'Relis tes notes de la semaine 1 à aujourd’hui',
            'Identifie ce qui t’a le plus aidé à mieux dormir',
          ],
        },
      ],
    },
  },
  {
    id: 'productivity',
    title: 'Productivité',
    emoji: 'locate',
    description: 'Avancer sur tes objectifs',
    habits: [
      { name: 'Lire 20 pages', icon: 'book', color: '#4E9BFF' },
      { name: "Pas d'écran le soir", icon: 'phone-portrait', color: '#FF4D8D' },
      { name: 'Planifier sa journée', icon: 'calendar', color: '#FFC542' },
    ],
    program: {
      subtitle: '4 semaines pour retrouver du focus',
      weeks: [
        {
          label: 'Semaine 1',
          focus: 'Planifier avant d’agir',
          actions: [
            'Chaque matin, note tes 3 priorités du jour avant d’ouvrir tes messages',
            '20 pages de lecture, peu importe quand',
          ],
        },
        {
          label: 'Semaine 2',
          focus: 'Protéger ta soirée',
          actions: [
            'Coupe les écrans non essentiels après le dîner',
            'Planifie ta journée la veille au soir plutôt que le matin',
          ],
        },
        {
          label: 'Semaine 3',
          focus: 'Réduire les distractions',
          actions: [
            'Regroupe tes 3 priorités par ordre d’importance, fais la plus dure en premier',
            'Remplace 20 min d’écran le soir par de la lecture',
          ],
        },
        {
          label: 'Semaine 4',
          focus: 'Faire le bilan',
          actions: [
            'Compare ta charge mentale à celle du début du mois',
            'Garde uniquement les habitudes qui t’ont vraiment aidé',
          ],
        },
      ],
    },
  },
  {
    id: 'health',
    title: 'Alimentation saine',
    emoji: 'nutrition',
    description: 'Mieux manger au quotidien',
    habits: [
      { name: 'Sans sucre ajouté', icon: 'restaurant', color: '#FF5A2E' },
      { name: '5 fruits et légumes', icon: 'nutrition', color: '#3ECF5B' },
      { name: "Boire 2L d'eau", icon: 'water', color: '#4E9BFF' },
    ],
    program: {
      subtitle: '4 semaines pour rééquilibrer ton alimentation',
      weeks: [
        {
          label: 'Semaine 1',
          focus: 'Ajouter avant de retirer',
          actions: [
            'Ajoute 1 fruit ou légume à chaque repas',
            'Vise 1,5L d’eau par jour minimum',
          ],
        },
        {
          label: 'Semaine 2',
          focus: 'Réduire le sucre ajouté',
          actions: [
            'Remplace les boissons sucrées par de l’eau ou infusions',
            'Vise 5 portions de fruits/légumes par jour',
          ],
        },
        {
          label: 'Semaine 3',
          focus: 'Tenir sans frustration',
          actions: [
            'Autorise-toi 1 écart par semaine sans culpabiliser',
            '2L d’eau par jour, répartis sur la journée',
          ],
        },
        {
          label: 'Semaine 4',
          focus: 'Ancrer les nouveaux réflexes',
          actions: [
            'Prépare tes repas de la semaine à l’avance une fois',
            'Note les changements : énergie, digestion, sommeil',
          ],
        },
      ],
    },
  },
  {
    id: 'evening',
    title: 'Routine du soir',
    emoji: 'moon',
    description: 'Bien terminer la journée',
    habits: [
      { name: "Pas d'écran avant de dormir", icon: 'phone-portrait', color: '#B15AFF' },
      { name: 'Lecture avant dodo', icon: 'book', color: '#4E9BFF' },
      { name: 'Coucher à heure fixe', icon: 'bed', color: '#2EC4B6' },
    ],
    program: {
      subtitle: '4 semaines pour un vrai rituel de fin de journée',
      weeks: [
        {
          label: 'Semaine 1',
          focus: 'Un signal clair de fin de journée',
          actions: [
            'Fixe une heure de coucher et couche-toi à cette heure, même si tu ne dors pas tout de suite',
            'Pose le téléphone hors de la chambre (ou en mode avion) 30 minutes avant',
          ],
        },
        {
          label: 'Semaine 2',
          focus: 'Remplacer l’écran par la lecture',
          actions: [
            'Lis au moins 10 pages avant de dormir, à la place du téléphone',
            'Garde la même heure de coucher, y compris le week-end',
          ],
        },
        {
          label: 'Semaine 3',
          focus: 'Creuser la coupure écran',
          actions: [
            'Coupe les écrans 1h avant le coucher, pas juste une fois au lit',
            'Ajoute un petit rituel avant la lecture (tisane, lumière tamisée…)',
          ],
        },
        {
          label: 'Semaine 4',
          focus: 'Consolider le rituel',
          actions: [
            'Enchaîne les 3 habitudes dans le même ordre chaque soir, sans y penser',
            'Compare ta qualité de sommeil ressentie à celle du début du mois',
          ],
        },
      ],
    },
  },
  {
    id: 'jawline',
    title: 'Jawline',
    emoji: 'accessibility',
    description: 'Posture, mâchoire et fermeté du visage',
    habits: [
      { name: 'Mewing (posture linguale)', icon: 'accessibility', color: '#4E9BFF' },
      { name: 'Exercices mâchoire', icon: 'accessibility', color: '#FF5A2E' },
    ],
    program: {
      subtitle: '4 semaines pour ancrer la posture et voir les premiers effets',
      weeks: [
        {
          label: 'Semaine 1',
          focus: 'Apprendre le bon geste',
          actions: [
            'Positionne la langue au palais (mewing) dès que tu y penses dans la journée',
            '5 minutes d’exercices de mâchoire, mouvements lents et contrôlés',
          ],
        },
        {
          label: 'Semaine 2',
          focus: 'Tenir la posture plus longtemps',
          actions: [
            'Vise à garder le mewing pendant les activités passives (téléphone, télé, marche)',
            'Passe à 8-10 minutes d’exercices, ajoute des répétitions',
          ],
        },
        {
          label: 'Semaine 3',
          focus: 'Mesurer les progrès',
          actions: [
            'Prends une mesure du tour de mâchoire chaque semaine (Suivi corporel)',
            'Ajoute une photo de profil pour comparer visuellement au fil des semaines',
          ],
        },
        {
          label: 'Semaine 4',
          focus: 'Rendre ça automatique',
          actions: [
            'Le mewing doit devenir un réflexe permanent, pas un exercice ponctuel',
            'Note si tu remarques une différence de fermeté ou de posture',
          ],
        },
      ],
    },
  },
];
