import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';

export default function ScoreBoard({
  playerLabel = 'YOU',
  botLabel = 'BOT',
  playerScore = 0,
  botScore = 0,
  target = null,
  isPlayerBatting = true,
  phase,
}) {
  const playerScaleAnim = useRef(new Animated.Value(1)).current;
  const botScaleAnim = useRef(new Animated.Value(1)).current;

  const prevPlayerScore = useRef(playerScore);
  const prevBotScore = useRef(botScore);

  useEffect(() => {
    if (playerScore !== prevPlayerScore.current) {
      prevPlayerScore.current = playerScore;
      Animated.sequence([
        Animated.spring(playerScaleAnim, { toValue: 1.3, useNativeDriver: true, tension: 300 }),
        Animated.spring(playerScaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }),
      ]).start();
    }
  }, [playerScore]);

  useEffect(() => {
    if (botScore !== prevBotScore.current) {
      prevBotScore.current = botScore;
      Animated.sequence([
        Animated.spring(botScaleAnim, { toValue: 1.3, useNativeDriver: true, tension: 300 }),
        Animated.spring(botScaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }),
      ]).start();
    }
  }, [botScore]);

  const runsNeeded = target ? target - botScore : null;

  return (
    <View style={styles.container}>
      {/* Score row */}
      <View style={styles.scoreRow}>
        {/* Player */}
        <View style={[styles.scoreBlock, isPlayerBatting && styles.scoreBlockActive]}>
          <Text style={styles.teamLabel}>{playerLabel}</Text>
          <Animated.Text
            style={[styles.score, { transform: [{ scale: playerScaleAnim }] }]}
          >
            {playerScore}
          </Animated.Text>
          <View style={[styles.badge, isPlayerBatting ? styles.badgeBat : styles.badgeBowl]}>
            <Text style={styles.badgeText}>{isPlayerBatting ? '🏏 BAT' : '⚾ BOWL'}</Text>
          </View>
        </View>

        {/* VS divider */}
        <View style={styles.divider}>
          {target !== null ? (
            <View style={styles.targetContainer}>
              <Text style={styles.targetLabel}>TARGET</Text>
              <Text style={styles.targetScore}>{target}</Text>
              {runsNeeded !== null && runsNeeded > 0 && (
                <Text style={styles.needText}>Need {runsNeeded}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.vsText}>VS</Text>
          )}
        </View>

        {/* Bot */}
        <View style={[styles.scoreBlock, !isPlayerBatting && styles.scoreBlockActive]}>
          <Text style={styles.teamLabel}>{botLabel}</Text>
          <Animated.Text
            style={[styles.score, { transform: [{ scale: botScaleAnim }] }]}
          >
            {botScore}
          </Animated.Text>
          <View style={[styles.badge, !isPlayerBatting ? styles.badgeBat : styles.badgeBowl]}>
            <Text style={styles.badgeText}>{!isPlayerBatting ? '🏏 BAT' : '⚾ BOWL'}</Text>
          </View>
        </View>
      </View>

      {/* Innings indicator */}
      <View style={styles.inningsRow}>
        <View style={styles.inningsDot} />
        <Text style={styles.inningsText}>{phase}</Text>
        <View style={styles.inningsDot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreBlock: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  scoreBlockActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  teamLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  score: {
    color: Colors.textPrimary,
    fontSize: Typography['4xl'],
    fontWeight: Typography.black,
    letterSpacing: -2,
  },
  badge: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  badgeBat: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
  },
  badgeBowl: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  divider: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  vsText: {
    color: Colors.textMuted,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  targetContainer: {
    alignItems: 'center',
  },
  targetLabel: {
    color: Colors.accentGold,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 1.5,
  },
  targetScore: {
    color: Colors.accentGold,
    fontSize: Typography['2xl'],
    fontWeight: Typography.black,
  },
  needText: {
    color: Colors.accent,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    marginTop: 2,
  },
  inningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  inningsDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  inningsText: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
