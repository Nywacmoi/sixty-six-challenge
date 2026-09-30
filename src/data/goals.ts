import { ROUTINE_TEMPLATES } from './templates';

// The onboarding question — "Ton objectif principal ?" — and what the app
// does with the answer.
//
// It used to do nothing. The goal was saved to the profile and never read
// again, while the button stayed disabled until you'd answered: the app
// insisted on a question whose answer it then threw away. Day 1 opened on
// an empty screen, and the morning check-in offered the first four habits
// of the catalogue to everyone, so "Productivité" got suggested sport.
//
// Now the answer picks a starter routine: three habits, offered pre-ticked
// by the check-in and again by the empty screen if that was skipped.
export const GOALS = [
  { id: 'sport', icon: 'walk', label: 'Être plus sportif' },
  { id: 'discipline', icon: 'bulb', label: 'Plus de discipline' },
  { id: 'wellbeing', icon: 'leaf', label: 'Bien-être & mental' },
  { id: 'productivity', icon: 'locate', label: 'Productivité' },
  { id: 'all', icon: 'sparkles', label: 'Un peu de tout' },
];

export type StarterHabit = { name: string; icon: string; color: string };

export type StarterRoutine = {
  /** Answers the onboarding question back, so the suggestion reads as the
   *  app having listened rather than as a catalogue. */
  lead: string;
  habits: StarterHabit[];
};

const templateHabits = (id: string): StarterHabit[] =>
  ROUTINE_TEMPLATES.find((t) => t.id === id)?.habits ?? [];

const habitNamed = (templateId: string, name: string) =>
  templateHabits(templateId).find((h) => h.name === name);

export function starterRoutine(goal: string | null | undefined): StarterRoutine | null {
  switch (goal) {
    case 'sport':
      return { lead: 'Pour bouger plus, voilà de quoi commencer.', habits: templateHabits('sport') };
    case 'discipline':
      // A morning routine rather than a list of hard things: discipline is
      // won in the first hour, and these three are the easiest to keep.
      return { lead: 'La discipline se gagne le matin. Voilà de quoi commencer.', habits: templateHabits('morning') };
    case 'wellbeing':
      return { lead: 'Pour ton bien-être, voilà de quoi commencer.', habits: templateHabits('wellbeing') };
    case 'productivity':
      return { lead: 'Pour ta productivité, voilà de quoi commencer.', habits: templateHabits('productivity') };
    case 'all': {
      const habits = [
        habitNamed('sport', 'Séance de sport'),
        habitNamed('wellbeing', 'Méditation'),
        habitNamed('productivity', 'Planifier sa journée'),
      ].filter((h): h is StarterHabit => h != null);
      return {
        lead: 'Un peu de tout : une habitude pour le corps, une pour la tête, une pour la journée.',
        habits,
      };
    }
    default:
      // Profiles from before the question existed, or anyone who somehow
      // skipped it: the plain empty state and the catalogue order still work.
      return null;
  }
}
