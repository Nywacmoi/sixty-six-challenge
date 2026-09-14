import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

// The app's own icons, rather than a library's.
//
// Everything else here — the type, the colour that travels with progress, the
// 99-grid — was built to look like nothing else, and then furnished with stock
// Ionicons that thousands of apps share. This is where "well made" and "unlike
// anything else" part company: a premium app draws its own.
//
// Construction rules, so the set stays one family instead of thirty-seven
// drawings: a 24-unit box with everything inside 3–21, a single stroke weight,
// round caps and joins, and geometry built from circles, straight lines and
// 45° diagonals. Detail is cut until the shape still reads at 18px, because
// that's the size it lives at in a habit row.
//
// The set covers the icons that carry meaning — a habit's identity, the mood
// you pick in the morning check-in. Chrome that happens to be an icon (tab
// bar, chevrons, close buttons, toasts) stays on Ionicons: those read as
// system furniture, and nobody mistakes a back chevron for the app's voice.
const STROKE = 1.8;

type Glyph = {
  paths?: string[];
  /** [cx, cy, r] — filled when `dots` rather than `rings`. */
  rings?: [number, number, number][];
  dots?: [number, number, number][];
};

const GLYPHS: Record<string, Glyph> = {
  flame: {
    // The outline has to close, and it has to notch on the left: the first
    // version left a gap between the last curve and the apex, so it drew a
    // comma — and without the notch a flame is just the water droplet.
    paths: [
      'M12 3c3.6 3.9 5.8 7 5.8 10.1a5.8 5.8 0 0 1-11.6 0c0-1.8.7-3.4 1.9-4.8.2 1.3.9 2.2 1.9 2.5C10.2 8.3 10.8 5.6 12 3Z',
      'M12 13.6c1.3 1.8 2.5 2.5 2.5 4a2.5 2.5 0 0 1-5 0c0-1.5 1.2-2.2 2.5-4Z',
    ],
  },
  fitness: {
    // Diagonal, where `barbell` is horizontal. Drawn flat they were the same
    // icon twice, which is worse than one of them being slightly off-metaphor.
    paths: [
      'M7.5 16.5 16.5 7.5',
      'M7.6 12.4 11.6 16.4',
      'M12.4 7.6 16.4 11.6',
      'M6.3 15.3 8.7 17.7',
      'M15.3 6.3 17.7 8.7',
    ],
  },
  barbell: {
    // The outer plates have to sit ON the ends of the bar, not inside them.
    // With the bar running past them the two round caps read as arrowheads,
    // and at 20px the whole thing was a double-headed arrow.
    paths: ['M4.6 12h14.8', 'M8 7.6v8.8', 'M16 7.6v8.8', 'M4.6 9.8v4.4', 'M19.4 9.8v4.4'],
  },
  walk: {
    rings: [[13.4, 4.6, 1.8]],
    paths: ['M13.6 8.2 11 12.4l2.8 1.9.5 5.5', 'M11 12.4 8 16.6', 'M13.2 9.4l3.4 1.9'],
  },
  bicycle: {
    rings: [
      [6, 16.4, 3.7],
      [18, 16.4, 3.7],
    ],
    paths: ['M6 16.4 10.5 8.6h5.2L18 16.4', 'M10.5 8.6h-2.2', 'M12.4 16.4 15.7 8.6'],
  },
  leaf: {
    paths: [
      'M20 4.2c.6 7.9-4.3 13.3-10.6 13.3-2 0-3.6-.7-4.6-1.6C3.2 11.7 7.9 4.8 20 4.2Z',
      'M4.5 20c2.5-5.3 6.2-9 11-11.3',
    ],
  },
  // Four petals and a heart, drawn as circles — the set is built from circles,
  // straight lines and 45° diagonals, so a flower gets to be literal about it.
  flower: {
    rings: [
      [12, 6.4, 3.2],
      [12, 17.6, 3.2],
      [6.4, 12, 3.2],
      [17.6, 12, 3.2],
      [12, 12, 2],
    ],
  },
  nutrition: {
    paths: [
      'M12 8c-1-1.4-3-1.9-4.6-.8-2 1.4-2.3 4.7-1 7.7 1.1 2.5 2.9 4.9 4.6 4.9.6 0 1-.3 1-.3s.4.3 1 .3c1.7 0 3.5-2.4 4.6-4.9 1.3-3 1-6.3-1-7.7C14.9 6.1 13 6.6 12 8Z',
      'M12 8V5.6c0-1.2 1-2.1 2.3-2.1',
    ],
  },
  water: {
    paths: ['M12 3.4c3.6 4.3 5.6 7.2 5.6 9.8a5.6 5.6 0 0 1-11.2 0c0-2.6 2-5.5 5.6-9.8Z'],
  },
  snow: {
    paths: [
      'M12 3.4v17.2',
      'M4.6 7.7 19.4 16.3',
      'M19.4 7.7 4.6 16.3',
      'M9.4 5.8 12 8.4l2.6-2.6',
      'M9.4 18.2 12 15.6l2.6 2.6',
    ],
  },
  restaurant: {
    paths: ['M7 3.5v5.2', 'M9.6 3.5v5.2', 'M12.2 3.5v5.2', 'M9.6 8.7v11.8', 'M17.6 3.5c1.6 1.7 1.6 6.4 0 8.1v8.9'],
  },
  wine: {
    paths: ['M7.8 3.5h8.4l-.9 6a3.3 3.3 0 0 1-6.6 0Z', 'M12 12.8v6.2', 'M8.8 19h6.4'],
  },
  ban: {
    rings: [[12, 12, 8.4]],
    paths: ['M6.1 6.1 17.9 17.9'],
  },
  book: {
    // Open, not closed. A closed book at 18px is a rounded rectangle with a
    // line across it — which is exactly what `phone-portrait` is.
    paths: [
      'M12 6.6C10.4 5.2 8.2 4.5 5 4.5v12.6c3.2 0 5.4.7 7 2.1 1.6-1.4 3.8-2.1 7-2.1V4.5c-3.2 0-5.4.7-7 2.1Z',
      'M12 6.6v12.6',
    ],
  },
  pencil: {
    paths: ['M4.5 19.5l.9-3.9L16.6 4.4a2.2 2.2 0 0 1 3.1 3.1L8.4 18.6Z', 'M14.6 6.4l3 3'],
  },
  school: {
    paths: ['M12 4.2 21.4 8.6 12 13 2.6 8.6Z', 'M6.8 10.9v5.2c0 1.3 2.3 2.3 5.2 2.3s5.2-1 5.2-2.3v-5.2'],
  },
  language: {
    rings: [[12, 12, 8.4]],
    paths: [
      'M3.6 12h16.8',
      'M12 3.6c2.4 2.3 3.7 5.2 3.7 8.4s-1.3 6.1-3.7 8.4c-2.4-2.3-3.7-5.2-3.7-8.4S9.6 5.9 12 3.6Z',
    ],
  },
  'color-palette': {
    paths: [
      'M12 3.4a8.6 8.6 0 1 0 0 17.2c1.1 0 1.9-.9 1.9-1.9 0-.5-.2-.9-.5-1.3-.3-.3-.5-.8-.5-1.2 0-1 .9-1.9 1.9-1.9h1.5c2.6 0 4.7-2.1 4.7-4.7 0-3.6-3.9-6.2-9-6.2Z',
    ],
    dots: [
      [7.6, 11.4, 1],
      [10.4, 7.6, 1],
      [15.2, 8.4, 1],
    ],
  },
  'musical-notes': {
    paths: ['M9.4 17.6V6.2l9.2-1.8v11.4'],
    rings: [
      [7.2, 17.8, 2.2],
      [16.4, 15.8, 2.2],
    ],
  },
  headset: {
    paths: [
      'M4.4 15.2v-2.8a7.6 7.6 0 0 1 15.2 0v2.8',
      'M4.4 14.6h1.2a1.6 1.6 0 0 1 1.6 1.6v2a1.6 1.6 0 0 1-1.6 1.6H4.4Z',
      'M19.6 14.6h-1.2a1.6 1.6 0 0 0-1.6 1.6v2a1.6 1.6 0 0 0 1.6 1.6h1.2Z',
    ],
  },
  laptop: {
    paths: ['M5.5 5.5h13v10h-13Z', 'M3 18.5h18'],
  },
  bulb: {
    paths: [
      'M12 3.4a6 6 0 0 0-3.4 11c.5.4.8 1 .8 1.6v.8h5.2v-.8c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3.4Z',
      'M10 19.4h4',
      'M9.4 16.8h5.2',
    ],
  },
  bed: {
    // Headboard, mattress, foot post, pillow. The first version put a circle
    // where the pillow goes and let the frame run past it, so it read as a
    // boot rather than a bed.
    paths: [
      'M3.4 19.6V10.4',
      'M3.4 14.4h13.2a4 4 0 0 1 4 4v1.2',
      'M6 14.4v-2.2a1.2 1.2 0 0 1 1.2-1.2h2.8a1.2 1.2 0 0 1 1.2 1.2v2.2',
    ],
  },
  moon: {
    paths: ['M20 14.6A8.6 8.6 0 0 1 9.4 4 8.6 8.6 0 1 0 20 14.6Z'],
  },
  'partly-sunny': {
    rings: [[8.6, 8, 3.2]],
    paths: [
      'M8.6 2.2v1.3',
      'M3.9 3.9l.9.9',
      'M2.2 8.6h1.3',
      'M3.9 13.3l.9-.9',
      'M10 20.4h7a3.5 3.5 0 0 0 0-7 4.6 4.6 0 0 0-8.8.6A3.2 3.2 0 0 0 10 20.4Z',
    ],
  },
  'phone-portrait': {
    paths: ['M7.6 2.6h8.8a1.6 1.6 0 0 1 1.6 1.6v15.6a1.6 1.6 0 0 1-1.6 1.6H7.6A1.6 1.6 0 0 1 6 19.8V4.2a1.6 1.6 0 0 1 1.6-1.6Z', 'M10.5 18.4h3'],
  },
  airplane: {
    paths: [
      'M12 2.6c1 0 1.7.9 1.7 2v4.5l6.9 4v2l-6.9-2.1v4.2l2.2 1.7v1.6L12 19.4l-3.9 1.1v-1.6l2.2-1.7v-4.2L3.4 15.1v-2l6.9-4V4.6c0-1.1.7-2 1.7-2Z',
    ],
  },
  cash: {
    paths: ['M2.6 6.4h18.8v11.2H2.6Z', 'M6.2 10v4', 'M17.8 10v4'],
    rings: [[12, 12, 2.7]],
  },
  locate: {
    rings: [
      [12, 12, 7],
      [12, 12, 2.2],
    ],
    paths: ['M12 3v2.4', 'M12 18.6V21', 'M3 12h2.4', 'M18.6 12H21'],
  },
  accessibility: {
    rings: [[12, 4.2, 1.9]],
    paths: ['M5.6 8.6 12 10.2l6.4-1.6', 'M12 10.2v4', 'M8.8 20.4 12 14.2l3.2 6.2'],
  },
  body: {
    rings: [[12, 4.3, 2]],
    paths: ['M8.4 10.8a3.6 3.6 0 0 1 7.2 0v3.6h-1.7l-.5 6h-2.8l-.5-6H8.4Z'],
  },
  calendar: {
    paths: ['M4 6.4h16v14.2H4Z', 'M4 10.6h16', 'M8.4 3.4v4', 'M15.6 3.4v4'],
  },
  'bar-chart': {
    paths: ['M3.5 20.5h17', 'M6.8 20.5v-6.2', 'M12 20.5V6.4', 'M17.2 20.5v-9.4'],
  },

  // --- The module chips. ---
  //
  // Every detail-screen module labels its options with an icon: running
  // programmes, workout splits, meditation sessions, meal and reading goals,
  // podcast categories. Two thirds of those names were already in this set,
  // which left rows like "Endurance / Fractionné / Récupération" drawing one
  // chip from here and two from Ionicons.
  library: {
    paths: ['M4.4 6.2h15.2v4.4H4.4Z', 'M5.8 10.6h13.2V15H5.8Z', 'M4.4 15h15.2v4.4H4.4Z'],
  },
  timer: {
    rings: [[12, 13.6, 7]],
    paths: ['M12 9.8v3.8h2.8', 'M9.4 3.4h5.2', 'M12 3.4v3.2'],
  },
  briefcase: {
    paths: [
      'M3.4 8.4h17.2v10.8H3.4Z',
      'M8.8 8.4V6.2a1.6 1.6 0 0 1 1.6-1.6h3.2a1.6 1.6 0 0 1 1.6 1.6v2.2',
      'M3.4 13h17.2',
    ],
  },
  sync: {
    paths: ['M20 11.4A8 8 0 0 0 6.2 6.6', 'M16.4 11.4H20V7.8', 'M4 12.6a8 8 0 0 0 13.8 4.8', 'M7.6 12.6H4v3.6'],
  },
  search: {
    rings: [[10.6, 10.6, 6.4]],
    paths: ['M15.4 15.4 20.4 20.4'],
  },
  person: {
    rings: [[12, 7.4, 3.6]],
    paths: ['M4.8 20.4a7.2 7.2 0 0 1 14.4 0'],
  },
  infinite: {
    paths: [
      'M6.8 8.6c1.9 0 3.3 1.3 5.2 3.4 1.9 2.1 3.3 3.4 5.2 3.4a3.4 3.4 0 0 0 0-6.8c-1.9 0-3.3 1.3-5.2 3.4-1.9 2.1-3.3 3.4-5.2 3.4a3.4 3.4 0 0 1 0-6.8Z',
    ],
  },
  document: {
    paths: ['M6 3.4h7.6L18 7.8v12.8H6Z', 'M13.6 3.4v4.4H18', 'M9 13.2h6', 'M9 16.6h6'],
  },
  construct: {
    paths: [
      'M17.8 3.6a5.4 5.4 0 0 0-6.4 6.9l-7.3 7.3a2.1 2.1 0 0 0 3 3l7.3-7.3a5.4 5.4 0 0 0 6.9-6.4l-3.3 3.3-3-.5-.5-3Z',
    ],
  },
  cloud: {
    paths: ['M7.6 19.4h9.2a4.2 4.2 0 0 0 .6-8.4 5.6 5.6 0 0 0-10.8 1.2 3.6 3.6 0 0 0 1 7.2Z'],
  },
  cafe: {
    paths: [
      'M4.8 9.8h11.4v5.4a5.7 5.7 0 0 1-11.4 0Z',
      'M16.2 11h1.8a2.4 2.4 0 0 1 0 4.8h-1.8',
      'M3.4 20.4h14.2',
      'M8.6 6.8c0-1.1 1-1.5 1-2.6',
      'M12.4 6.8c0-1.1 1-1.5 1-2.6',
    ],
  },
  bookmark: {
    paths: ['M6.4 3.6h11.2v17.2L12 16.6l-5.6 4.2Z'],
  },

  // --- The Succès grid. ---
  //
  // A whole tab, and the set covered four of its fourteen icons: half-drawn,
  // it would have read worse than not drawing any of them, because Ionicons
  // ships most of these filled and the mix was visible at a glance.
  trophy: {
    paths: [
      'M7.2 3.8h9.6v4.6a4.8 4.8 0 0 1-9.6 0Z',
      'M7.2 5.2H4.6a2.8 2.8 0 0 0 2.6 2.8',
      'M16.8 5.2h2.6a2.8 2.8 0 0 1-2.6 2.8',
      'M12 13.2v3.6',
      'M9.8 20.4a2.2 2.2 0 0 1 4.4 0',
      'M8.4 20.4h7.2',
    ],
  },
  medal: {
    // Two straps, not a closed ribbon. Drawn as one shape meeting the disc it
    // sealed into a keyhole — which is what a lock looks like.
    rings: [[12, 15.4, 5]],
    paths: ['M8.8 3.4 11.2 10.6', 'M15.2 3.4 12.8 10.6'],
  },
  'trending-up': {
    paths: ['M3.4 16.6 9.6 10.4l3.4 3.4 7.2-7.2', 'M15.4 6.6h5.2v5.2'],
  },
  'shield-checkmark': {
    paths: ['M12 3.2 20 6v6c0 4.2-3.2 7.2-8 8.8-4.8-1.6-8-4.6-8-8.8V6Z', 'M8.8 11.8 11.2 14.2l4.4-4.4'],
  },
  rocket: {
    paths: [
      'M12 3c3 2.6 4.6 6 4.6 9.6L14.2 16H9.8L7.4 12.6C7.4 9 9 5.6 12 3Z',
      'M9.8 16 6.8 18.2l.4-3.6',
      'M14.2 16l3 2.2-.4-3.6',
      'M10.4 18 12 21l1.6-3',
    ],
    rings: [[12, 9.6, 1.7]],
  },
  planet: {
    rings: [[12, 11, 6.2]],
    paths: ['M6.6 14.8C3.4 16.6 1.6 18.4 2.4 19.6c1 1.5 5.9.5 11-2.5s8.6-6.7 7.6-8.2c-.6-1-2.7-1-5.4 0'],
  },
  footsteps: {
    paths: [
      'M8.8 3.8a2.6 2.6 0 0 1 2.6 2.6v4.2a2.6 2.6 0 0 1-5.2 0V6.4a2.6 2.6 0 0 1 2.6-2.6Z',
      'M6.2 13.6h5.2v2.6a2.6 2.6 0 0 1-5.2 0Z',
      'M15.2 8.2a2.6 2.6 0 0 1 2.6 2.6v4.2a2.6 2.6 0 0 1-5.2 0v-4.2a2.6 2.6 0 0 1 2.6-2.6Z',
      'M12.6 18h5.2v1.8a2.6 2.6 0 0 1-5.2 0Z',
    ],
  },
  flash: {
    paths: ['M13.4 2.6 5.6 13.4h5.2l-.6 8 7.8-10.8h-5.2Z'],
  },
  flag: {
    paths: ['M5.6 21V3.4', 'M5.6 4.4h12.8l-2.6 4.2 2.6 4.2H5.6Z'],
  },
  'checkmark-done': {
    // Two full ticks on parallel diagonals. Clipping the first one's rise so
    // it wouldn't collide with the second just made the pair read as a W.
    paths: ['M2.8 12.6 6 15.8 14.2 7.6', 'M9.4 15.8 12 18.4 21.2 9.2'],
  },

  // --- Not habit identities, but not chrome either. ---

  // The app's "this came from the AI" marker, on fourteen surfaces — several
  // of them a few pixels from a habit icon. Two four-pointed stars rather
  // than Ionicons' three: the third one turns to grit at 11px, which is the
  // size the session cards use it at.
  sparkles: {
    paths: [
      'M10.5 4 12.1 8.9 17 10.5 12.1 12.1 10.5 17 8.9 12.1 4 10.5 8.9 8.9Z',
      'M18 14.3 18.8 16.7 21.2 17.5 18.8 18.3 18 20.7 17.2 18.3 14.8 17.5 17.2 16.7Z',
    ],
  },

  // --- The morning check-in's moods. Not offered as habit icons. ---
  happy: {
    rings: [[12, 12, 8.6]],
    paths: ['M7.8 13.6a4.6 4.6 0 0 0 8.4 0'],
    dots: [
      [9.2, 9.8, 1],
      [14.8, 9.8, 1],
    ],
  },
  sad: {
    rings: [[12, 12, 8.6]],
    paths: ['M7.8 16.2a4.6 4.6 0 0 1 8.4 0'],
    dots: [
      [9.2, 9.8, 1],
      [14.8, 9.8, 1],
    ],
  },
  star: {
    paths: ['M12 3.2 14.7 9l6.3.8-4.6 4.4 1.2 6.3L12 17.4l-5.6 3.1 1.2-6.3L3 9.8 9.3 9Z'],
  },
  // Named `neutral`, not `remove`: Ionicons' `remove` is a minus sign, and the
  // app uses it on a stepper button. A glyph keyed to that name would quietly
  // turn that button into a face.
  neutral: {
    rings: [[12, 12, 8.6]],
    paths: ['M8 15h8'],
    dots: [
      [9.2, 9.8, 1],
      [14.8, 9.8, 1],
    ],
  },
};

