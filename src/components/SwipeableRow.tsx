import React, { useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, PanResponder, Pressable, Easing, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { fonts, radius, spacing, ThemeColors } from '../theme/theme';

const DELETE_WIDTH = 88;

export function SwipeableRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  // `translateX` holds the settled position (0 or -DELETE_WIDTH) between
  // gestures. While actively dragging, `setOffset`/`Animated.event` hand the
  // per-frame tracking straight to the native UI thread instead of routing
  // every touch-move through the JS bridge via `.setValue()` — that JS-bridge
  // round trip per event was the actual source of the janky, laggy drag feel.
  const translateX = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const dragStart = useRef(0);
  const openedHaptic = useRef(false);
  const [childrenLocked, setChildrenLocked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const rowOpacity = useRef(new Animated.Value(1)).current;
  const collapse = useRef(new Animated.Value(1)).current;

  const close = () => {
    offset.current = 0;
    openedHaptic.current = false;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, friction: 9, tension: 110 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderGrant: () => {
        setChildrenLocked(true);
        dragStart.current = offset.current;
        translateX.setOffset(offset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: Animated.event([null, { dx: translateX }], {
        useNativeDriver: true,
        listener: ((_: unknown, gesture: { dx: number }) => {
          const next = Math.min(0, Math.max(-DELETE_WIDTH * 1.4, dragStart.current + gesture.dx));
          if (next <= -DELETE_WIDTH && !openedHaptic.current) {
            openedHaptic.current = true;
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } else if (next > -DELETE_WIDTH) {
            openedHaptic.current = false;
          }
        }) as any,
      }),
      onPanResponderRelease: (_, gesture) => {
        translateX.flattenOffset();
        const projected = dragStart.current + gesture.dx;
        const shouldOpen = projected < -DELETE_WIDTH / 2;
        const target = shouldOpen ? -DELETE_WIDTH : 0;
        offset.current = target;
        Animated.spring(translateX, { toValue: target, useNativeDriver: true, friction: 9, tension: 110 }).start();
        setTimeout(() => setChildrenLocked(false), 150);
      },
      onPanResponderTerminate: () => {
        translateX.flattenOffset();
        Animated.spring(translateX, { toValue: offset.current, useNativeDriver: true, friction: 9, tension: 110 }).start();
        setTimeout(() => setChildrenLocked(false), 150);
      },
    })
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    if (measuredHeight == null) setMeasuredHeight(e.nativeEvent.layout.height);
  };

  // A row that just vanishes when its data disappears from the list reads
  // as a glitch — this slides it fully off-screen, fades it, then collapses
  // the space it leaves behind, so the rows below settle smoothly into
  // place instead of jumping.
  const handleDelete = () => {
    if (deleting) return;
    setDeleting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.timing(translateX, {
      toValue: -420,
      duration: 220,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(rowOpacity, { toValue: 0, duration: 160, useNativeDriver: true }).start();
    Animated.timing(collapse, {
      toValue: 0,
      duration: 240,
      delay: 120,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) onDelete();
    });
  };

  return (
    <Animated.View
      pointerEvents={deleting ? 'none' : 'auto'}
      style={{
        opacity: rowOpacity,
        height: measuredHeight == null ? undefined : collapse.interpolate({ inputRange: [0, 1], outputRange: [0, measuredHeight] }),
        marginBottom: measuredHeight == null ? undefined : collapse.interpolate({ inputRange: [0, 1], outputRange: [0, spacing.sm] }),
      }}
    >
      <View onLayout={onLayout} style={styles.container}>
        <View style={styles.deleteBackground}>
          <Pressable onPress={handleDelete} style={styles.deleteButton} hitSlop={8}>
            <Ionicons name="trash" size={20} color="#FFFFFF" />
            <Text style={styles.deleteText}>Supprimer</Text>
          </Pressable>
        </View>
        <Animated.View style={[styles.slider, { transform: [{ translateX }] }]} {...panResponder.panHandlers}>
          <View pointerEvents={childrenLocked ? 'none' : 'auto'}>{children}</View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: 'relative',
      width: '100%',
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    slider: {
      width: '100%',
    },
    deleteBackground: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      right: 0,
      width: DELETE_WIDTH * 1.4,
      backgroundColor: colors.danger,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    deleteButton: {
      width: DELETE_WIDTH,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    deleteText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: fonts.semiBold,
    },
  });
}
