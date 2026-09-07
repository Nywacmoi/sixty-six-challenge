import { AchievementDef } from '../types';

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first-day', title: 'Premier pas', description: 'Termine ton premier jour', icon: 'footsteps', target: 1, kind: 'dayReached' },
  { id: 'day-3', title: 'Ça devient sérieux', description: 'Atteins le jour 3', icon: 'flash', target: 3, kind: 'dayReached' },
  { id: 'day-7', title: 'Une semaine', description: 'Atteins le jour 7', icon: 'calendar', target: 7, kind: 'dayReached' },
  { id: 'day-14', title: 'Deux semaines solides', description: 'Atteins le jour 14', icon: 'shield-checkmark', target: 14, kind: 'dayReached' },
  { id: 'day-21', title: "L'habitude s'installe", description: 'Atteins le jour 21', icon: 'trending-up', target: 21, kind: 'dayReached' },
  { id: 'day-33', title: 'Un tiers du chemin', description: 'Atteins le jour 33', icon: 'flag', target: 33, kind: 'dayReached' },
  { id: 'day-50', title: 'À mi-parcours', description: 'Atteins le jour 50', icon: 'rocket', target: 50, kind: 'dayReached' },
  { id: 'day-75', title: 'Presque indéniable', description: 'Atteins le jour 75', icon: 'planet', target: 75, kind: 'dayReached' },
  { id: 'day-99', title: 'Indéniable', description: 'Termine le défi complet de 99 jours', icon: 'trophy', target: 99, kind: 'dayReached' },
  { id: 'streak-7', title: 'Maître des séries', description: 'Une série de 7 jours sur une habitude', icon: 'flame', target: 7, kind: 'streak' },
  { id: 'streak-30', title: 'Inarrêtable', description: 'Une série de 30 jours sur une habitude', icon: 'flame', target: 30, kind: 'streak' },
  { id: 'total-10', title: 'Bien lancé', description: '10 check-ins au total', icon: 'checkmark-done', target: 10, kind: 'totalCompletions' },
  { id: 'total-100', title: 'Club des 100', description: '100 check-ins au total', icon: 'medal', target: 100, kind: 'totalCompletions' },
  { id: 'level-5', title: 'Niveau 5', description: 'Atteins le niveau 5', icon: 'star', target: 5, kind: 'level' },
  { id: 'level-10', title: 'Niveau 10', description: 'Atteins le niveau 10', icon: 'star', target: 10, kind: 'level' },
  { id: 'level-20', title: 'Niveau 20', description: 'Atteins le niveau 20', icon: 'star', target: 20, kind: 'level' },
  { id: 'perfect-day', title: 'Journée parfaite', description: 'Complète toutes tes habitudes en une journée', icon: 'sparkles', target: 1, kind: 'perfectDay' },
];