// Only habit identities go in the picker.
const NOT_A_HABIT = new Set([
  'library', 'timer', 'briefcase', 'sync', 'search', 'person', 'infinite',
  'document', 'construct', 'cloud', 'cafe', 'bookmark',
  'trophy', 'medal', 'trending-up', 'shield-checkmark', 'rocket', 'planet',
  'footsteps', 'flash', 'flag', 'checkmark-done',
  'sparkles', 'happy', 'sad', 'star', 'neutral',
]);

// Ionicons ships a filled and an outline cut of the same glyph, and the app
// reached for whichever suited the weight it wanted — "flame" here,
// "flame-outline" there. This set has one cut, so both names have to land on
// the same drawing; otherwise half the call sites keep falling through to
// Ionicons and the app shows two versions of the same icon.
export function AppIcon({
  name,
  size,
  color,
  style,
}: {
  name: string;
  size: number;
  color: string;
  style?: StyleProp<ViewStyle>;
}) {
  const glyph = GLYPHS[name] ?? GLYPHS[name.replace(/-outline$/, '')];

  // Habits created before this set existed — or with any Ionicons name the
  // picker doesn't offer — keep working rather than losing their icon.
  if (!glyph) return <Ionicons name={name as any} size={size} color={color} style={style as any} />;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      {glyph.paths?.map((d, i) => (
        <Path
          key={`p${i}`}
          d={d}
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
      {glyph.rings?.map(([cx, cy, r], i) => (
        <Circle key={`r${i}`} cx={cx} cy={cy} r={r} stroke={color} strokeWidth={STROKE} fill="none" />
      ))}
      {glyph.dots?.map(([cx, cy, r], i) => (
        <Circle key={`d${i}`} cx={cx} cy={cy} r={r} fill={color} />
      ))}
    </Svg>
  );
}

/** The icon picker's offer. Derived from the set rather than kept as its own
 *  list, so a glyph can never be drawn and then not offered — or offered and
 *  silently fall back to Ionicons in the grid. */
export const HABIT_ICON_NAMES = Object.keys(GLYPHS).filter((n) => !NOT_A_HABIT.has(n));
