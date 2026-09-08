import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Renders the profile avatar via DiceBear's "open-peeps" set — real,
// professionally illustrated hairstyles/accessories/expressions instead of
// hand-drawn shapes, which is the whole point: a hand-coded SVG here can't
// reach that finish no matter how much time goes into it. Unequipped slots
// fall back to a fixed neutral look (short hair, smile, nothing extra)
// rather than leaving them to DiceBear's per-seed randomization, so nobody
// ends up with a "locked" cosmetic for free just because their seed
// happened to roll it.
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/open-peeps/png';

function buildAvatarUrl(opts: {
  seed: string;
  hair: string | null;
  accessory: string | null;
  facialHair: string | null;
  expression: string | null;
  clothingColor: string;
  size: number;
}) {
  const params = new URLSearchParams();
  params.set('seed', opts.seed);
  params.set('size', String(opts.size));
  params.append('head[]', opts.hair ?? 'short1');
  params.append('face[]', opts.expression ?? 'smile');
  params.append('clothingColor[]', opts.clothingColor.replace('#', ''));
  if (opts.accessory) {
    params.append('accessories[]', opts.accessory);
    params.set('accessoriesProbability', '100');
  } else {
    params.set('accessoriesProbability', '0');
  }
  if (opts.facialHair) {
    params.append('facialHair[]', opts.facialHair);
    params.set('facialHairProbability', '100');
  } else {
    params.set('facialHairProbability', '0');
  }
  return `${DICEBEAR_BASE}?${params.toString()}`;
}

export function AvatarDisplay({
  color,
  seed,
  hair,
  accessory,
  facialHair,
  expression,
  hasAura,
  hasStar,
  size = 96,
}: {
  color: string;
  seed?: string | null;
  hair?: string | null;
  accessory?: string | null;
  facialHair?: string | null;
  expression?: string | null;
  hasAura?: boolean;
  hasStar?: boolean;
  size?: number;
}) {
  const uri = buildAvatarUrl({
    seed: seed || 'default',
    hair: hair ?? null,
    accessory: accessory ?? null,
    facialHair: facialHair ?? null,
    expression: expression ?? null,
    clothingColor: color,
    size: 256,
  });

  return (
    <View style={{ width: size, height: size }}>
      {hasAura && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: size / 2,
              backgroundColor: '#FFC542',
              opacity: 0.25,
              transform: [{ scale: 1.16 }],
            },
          ]}
        />
      )}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          backgroundColor: color + '1A',
        }}
      >
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      </View>
      {hasStar && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: size * 0.32,
            height: size * 0.32,
            borderRadius: (size * 0.32) / 2,
            backgroundColor: '#FFC542',
            borderWidth: 2,
            borderColor: '#B8860B',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="star" size={size * 0.18} color="#B8860B" />
        </View>
      )}
    </View>
  );
}
