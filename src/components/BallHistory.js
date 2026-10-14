import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';

export default function BallHistory({ history = [] }) {
  if (history.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BALL BY BALL</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {history.map((ball, i) => (
          <View
            key={i}
            style={[
              styles.ball,
              ball.isOut ? styles.ballOut : ball.runs === 0 ? styles.ballDot : styles.ballRun,
            ]}
          >
            <Text style={[styles.ballText, ball.isOut && styles.ballOutText]}>
              {ball.isOut ? 'W' : ball.runs === 0 ? '·' : ball.runs}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
  },
  title: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  scrollContent: {
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  ball: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  ballRun: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderColor: Colors.accentGreen,
  },
  ballOut: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    borderColor: Colors.danger,
  },
  ballDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: Colors.textMuted,
  },
  ballText: {
    color: Colors.textPrimary,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
  ballOutText: {
    color: Colors.danger,
  },
});
