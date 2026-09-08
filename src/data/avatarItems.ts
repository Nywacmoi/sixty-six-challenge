// Item ids are real DiceBear "open-peeps" option values (see AvatarDisplay.tsx),
// not our own invented names — this is what makes them render as actual
// professionally-illustrated hairstyles/accessories instead of hand-drawn
// shapes. 'special' items are chrome drawn around the portrait (glow ring,
// star badge), not a DiceBear option, so they're not equip-toggleable.
export type AvatarSlot = 'hair' | 'accessory' | 'facialHair' | 'expression' | 'special';

export type AvatarItem = {
  id: string;
  name: string;
  emoji: string;
  slot: AvatarSlot;
  unlockDay: number;
};

// Unlock days match the existing day-N achievements (day-3, day-7, ...) so
// unlocking a cosmetic always lines up with an achievement toast the person
// already gets — one milestone, two rewards.
export const AVATAR_ITEMS: AvatarItem[] = [
  { id: 'short3', name: 'Coupe courte nette', emoji: '💇', slot: 'hair', unlockDay: 3 },
  { id: 'glasses', name: 'Lunettes', emoji: '👓', slot: 'accessory', unlockDay: 3 },

  { id: 'mohawk', name: 'Crête', emoji: '🎸', slot: 'hair', unlockDay: 7 },
  { id: 'cheeky', name: 'Sourire malicieux', emoji: '😏', slot: 'expression', unlockDay: 7 },

  { id: 'bun', name: 'Chignon', emoji: '💁', slot: 'hair', unlockDay: 14 },
  { id: 'sunglasses', name: 'Lunettes de soleil', emoji: '🕶️', slot: 'accessory', unlockDay: 14 },

  { id: 'afro', name: 'Afro', emoji: '🙆', slot: 'hair', unlockDay: 21 },
  { id: 'goatee1', name: 'Bouc', emoji: '🧔', slot: 'facialHair', unlockDay: 21 },

  { id: 'dreads1', name: 'Dreads', emoji: '👤', slot: 'hair', unlockDay: 33 },
  { id: 'eyepatch', name: "Cache-œil", emoji: '🏴‍☠️', slot: 'accessory', unlockDay: 33 },

  { id: 'flatTop', name: 'Flat top', emoji: '✂️', slot: 'hair', unlockDay: 50 },
  { id: 'smileLOL', name: 'Fou rire', emoji: '😂', slot: 'expression', unlockDay: 50 },

  { id: 'pomp', name: 'Pompadour', emoji: '💈', slot: 'hair', unlockDay: 75 },
  { id: 'aura', name: 'Aura dorée', emoji: '✨', slot: 'special', unlockDay: 75 },

  { id: 'full2', name: 'Barbe légendaire', emoji: '🧙', slot: 'facialHair', unlockDay: 99 },
  { id: 'star', name: 'Étoile légendaire', emoji: '🌟', slot: 'special', unlockDay: 99 },
];
