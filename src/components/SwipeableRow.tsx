import React, { useRef, useState } from 'react';
import { Animated, View, Text, StyleSheet, PanResponder, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { radius, spacing, ThemeColors } from '../theme/theme';

const DELETE_WIDTH = 88;

export function SwipeableRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const translateX = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const openedHaptic = useRef(false);
  const [childrenLocked, setChildrenLocked] = useState(false);

  const close = () => {
    offset.current = 0;
    openedHaptic.current = false;
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 8 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
      onPanResponderGrant: () => {
        setChildrenLocked(true);
      },
      onPanResponderMove: (_, gesture) => {
        const next = Math.min(0, Math.max(-DELETE_WIDTH * 1.4, offset.current + gesture.dx));
        translateX.setValue(next);
        if (next <= -DELETE_WIDTH && !openedHaptic.current) {
          openedHaptic.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (next > -DELETE_WIDTH) {
          openedHaptic.current = false;
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const projected = offset.current + gesture.dx;
        const shouldOpen = projected < -DELETE_WIDTH / 2;
        const target = shouldOpen ? -DELETE_WIDTH : 0;
        offset.current = target;
        Animated.spring(translateX, { toValue: target, useNativeDriver: true, bounciness: 0 }).start();
        setTimeout(() => setChildrenLocked(false), 150);
      },
      onPanResponderTerminate: () => {
        setTimeout(() => setChildrenLocked(false), 150);
      },
    })
  ).current;

  const handleDelete = () => {
    close();
    onDelete();
  };

  return (
    <View style={styles.container}>
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
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      position: 'relative',
      width: '100%',
      marginBottom: spacing.sm,
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
      fontFamily: 'Poppins_600SemiBold',
    },
  });
}
