import React, { useEffect, useState } from 'react';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Temporary diagnostic overlay to pin down the real numbers behind the
// bottom-gap bug on iOS Safari standalone, instead of guessing from
// screenshots. Remove once the bug is confirmed fixed.
export function DebugOverlay() {
  const insets = useSafeAreaInsets();
  const [webInfo, setWebInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const probe = document.createElement('div');
    probe.style.paddingBottom = 'env(safe-area-inset-bottom)';
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    document.body.appendChild(probe);
    const envSafeBottom = getComputedStyle(probe).paddingBottom;
    document.body.removeChild(probe);

    const update = () => {
      const root = document.getElementById('root');
      const rootRect = root?.getBoundingClientRect();
      setWebInfo({
        innerHeight: String(window.innerHeight),
        vvHeight: String(window.visualViewport?.height ?? 'n/a'),
        vvOffsetTop: String(window.visualViewport?.offsetTop ?? 'n/a'),
        docClientHeight: String(document.documentElement.clientHeight),
        bodyOffsetHeight: String(document.body.offsetHeight),
        rootHeight: String(rootRect?.height ?? 'n/a'),
        rootBottom: String(rootRect?.bottom ?? 'n/a'),
        appHeightVar: getComputedStyle(document.documentElement).getPropertyValue('--app-height'),
        envSafeBottom,
        standalone: String((navigator as any).standalone ?? 'n/a'),
        dpr: String(window.devicePixelRatio),
      });
    };
    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
    };
  }, []);

  const lines = [
    `insets.bottom(RN)=${insets.bottom}`,
    `innerHeight=${webInfo.innerHeight}`,
    `vvHeight=${webInfo.vvHeight}`,
    `vvOffsetTop=${webInfo.vvOffsetTop}`,
    `docClientH=${webInfo.docClientHeight}`,
    `bodyOffsetH=${webInfo.bodyOffsetHeight}`,
    `rootH=${webInfo.rootHeight}`,
    `rootBottom=${webInfo.rootBottom}`,
    `--app-height=${webInfo.appHeightVar}`,
    `env(safe-bottom)=${webInfo.envSafeBottom}`,
    `standalone=${webInfo.standalone}`,
    `dpr=${webInfo.dpr}`,
  ];

  return (
    <View style={styles.box} pointerEvents="none">
      {lines.map((l) => (
        <Text key={l} style={styles.text}>
          {l}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    top: 60,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 8,
    padding: 8,
    zIndex: 9999,
  },
  text: { color: '#0F0', fontSize: 10, fontFamily: 'Courier' },
});
