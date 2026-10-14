import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';

export default function BallResult({ ball, visible }) {
  const fadeAnimRef = useRef(new Animated.Value(0));
  const scaleAnimRef = useRef(new Animated.Value(0.5));
  const slideAnimRef = useRef(new Animated.Value(30));

  useEffect(() => {
    const fadeAnim = fadeAnimRef.current;
    const scaleAnim = scaleAnimRef.current;
    const slideAnim = slideAnimRef.current;
    if (visible && ball) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 200, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.5, duration: 150, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 30, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, ball]);

  const fadeAnim = fadeAnimRef.current;
  const scaleAnim = scaleAnimRef.current;
  const slideAnim = slideAnimRef.current;

  if (!ball) return null;

  const isOut = ball.isOut;
  const runColor = isOut ? Colors.danger : Colors.accentGreen;
  const resultText = isOut ? '💀 OUT!' : `+${ball.runs}`;
  const resultSubtext = isOut
    ? `Both chose ${ball.batNumber}`
    : `${ball.batNumber} vs ${ball.bowlNumber}`;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: slideAnim }] },
        isOut ? styles.outBg : styles.runBg,
      ]}
    >
      <Text style={[styles.resultText, { color: runColor }]}>{resultText}</Text>
      <Text style={styles.subtext}>{resultSubtext}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    minWidth: 160,
  },
  outBg: {
    backgroundColor: 'rgba(255,107,107,0.15)',
    borderColor: 'rgba(255,107,107,0.5)',
  },
  runBg: {
    backgroundColor: 'rgba(78, 205, 196, 0.12)',
    borderColor: 'rgba(78, 205, 196, 0.4)',
  },
  resultText: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
    letterSpacing: -1,
  },
  subtext: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    marginTop: Spacing.xs,
  },
});
