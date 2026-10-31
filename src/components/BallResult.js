import React, { useEffect, useRef } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors } from '../theme/ThemeContext';

export default function BallResult({ ball, visible }) {
  const Colors = useColors();
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
  const runColor = isOut ? Colors.danger : Colors.success;
  const resultText = isOut ? '💀 OUT!' : `+${ball.runs}`;
  const resultSubtext = isOut
    ? `Both picked ${ball.batNumber}`
    : `${ball.batNumber} vs ${ball.bowlNumber}`;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
          backgroundColor: isOut ? Colors.primaryAlpha(0.12) : 'rgba(16, 185, 129, 0.12)',
          borderColor: isOut ? Colors.primary : Colors.success,
        },
      ]}
    >
      <Text style={[styles.resultText, { color: runColor }]}>{resultText}</Text>
      <Text style={[styles.subtext, { color: Colors.textSecondary }]}>{resultSubtext}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 2,
    minWidth: 160,
  },
  resultText: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
    marginTop: Spacing.xs,
  },
});
