import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors } from '../theme/ThemeContext';

export default function BallHistory({ history = [] }) {
  const Colors = useColors();
  if (history.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: Colors.textMuted }]}>BALL BY BALL</Text>
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
              ball.isOut
                ? {
                    backgroundColor: Colors.primaryAlpha(0.18),
                    borderColor: Colors.danger,
                  }
                : ball.runs === 0
                ? {
                    backgroundColor: Colors.backgroundElevated,
                    borderColor: Colors.borderLight,
                  }
                : {
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderColor: Colors.success,
                  },
            ]}
          >
            <Text
              style={[
                styles.ballText,
                {
                  color: ball.isOut
                    ? Colors.danger
                    : ball.runs === 0
                    ? Colors.textMuted
                    : Colors.success,
                },
              ]}
            >
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
  ballText: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
  },
});
