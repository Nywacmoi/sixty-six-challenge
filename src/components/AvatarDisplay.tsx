import React from 'react';
import Svg, { Circle, Path, Rect, Polygon, Ellipse } from 'react-native-svg';

function HeadItem({ id, color }: { id: string | null; color: string }) {
  switch (id) {
    case 'headband':
      return <Path d="M18 30 Q60 10 102 30" stroke={color} strokeWidth={9} fill="none" strokeLinecap="round" />;
    case 'cap':
      return (
        <>
          <Path d="M26 36 Q60 4 94 36 L94 29 Q60 -2 26 29 Z" fill={color} />
          <Rect x={62} y={6} width={30} height={9} rx={4.5} fill={color} />
        </>
      );
    case 'crown':
      return (
        <Polygon
          points="22,30 22,13 34,23 60,2 86,23 98,13 98,30"
          fill="#FFC542"
          stroke="#B8860B"
          strokeWidth={2}
          strokeLinejoin="round"
        />
      );
    case 'party':
      return (
        <>
          <Polygon points="60,3 34,32 86,32" fill={color} stroke="#FFFFFF" strokeWidth={2} />
          <Circle cx={60} cy={4} r={5} fill="#FFC542" />
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
          <Rect x={39} y={33} width={17} height={12} rx={4.5} fill="#17171A" />
          <Rect x={64} y={33} width={17} height={12} rx={4.5} fill="#17171A" />
          <Path d="M56 39 L64 39" stroke="#17171A" strokeWidth={3} />
        </>
      );
    case 'mask':
      return <Path d="M31 31 Q60 22 89 31 L89 44 Q60 35 31 44 Z" fill="#17171A" opacity={0.85} />;
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
    <Svg width={size} height={size * (175 / 120)} viewBox="0 0 120 175">
      {hasAura && (
        <>
          <Circle cx={60} cy={95} r={82} fill="#FFC542" opacity={0.1} />
          <Circle cx={60} cy={95} r={72} stroke="#FFC542" strokeWidth={2} fill="none" opacity={0.45} />
        </>
      )}

      {/* legs */}
      <Rect x={38} y={124} width={17} height={34} rx={8.5} fill={color} />
      <Rect x={65} y={124} width={17} height={34} rx={8.5} fill={color} />
      <Ellipse cx={46.5} cy={161} rx={12} ry={6.5} fill={color} />
      <Ellipse cx={73.5} cy={161} rx={12} ry={6.5} fill={color} />

      {/* arms */}
      <Rect x={9} y={80} width={16} height={42} rx={8} fill={color} />
      <Rect x={95} y={80} width={16} height={42} rx={8} fill={color} />
      <Circle cx={17} cy={124} r={9} fill={color} />
      <Circle cx={103} cy={124} r={9} fill={color} />

      {/* torso */}
      <Rect x={26} y={62} width={68} height={70} rx={30} fill={color} />

      {/* head */}
      <Circle cx={60} cy={42} r={30} fill={color} />
      {/* cheeks */}
      <Circle cx={33} cy={48} r={6} fill="#FFFFFF" opacity={0.25} />
      <Circle cx={87} cy={48} r={6} fill="#FFFFFF" opacity={0.25} />
      {/* eyes */}
      <Circle cx={48} cy={38} r={4.5} fill="#17171A" />
      <Circle cx={72} cy={38} r={4.5} fill="#17171A" />
      {/* smile */}
      <Path d="M46 52 Q60 63 74 52" stroke="#17171A" strokeWidth={3.5} fill="none" strokeLinecap="round" />

      <FaceItem id={face ?? null} />
      <HeadItem id={head ?? null} color={color} />

      {hasStar && (
        <Polygon
          points="85,72 88,80 97,80 90,85 92,93 85,88 78,93 80,85 73,80 82,80"
          fill="#FFC542"
          stroke="#B8860B"
          strokeWidth={1}
        />
      )}
    </Svg>
  );
}
