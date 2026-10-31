import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors } from '../theme/ThemeContext';

export default function Countdown({ onComplete, visible }) {
  const Colors = useColors();
  const [count, setCount] = useState(3);
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const animateNumber = useCallback(() => {
    scaleAnim.setValue(0.3);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 150, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    if (!visible) return;
    setCount(3);

    const timers = [];
    animateNumber();

    timers.push(
      setTimeout(() => {
        setCount(2);
        animateNumber();
      }, 900),
    );
    timers.push(
      setTimeout(() => {
        setCount(1);
        animateNumber();
      }, 1800),
    );
    timers.push(
      setTimeout(() => {
        setCount(0);
        animateNumber();
      }, 2700),
    );
    timers.push(
      setTimeout(() => {
        onComplete && onComplete();
      }, 3400),
    );

    return () => timers.forEach(clearTimeout);
  }, [visible, animateNumber, onComplete]);

  if (!visible) return null;

  const label = count === 0 ? '🏏 CHOOSE!' : count.toString();
  const color = count === 0 ? Colors.success : Colors.primary;

  return (
    <View style={styles.overlay}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: Colors.backgroundCard,
            borderColor: Colors.borderLight,
            shadowColor: Colors.shadow,
          },
        ]}
      >
        <Text style={[styles.getReady, { color: Colors.textSecondary }]}>GET READY!</Text>
        <Animated.Text
          style={[
            styles.countText,
            { color, transform: [{ scale: scaleAnim }], opacity: fadeAnim },
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  container: {
    alignItems: 'center',
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing['4xl'],
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  getReady: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    letterSpacing: 3,
    marginBottom: Spacing.xl,
  },
  countText: {
    fontSize: Typography['5xl'],
    fontWeight: Typography.black,
    letterSpacing: 2,
  },
});
