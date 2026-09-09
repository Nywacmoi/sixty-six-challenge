import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Renders the profile avatar via DiceBear's "adventurer" set — real,
// professionally illustrated portraits instead of hand-drawn shapes, which
// is the whole point: a hand-coded SVG here can't reach that finish no
// matter how much time goes into it. Unequipped slots fall back to a fixed
// neutral look (short hair, neutral mouth, nothing extra) rather than
// leaving them to DiceBear's per-seed randomization, so nobody ends up with
// a "locked" cosmetic for free just because their seed happened to roll it.
//
// Previously "open-peeps" — switched after that style didn't land well.
// Adventurer's trait schema is unrelated (hair/glasses/features instead of
// head/accessories/facialHair/clothingColor), so wardrobe item ids in
// avatarItems.ts were redefined for it too. Anyone who had equipped an
// open-peeps-era item just falls back to the default look here (their old
// id matches nothing new) — nothing is lost since unlocks are tracked by
// day, not by which item was equipped, so they can just re-pick from the
// wardrobe. Adventurer also has no clothing layer, so `color` below only
// drives the app-drawn circle behind the portrait, not the portrait itself.
const DICEBEAR_BASE = 'https://api.dicebear.com/9.x/adventurer/png';

// Fallback hairstyle before the person has equipped anything from the
// wardrobe — hair is the only trait that reads as gendered, so that's the
// only default this picks.
function defaultHairFor(gender: 'homme' | 'femme' | null | undefined) {
  if (gender === 'femme') return 'long01';
  return 'short01';
}

function buildAvatarUrl(opts: {
  seed: string;
  gender: 'homme' | 'femme' | null;
  hair: string | null;
  accessory: string | null;
  facialHair: string | null;
  expression: string | null;
  size: number;
}) {
  const params = new URLSearchParams();
  params.set('seed', opts.seed);
  params.set('size', String(opts.size));
  params.set('backgroundColor', 'transparent');
  params.append('hair[]', opts.hair ?? defaultHairFor(opts.gender));
  params.append('mouth[]', opts.expression ?? 'variant01');
  if (opts.accessory) {
    params.append('glasses[]', opts.accessory);
    params.set('glassesProbability', '100');
  } else {
    params.set('glassesProbability', '0');
  }
  if (opts.facialHair) {
    params.append('features[]', opts.facialHair);
    params.set('featuresProbability', '100');
  } else {
    params.set('featuresProbability', '0');
  }
  return `${DICEBEAR_BASE}?${params.toString()}`;
}

// DiceBear serves the image cross-origin without a matching `crossOrigin`
// attribute on the underlying <img> (react-native-web's Image doesn't
// expose one) — on web that "taints" any <canvas> that draws it, which
// silently breaks the share-card export (react-native-view-shot uses
// html2canvas under the hood). Fetching the bytes ourselves and swapping in
// a data: URI sidesteps the whole problem, since a data: URI is always
// same-origin as far as canvas is concerned. Native has no such concept —
// this only runs on web, and quietly keeps the original remote URL if the
// fetch fails (offline, etc.) rather than showing nothing.
function useCanvasSafeUri(uri: string) {
  const [resolved, setResolved] = useState(uri);
  useEffect(() => {
    setResolved(uri);
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    fetch(uri)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      )
      .then((dataUri) => {
        if (!cancelled) setResolved(dataUri);
      })
      .catch(() => {
        // offline or blocked — the plain remote URL still displays fine,
        // it just can't be captured onto a <canvas>
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);
  return resolved;
}

export function AvatarDisplay({
  color,
  seed,
  gender,
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
  gender?: 'homme' | 'femme' | null;
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
    gender: gender ?? null,
    hair: hair ?? null,
    accessory: accessory ?? null,
    facialHair: facialHair ?? null,
    expression: expression ?? null,
    size: 256,
  });
  const displayUri = useCanvasSafeUri(uri);

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
        <Image source={{ uri: displayUri }} style={{ width: size, height: size }} resizeMode="cover" />
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
