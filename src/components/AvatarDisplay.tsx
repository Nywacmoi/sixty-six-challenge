import React from 'react';
import Svg, { Circle, Path, Rect, Polygon, Ellipse } from 'react-native-svg';

function HeadItem({ id, color }: { id: string | null; color: string }) {
  switch (id) {
    case 'headband':
      return <Path d="M14 46 Q60 26 106 46" stroke={color} strokeWidth={11} fill="none" strokeLinecap="round" />;
    case 'cap':
      return (
        <>
          <Path d="M20 46 A40 40 0 0 1 100 46 L100 40 A40 38 0 0 0 20 40 Z" fill={color} />
          <Rect x={54} y={12} width={64} height={12} rx={6} fill={color} />
        </>
      );
    case 'crown':
      return (
        <Polygon
          points="24,46 24,28 38,40 60,16 82,40 96,28 96,46"
          fill="#FFC542"
          stroke="#B8860B"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    case 'party':
      return (
        <>
          <Polygon points="60,4 32,46 88,46" fill={color} stroke="#FFFFFF" strokeWidth={2} />
          <Circle cx={60} cy={6} r={6} fill="#FFC542" />
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
          <Rect x={34} y={58} width={20} height={14} rx={5} fill="#17171A" />
          <Rect x={66} y={58} width={20} height={14} rx={5} fill="#17171A" />
          <Path d="M54 64 L66 64" stroke="#17171A" strokeWidth={3} />
        </>
      );
    case 'mask':
      return <Path d="M30 56 Q60 46 90 56 L90 70 Q60 60 30 70 Z" fill="#17171A" opacity={0.85} />;
    default:
      return null;
  }
}

export function AvatarDisplay({
  color,
  head,
  face,
  hasAura,
  hasStar,
  size = 96,
}: {
  color: string;
  head?: string | null;
  face?: string | null;
  hasAura?: boolean;
  hasStar?: boolean;
  size?: number;
}) {
  return (
    <Svg width={size} height={size * (140 / 120)} viewBox="0 0 120 140">
      {hasAura && (
        <>
          <Circle cx={60} cy={78} r={58} fill="#FFC542" opacity={0.12} />
          <Circle cx={60} cy={78} r={50} stroke="#FFC542" strokeWidth={2} fill="none" opacity={0.5} />
        </>
      )}

      {/* body */}
      <Ellipse cx={60} cy={122} rx={30} ry={14} fill={color} opacity={0.35} />
      {/* head */}
      <Circle cx={60} cy={78} r={46} fill={color} />
      {/* cheeks */}
      <Circle cx={34} cy={88} r={7} fill="#FFFFFF" opacity={0.25} />
      <Circle cx={86} cy={88} r={7} fill="#FFFFFF" opacity={0.25} />
      {/* eyes */}
      <Circle cx={44} cy={72} r={5} fill="#17171A" />
      <Circle cx={76} cy={72} r={5} fill="#17171A" />
      {/* smile */}
      <Path d="M44 92 Q60 106 76 92" stroke="#17171A" strokeWidth={4} fill="none" strokeLinecap="round" />

      <FaceItem id={face ?? null} />
      <HeadItem id={head ?? null} color={color} />

      {hasStar && (
        <Polygon
          points="98,100 101,108 110,108 103,113 105,121 98,116 91,121 93,113 86,108 95,108"
          fill="#FFC542"
          stroke="#B8860B"
          strokeWidth={1}
        />
      )}
    </Svg>
  );
}
