import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';

export default function Countdown({ onComplete, visible }) {
  const [count, setCount] = useState(3);
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const animateNumber = () => {
    scaleAnim.setValue(0.3);
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 150, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (!visible) return;
    // reset count when countdown becomes visible
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
  }, [visible]);

  if (!visible) return null;

  const label = count === 0 ? '🏏 CHOOSE!' : count.toString();
  const color = count === 0 ? Colors.accentGreen : Colors.accentGold;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <Text style={styles.getReady}>GET READY!</Text>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  container: {
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius['2xl'],
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing['4xl'],
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  getReady: {
    color: Colors.textSecondary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    letterSpacing: 3,
    marginBottom: Spacing.xl,
  },
  countText: {
    fontSize: Typography['5xl'],
    fontWeight: Typography.black,
    letterSpacing: -3,
  },
});
