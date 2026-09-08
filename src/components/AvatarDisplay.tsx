import React from 'react';
import Svg, { Circle, Path, Rect, Polygon, Ellipse } from 'react-native-svg';

// Chibi proportions (big head, small round body, stubby limbs) read as
// "cute character" even with plain flat shapes — much more forgiving than
// realistic proportions when there's no illustrator drawing this by hand.
const HEAD_CX = 60;
const HEAD_CY = 46;
const HEAD_R = 36;

function HeadItem({ id, color }: { id: string | null; color: string }) {
  switch (id) {
    case 'headband':
      return <Path d="M22 32 Q60 12 98 32" stroke={color} strokeWidth={10} fill="none" strokeLinecap="round" />;
    case 'cap':
      return (
        <>
          <Path d="M20 40 A40 38 0 0 1 100 40 L100 32 A40 36 0 0 0 20 32 Z" fill={color} />
          <Rect x={64} y={10} width={32} height={10} rx={5} fill={color} />
        </>
      );
    case 'crown':
      return (
        <Polygon
          points="24,32 24,14 37,25 60,3 83,25 96,14 96,32"
          fill="#FFC542"
          stroke="#B8860B"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    case 'party':
      return (
        <>
          <Polygon points="60,2 33,34 87,34" fill={color} stroke="#FFFFFF" strokeWidth={2} />
          <Circle cx={60} cy={3} r={5} fill="#FFC542" />
        </>
      );
    default:
      return null;
  }
}

function FaceItem({ id }: { id: string | null }) {
  switch (id) {
    case 'sunglasses':
      return (
        <>
          <Rect x={37} y={40} width={18} height={13} rx={5} fill="#17171A" />
          <Rect x={65} y={40} width={18} height={13} rx={5} fill="#17171A" />
          <Path d="M55 46 L65 46" stroke="#17171A" strokeWidth={3} />
        </>
      );
    case 'mask':
      return <Path d="M32 38 Q60 28 88 38 L88 52 Q60 43 32 52 Z" fill="#17171A" opacity={0.85} />;
    default:
      return null;
  }
}

function OutfitItem({ id }: { id: string | null }) {
  switch (id) {
    case 'tshirt':
      return <Path d="M28 96 Q60 84 92 96 L92 140 Q60 148 28 140 Z" fill="#3D8BFF" />;
    case 'cape':
      return <Path d="M30 90 Q20 138 32 148 L36 100 Z M90 90 Q100 138 88 148 L84 100 Z" fill="#E63946" />;
    case 'gold':
      return <Path d="M28 96 Q60 84 92 96 L92 140 Q60 148 28 140 Z" fill="#FFC542" />;
    case 'legendary':
      return (
        <Path
          d="M28 96 Q60 84 92 96 L92 140 Q60 148 28 140 Z"
          fill="#B15AFF"
          stroke="#FFC542"
          strokeWidth={2}
        />
      );
    default:
      return null;
  }
}

function LegsItem({ id }: { id: string | null }) {
  switch (id) {
    case 'shorts':
      return <Path d="M32 140 L88 140 L88 154 Q60 160 32 154 Z" fill="#2FAE4C" />;
    case 'pants':
      return (
        <>
          <Rect x={32} y={140} width={22} height={30} rx={6} fill="#17171A" />
          <Rect x={66} y={140} width={22} height={30} rx={6} fill="#17171A" />
        </>
      );
    default:
      return null;
  }
}

function FeetItem({ id }: { id: string | null }) {
  switch (id) {
    case 'sneakers':
      return (
        <>
          <Ellipse cx={42} cy={175} rx={13} ry={7} fill="#FFFFFF" stroke="#17171A" strokeWidth={2} />
          <Ellipse cx={78} cy={175} rx={13} ry={7} fill="#FFFFFF" stroke="#17171A" strokeWidth={2} />
        </>
      );
    case 'sparkly':
      return (
        <>
          <Ellipse cx={42} cy={175} rx={13} ry={7} fill="#FFC542" />
          <Ellipse cx={78} cy={175} rx={13} ry={7} fill="#FFC542" />
        </>
      );
    default:
      return null;
  }
}

export function AvatarDisplay({
  color,
  head,
  face,
  outfit,
  legs,
  feet,
  hasAura,
  hasStar,
  size = 96,
}: {
  color: string;
  head?: string | null;
  face?: string | null;
  outfit?: string | null;
  legs?: string | null;
  feet?: string | null;
  hasAura?: boolean;
  hasStar?: boolean;
  size?: number;
}) {
  return (
    <Svg width={size} height={size * (185 / 120)} viewBox="0 0 120 185">
      {hasAura && (
        <>
          <Circle cx={60} cy={100} r={88} fill="#FFC542" opacity={0.1} />
          <Circle cx={60} cy={100} r={78} stroke="#FFC542" strokeWidth={2} fill="none" opacity={0.45} />
        </>
      )}

      {/* legs (bare, shown when no legs item covers them) */}
      <Ellipse cx={45} cy={155} rx={14} ry={17} fill={color} />
      <Ellipse cx={75} cy={155} rx={14} ry={17} fill={color} />
      <FeetItem id={feet ?? null} />

      {/* arms */}
      <Ellipse cx={20} cy={112} rx={12} ry={17} fill={color} />
      <Ellipse cx={100} cy={112} rx={12} ry={17} fill={color} />

      {/* body */}
      <Rect x={28} y={92} width={64} height={54} rx={26} fill={color} />
      <LegsItem id={legs ?? null} />
      <OutfitItem id={outfit ?? null} />

      {/* head */}
      <Circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R} fill={color} />
      {/* cheeks */}
      <Circle cx={HEAD_CX - 26} cy={HEAD_CY + 8} r={6.5} fill="#FFFFFF" opacity={0.22} />
      <Circle cx={HEAD_CX + 26} cy={HEAD_CY + 8} r={6.5} fill="#FFFFFF" opacity={0.22} />
      {/* eyes */}
      <Circle cx={HEAD_CX - 12} cy={HEAD_CY - 2} r={5} fill="#17171A" />
      <Circle cx={HEAD_CX + 12} cy={HEAD_CY - 2} r={5} fill="#17171A" />
      {/* smile */}
      <Path d={`M${HEAD_CX - 14} ${HEAD_CY + 14} Q${HEAD_CX} ${HEAD_CY + 26} ${HEAD_CX + 14} ${HEAD_CY + 14}`} stroke="#17171A" strokeWidth={3.5} fill="none" strokeLinecap="round" />

      <FaceItem id={face ?? null} />
      <HeadItem id={head ?? null} color={color} />

      {hasStar && (
        <Polygon
          points="88,84 91,92 100,92 93,97 95,105 88,100 81,105 83,97 76,92 85,92"
          fill="#FFC542"
          stroke="#B8860B"
          strokeWidth={1}
        />
      )}
    </Svg>
  );
}
