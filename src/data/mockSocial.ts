import { FeedPost, Squad } from '../types';

export const MOCK_FEED: FeedPost[] = [
  {
    id: 'f1',
    userName: 'Lina',
    avatarColor: '#FF5A2E',
    habitName: 'Course matinale',
    message: 'Jour 41. Les jambes sont mortes mais la série est vivante.',
    timeAgo: '12m',
    likes: 18,
    streak: 41,
  },
  {
    id: 'f2',
    userName: 'Marcus',
    avatarColor: '#3ECF5B',
    habitName: 'Sans sucre',
    message: "J'ai refusé le gâteau à la fête du bureau. Indéniable.",
    timeAgo: '48m',
    likes: 32,
    streak: 27,
  },
  {
    id: 'f3',
    userName: 'Amélie',
    avatarColor: '#4E9BFF',
    habitName: '20 pages de lecture',
    message: "J'ai fini mon troisième livre depuis le début du défi.",
    timeAgo: '2h',
    likes: 9,
    streak: 99,
  },
  {
    id: 'f4',
    userName: 'Sofiane',
    avatarColor: '#FFC542',
    habitName: 'Douche froide',
    message: "Jour 3 et je crie encore à chaque fois. J'abandonne pas.",
    timeAgo: '5h',
    likes: 41,
    streak: 3,
  },
];

export const MOCK_SQUADS: Squad[] = [
  {
    id: 's1',
    name: 'Sans Excuses',
    emoji: '🔥',
    memberCount: 6,
    members: [
      { name: 'Toi', avatarColor: '#005FFE', streak: 0 },
      { name: 'Lina', avatarColor: '#FF5A2E', streak: 41 },
      { name: 'Marcus', avatarColor: '#3ECF5B', streak: 27 },
      { name: 'Amélie', avatarColor: '#4E9BFF', streak: 99 },
    ],
  },
  {
    id: 's2',
    name: 'Lève-tôt',
    emoji: '🌅',
    memberCount: 4,
    members: [
      { name: 'Toi', avatarColor: '#005FFE', streak: 0 },
      { name: 'Sofiane', avatarColor: '#FFC542', streak: 3 },
      { name: 'Nadia', avatarColor: '#B15AFF', streak: 19 },
    ],
  },
];
