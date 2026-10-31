import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';

export default function ScoreBoard({
  playerLabel = 'YOU',
  botLabel = 'BOT',
  playerScore = 0,
  botScore = 0,
  target = null,
  isPlayerBatting = true,
  phase,
}) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const playerScaleAnim = useRef(new Animated.Value(1)).current;
  const botScaleAnim = useRef(new Animated.Value(1)).current;

  const prevPlayerScore = useRef(playerScore);
  const prevBotScore = useRef(botScore);

  useEffect(() => {
    if (playerScore !== prevPlayerScore.current) {
      prevPlayerScore.current = playerScore;
      Animated.sequence([
        Animated.spring(playerScaleAnim, { toValue: 1.25, useNativeDriver: true, tension: 300 }),
        Animated.spring(playerScaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }),
      ]).start();
    }
  }, [playerScore, playerScaleAnim]);

  useEffect(() => {
    if (botScore !== prevBotScore.current) {
      prevBotScore.current = botScore;
      Animated.sequence([
        Animated.spring(botScaleAnim, { toValue: 1.25, useNativeDriver: true, tension: 300 }),
        Animated.spring(botScaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }),
      ]).start();
    }
  }, [botScore, botScaleAnim]);

  const runsNeeded = target !== null ? target - (isPlayerBatting ? playerScore : botScore) : null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: Colors.backgroundCard,
          borderColor: Colors.border,
          shadowColor: Colors.shadow,
        },
      ]}
    >
      {/* Three Boxes Row */}
      <View style={styles.scoreRow}>
        {/* Box 1: YOU / Player (Matches Bot box color & styling) */}
        <View
          style={[
            styles.scoreBox,
            {
              backgroundColor: isPlayerBatting ? Colors.primaryTint : (isDark ? 'rgba(255,255,255,0.03)' : Colors.backgroundElevated),
              borderColor: isPlayerBatting ? Colors.primary : Colors.borderLight,
              borderWidth: 1.5,
            },
          ]}
        >
          <Text style={[styles.boxLabel, { color: Colors.textSecondary }]}>{playerLabel}</Text>
          <Animated.Text
            style={[
              styles.boxScore,
              {
                color: Colors.primary,
                transform: [{ scale: playerScaleAnim }],
              },
            ]}
          >
            {playerScore}
          </Animated.Text>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: isPlayerBatting ? Colors.primary : Colors.backgroundCard,
                borderColor: isPlayerBatting ? Colors.primary : Colors.borderLight,
              },
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                { color: isPlayerBatting ? '#FFFFFF' : Colors.textSecondary },
              ]}
            >
              {isPlayerBatting ? '🏏 BAT' : '⚾ BOWL'}
            </Text>
          </View>
        </View>

        {/* Box 2: TARGET (Different highlight color: Amber Gold) */}
        <View
          style={[
            styles.scoreBox,
            styles.targetBox,
            {
              backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
              borderColor: Colors.accentGold,
              borderWidth: 1.5,
            },
          ]}
        >
          <Text style={[styles.boxLabel, { color: Colors.accentGold, fontWeight: '800' }]}>TARGET</Text>
          <Text style={[styles.boxScore, { color: Colors.accentGold }]}>
            {target !== null ? target : '—'}
          </Text>
          {target !== null && runsNeeded !== null && runsNeeded > 0 ? (
            <View style={[styles.needBadge, { backgroundColor: Colors.accentGold }]}>
              <Text style={styles.needBadgeText}>Need {runsNeeded}</Text>
            </View>
          ) : (
            <View style={[styles.needBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.needBadgeText, { color: Colors.textMuted }]}>
                {target !== null ? 'DEFENDING' : '1st INN'}
              </Text>
            </View>
          )}
        </View>

        {/* Box 3: BOT / Opponent (Same color & styling as Player box) */}
        <View
          style={[
            styles.scoreBox,
            {
              backgroundColor: !isPlayerBatting ? Colors.primaryTint : (isDark ? 'rgba(255,255,255,0.03)' : Colors.backgroundElevated),
              borderColor: !isPlayerBatting ? Colors.primary : Colors.borderLight,
              borderWidth: 1.5,
            },
          ]}
        >
          <Text style={[styles.boxLabel, { color: Colors.textSecondary }]}>{botLabel}</Text>
          <Animated.Text
            style={[
              styles.boxScore,
              {
                color: Colors.primary,
                transform: [{ scale: botScaleAnim }],
              },
            ]}
          >
            {botScore}
          </Animated.Text>
          <View
            style={[
              styles.roleBadge,
              {
                backgroundColor: !isPlayerBatting ? Colors.primary : Colors.backgroundCard,
                borderColor: !isPlayerBatting ? Colors.primary : Colors.borderLight,
              },
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                { color: !isPlayerBatting ? '#FFFFFF' : Colors.textSecondary },
              ]}
            >
              {!isPlayerBatting ? '🏏 BAT' : '⚾ BOWL'}
            </Text>
          </View>
        </View>
      </View>

      {/* Innings indicator */}
      <View style={styles.inningsRow}>
        <View style={[styles.inningsDot, { backgroundColor: Colors.primary }]} />
        <Text style={[styles.inningsText, { color: Colors.textMuted }]}>{phase}</Text>
        <View style={[styles.inningsDot, { backgroundColor: Colors.primary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius['2xl'] || BorderRadius.xl,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  scoreBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.xl,
    minHeight: 110,
  },
  targetBox: {
    marginHorizontal: 2,
  },
  boxLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  boxScore: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
    lineHeight: Typography['3xl'] * 1.15,
    marginVertical: 2,
  },
  roleBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    minWidth: 62,
    alignItems: 'center',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  needBadge: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    minWidth: 62,
    alignItems: 'center',
  },
  needBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  inningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  inningsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inningsText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
