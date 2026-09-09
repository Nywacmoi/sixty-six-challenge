// Item ids are real DiceBear "adventurer" option values (see
// AvatarDisplay.tsx), not our own invented names — this is what makes them
// render as actual professionally-illustrated hairstyles/accessories
// instead of hand-drawn shapes. `icon` (an Ionicons glyph name) is just the
// wardrobe-grid preview, unrelated to the DiceBear rendering. 'special'
// items are chrome drawn around the portrait (glow ring, star badge), not a
// DiceBear option, so they're not equip-toggleable.
//
// Names were picked by actually rendering each id and looking at it —
// Adventurer's real shapes don't match open-peeps' (no mohawk/afro/dreads-
// shaped hair, no eyepatch, and only one facial-hair option: a mustache),
// so items were renamed to what they actually look like rather than reusing
// the old open-peeps-era names on a different picture.
export type AvatarSlot = 'hair' | 'accessory' | 'facialHair' | 'expression' | 'special';

export type AvatarItem = {
  id: string;
  name: string;
  icon: string;
  slot: AvatarSlot;
  unlockDay: number;
};

// Unlock days match the existing day-N achievements (day-3, day-7, ...) so
// unlocking a cosmetic always lines up with an achievement toast the person
// already gets — one milestone, two rewards.
export const AVATAR_ITEMS: AvatarItem[] = [
  { id: 'short01', name: 'Coupe courte nette', icon: 'cut', slot: 'hair', unlockDay: 3 },
  { id: 'variant04', name: 'Lunettes', icon: 'glasses', slot: 'accessory', unlockDay: 3 },

  { id: 'short03', name: 'Afro', icon: 'flash', slot: 'hair', unlockDay: 7 },
  { id: 'variant20', name: 'Sourire malicieux', icon: 'happy', slot: 'expression', unlockDay: 7 },

  { id: 'long11', name: 'Chignon', icon: 'ellipse', slot: 'hair', unlockDay: 14 },
  { id: 'variant01', name: 'Lunettes de soleil', icon: 'sunny', slot: 'accessory', unlockDay: 14 },

  { id: 'long15', name: 'Couettes', icon: 'person-circle', slot: 'hair', unlockDay: 21 },
  { id: 'mustache', name: 'Moustache', icon: 'body', slot: 'facialHair', unlockDay: 21 },

  { id: 'long08', name: 'Couronne de fleurs', icon: 'body', slot: 'hair', unlockDay: 33 },
  { id: 'variant02', name: 'Lunettes carrées', icon: 'eye-off', slot: 'accessory', unlockDay: 33 },

  { id: 'long22', name: 'Crinière', icon: 'layers', slot: 'hair', unlockDay: 50 },
  { id: 'variant28', name: 'Fou rire', icon: 'happy', slot: 'expression', unlockDay: 50 },

  { id: 'long26', name: 'Ondulé', icon: 'trending-up', slot: 'hair', unlockDay: 75 },
  { id: 'aura', name: 'Aura dorée', icon: 'sparkles', slot: 'special', unlockDay: 75 },

  { id: 'birthmark', name: 'Grain de beauté', icon: 'person', slot: 'facialHair', unlockDay: 99 },
  { id: 'star', name: 'Étoile légendaire', icon: 'star', slot: 'special', unlockDay: 99 },
];
