import { Ionicons } from '@expo/vector-icons';
import { Habit } from '../types';
import { isSportHabit, isMeditationHabit, isNutritionHabit, isReadingHabit, isJawlineHabit } from '../utils/habitCategories';

export type AssistantContext = { navigation: any; habits: Habit[] };

export type AssistantEntry = {
  id: string;
  label: string;
  description: string;
  keywords: string[];
  icon: keyof typeof Ionicons.glyphMap;
  run: (ctx: AssistantContext) => void;
};

function goToCategoryHabit(ctx: AssistantContext, matcher: (name: string, icon: string) => boolean) {
  const habit = ctx.habits.find((h) => !h.archived && matcher(h.name, h.icon));
  if (habit) ctx.navigation.navigate('HabitDetail', { habitId: habit.id });
  else ctx.navigation.navigate('AddHabit', { initialTab: 'template' });
}

export const ASSISTANT_ENTRIES: AssistantEntry[] = [
  {
    id: 'add-habit',
    label: 'Ajouter une habitude',
    description: "Créer une nouvelle habitude, seule ou depuis une routine",
    keywords: ['ajouter', 'créer', 'nouvelle', 'habitude', 'routine'],
    icon: 'add-circle-outline',
    run: (ctx) => ctx.navigation.navigate('AddHabit'),
  },
  {
    id: 'templates',
    label: 'Modèles de routines',
    description: 'Routines prêtes à l’emploi (sport, sommeil, alimentation…)',
    keywords: ['modèle', 'routine', 'template', 'suggestion'],
    icon: 'sparkles-outline',
    run: (ctx) => ctx.navigation.navigate('AddHabit', { initialTab: 'template' }),
  },
  {
    id: 'sport-program',
    label: 'Mon programme sportif',
    description: 'Séance du jour, planning et suivi corporel',
    keywords: ['sport', 'muscu', 'musculation', 'gym', 'fitness', 'programme', 'séance'],
    icon: 'barbell-outline',
    run: (ctx) => goToCategoryHabit(ctx, isSportHabit),
  },
  {
    id: 'jawline-program',
    label: 'Programme jawline',
    description: 'Mewing, renforcement mâchoire, suivi de mensurations',
    keywords: ['jawline', 'mewing', 'mâchoire', 'menton'],
    icon: 'body-outline',
    run: (ctx) => goToCategoryHabit(ctx, isJawlineHabit),
  },
  {
    id: 'meditation-program',
    label: 'Séances de méditation',
    description: 'Respiration, scan corporel, pleine conscience',
    keywords: ['méditation', 'méditer', 'respiration', 'calme', 'stress'],
    icon: 'leaf-outline',
    run: (ctx) => goToCategoryHabit(ctx, isMeditationHabit),
  },
  {
    id: 'nutrition-program',
    label: 'Idées de repas',
    description: 'Suggestions par moment de la journée',
    keywords: ['repas', 'manger', 'nutrition', 'alimentation', 'recette'],
    icon: 'restaurant-outline',
    run: (ctx) => goToCategoryHabit(ctx, isNutritionHabit),
  },
  {
    id: 'reading-program',
    label: 'Objectif de lecture',
    description: 'Choisis un objectif du jour (temps, pages, chapitre)',
    keywords: ['lecture', 'lire', 'livre'],
    icon: 'book-outline',
    run: (ctx) => goToCategoryHabit(ctx, isReadingHabit),
  },
  {
    id: 'progress',
    label: 'Ma progression',
    description: 'Vue d’ensemble et statistiques par habitude',
    keywords: ['progression', 'statistiques', 'stats', 'historique'],
    icon: 'stats-chart-outline',
    run: (ctx) => ctx.navigation.navigate('Progress'),
  },
  {
    id: 'achievements',
    label: 'Mes succès',
    description: 'Succès débloqués et à venir',
    keywords: ['succès', 'achievement', 'trophée', 'récompense'],
    icon: 'trophy-outline',
    run: (ctx) => ctx.navigation.navigate('Achievements'),
  },
  {
    id: 'friends',
    label: 'Ajouter un ami',
    description: 'Voir la progression de tes amis',
    keywords: ['ami', 'amis', 'social', 'suivre', 'follow'],
    icon: 'person-add-outline',
    run: (ctx) => ctx.navigation.navigate('Social'),
  },
  {
    id: 'groups',
    label: 'Créer ou rejoindre un groupe',
    description: 'Un code à partager pour vous motiver ensemble',
    keywords: ['groupe', 'squad', 'équipe', 'rejoindre', 'code'],
    icon: 'people-outline',
    run: (ctx) => ctx.navigation.navigate('Social'),
  },
  {
    id: 'reminders',
    label: 'Régler les rappels quotidiens',
    description: "Choisis l'heure à laquelle l'appli te relance",
    keywords: ['rappel', 'notification', 'heure', 'alerte'],
    icon: 'notifications-outline',
    run: (ctx) => ctx.navigation.navigate('Profile'),
  },
  {
    id: 'backup',
    label: 'Sauvegarder mes données',
    description: 'Exporter ou restaurer une sauvegarde',
    keywords: ['sauvegarde', 'backup', 'export', 'import', 'restaurer'],
    icon: 'download-outline',
    run: (ctx) => ctx.navigation.navigate('Profile'),
  },
  {
    id: 'theme',
    label: 'Mode sombre',
    description: 'Basculer entre thème clair et sombre',
    keywords: ['sombre', 'clair', 'thème', 'dark', 'mode'],
    icon: 'moon-outline',
    run: (ctx) => ctx.navigation.navigate('Profile'),
  },
  {
    id: 'restart',
    label: 'Redémarrer le défi',
    description: 'Remettre le compteur de jours à 1',
    keywords: ['redémarrer', 'recommencer', 'reset', 'jour 1'],
    icon: 'refresh-outline',
    run: (ctx) => ctx.navigation.navigate('Profile'),
  },
  {
    id: 'profile',
    label: 'Mon profil',
    description: 'Pseudo, niveau, XP et réglages',
    keywords: ['profil', 'pseudo', 'niveau', 'xp', 'compte'],
    icon: 'person-circle-outline',
    run: (ctx) => ctx.navigation.navigate('Profile'),
  },
];
