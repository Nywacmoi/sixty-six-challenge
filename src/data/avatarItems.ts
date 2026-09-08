export type AvatarSlot = 'head' | 'face' | 'outfit' | 'legs' | 'feet' | 'special';

export type AvatarItem = {
  id: string;
  name: string;
  emoji: string;
  slot: AvatarSlot;
  unlockDay: number;
};

// Unlock days match the existing day-N achievements (day-3, day-7, ...) so
// unlocking an outfit piece always lines up with an achievement toast the
// person already gets — one milestone, two rewards. Most milestones now
// unlock a piece for two different slots at once, so the wardrobe actually
// covers the whole body instead of just the head.
export const AVATAR_ITEMS: AvatarItem[] = [
  { id: 'headband', name: 'Bandeau', emoji: '🎽', slot: 'head', unlockDay: 3 },
  { id: 'tshirt', name: 'T-shirt', emoji: '👕', slot: 'outfit', unlockDay: 3 },

  { id: 'cap', name: 'Casquette', emoji: '🧢', slot: 'head', unlockDay: 7 },
  { id: 'shorts', name: 'Short de sport', emoji: '🩳', slot: 'legs', unlockDay: 7 },

  { id: 'sunglasses', name: 'Lunettes de soleil', emoji: '🕶️', slot: 'face', unlockDay: 14 },
  { id: 'sneakers', name: 'Baskets', emoji: '👟', slot: 'feet', unlockDay: 14 },

  { id: 'crown', name: 'Couronne', emoji: '👑', slot: 'head', unlockDay: 21 },
  { id: 'cape', name: 'Cape de héros', emoji: '🦸', slot: 'outfit', unlockDay: 21 },

  { id: 'mask', name: 'Masque de héros', emoji: '🦹', slot: 'face', unlockDay: 33 },
  { id: 'pants', name: 'Pantalon', emoji: '👖', slot: 'legs', unlockDay: 33 },

  { id: 'party', name: 'Chapeau de fête', emoji: '🎉', slot: 'head', unlockDay: 50 },
  { id: 'sparkly', name: 'Chaussures pailletées', emoji: '✨', slot: 'feet', unlockDay: 50 },

  { id: 'aura', name: 'Aura dorée', emoji: '✨', slot: 'special', unlockDay: 75 },
  { id: 'gold', name: 'Tenue dorée', emoji: '🏆', slot: 'outfit', unlockDay: 75 },

  { id: 'star', name: 'Étoile légendaire', emoji: '🌟', slot: 'special', unlockDay: 99 },
  { id: 'legendary', name: 'Costume légendaire', emoji: '🎖️', slot: 'outfit', unlockDay: 99 },
];
