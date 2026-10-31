import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Gradients } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';

export default function OnlineGameOverScreen({ route, navigation }) {
  const { game, winnerTeamId, myPlayerId } = route.params;
  const Colors = useColors();
  const { isDark } = useTheme();

  const TEAM_COLORS = [Colors.teamA, Colors.teamB, Colors.accentGreen, Colors.accentGold];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const trophyAnim = useRef(new Animated.Value(0)).current;

  const myPlayer = game.players[myPlayerId];
  const winnerTeam = game.teams.find((t) => t.teamId === winnerTeamId);
  const winnerIndex = game.teams.indexOf(winnerTeam);
  const winnerColor = TEAM_COLORS[winnerIndex % TEAM_COLORS.length] || Colors.primary;
  const myTeam = myPlayer ? game.teams.find((t) => t.players.includes(myPlayerId)) : null;
  const didWin = myTeam?.teamId === winnerTeamId;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.loop(
        Animated.sequence([
          Animated.timing(trophyAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(trophyAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ]),
        { iterations: 3 },
      ),
    ]).start();
  }, [fadeAnim, scaleAnim, trophyAnim]);

  const trophyScale = trophyAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      {/* Winner glow */}
      <View style={[styles.winnerGlow, { backgroundColor: winnerColor }]} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          {/* Trophy */}
          <Animated.Text style={[styles.trophy, { transform: [{ scale: trophyScale }] }]}>
            {didWin ? '🏆' : '💀'}
          </Animated.Text>

          <Text style={[styles.winnerName, { color: winnerColor }]}>{winnerTeam?.name}</Text>
          <Text style={[styles.winnerLabel, { color: winnerColor }]}>WINS!</Text>
          <Text style={[styles.personalResult, { color: Colors.textSecondary }]}>
            {didWin ? '🎉 You won with your team!' : '😔 Better luck next time!'}
          </Text>
          {myPlayer && (
            <Text style={[styles.myScore, { color: Colors.textMuted }]}>
              Your score: {myPlayer.score} runs
            </Text>
          )}

          {/* Team scores */}
          <View style={styles.teamScoreCards}>
            {game.teams.map((team, ti) => {
              const color = TEAM_COLORS[ti % TEAM_COLORS.length] || Colors.primary;
              const isWinner = team.teamId === winnerTeamId;
              return (
                <View
                  key={team.teamId}
                  style={[
                    styles.teamScoreCard,
                    {
                      backgroundColor: Colors.backgroundCard,
                      borderColor: isWinner ? color : Colors.border,
                      borderWidth: isWinner ? 2 : 1,
                      shadowColor: Colors.shadow,
                    },
                  ]}
                >
                  {isWinner && <Text style={[styles.winnerBadge, { color }]}>🏆 WINNER</Text>}
                  <Text style={[styles.teamScoreName, { color }]}>{team.name}</Text>
                  <Text style={[styles.teamScoreTotal, { color }]}>{team.totalScore}</Text>
                </View>
              );
            })}
          </View>

          {/* Full scorecard */}
          <View style={styles.scorecardSection}>
            <Text style={[styles.scorecardTitle, { color: Colors.textMuted }]}>PLAYER SCORECARD</Text>
            {game.teams.map((team, ti) => {
              const color = TEAM_COLORS[ti % TEAM_COLORS.length] || Colors.primary;
              return (
                <View
                  key={team.teamId}
                  style={[
                    styles.scorecardTeam,
                    {
                      backgroundColor: Colors.backgroundCard,
                      borderColor: Colors.border,
                      shadowColor: Colors.shadow,
                    },
                  ]}
                >
                  <View style={[styles.scorecardTeamHeader, { backgroundColor: color + '15', borderBottomColor: Colors.border }]}>
                    <Text style={[styles.scorecardTeamName, { color }]}>{team.name}</Text>
                    <Text style={[styles.scorecardTeamTotal, { color }]}>{team.totalScore} total</Text>
                  </View>
                  {team.players.map((pid) => {
                    const p = game.players[pid];
                    if (!p) return null;
                    const isMe = pid === myPlayerId;
                    return (
                      <View
                        key={pid}
                        style={[
                          styles.scorecardRow,
                          { borderBottomColor: Colors.border },
                          isMe && { backgroundColor: color + '12' },
                        ]}
                      >
                        <Text style={[styles.scorecardPlayerName, { color: Colors.textPrimary }]}>
                          {isMe ? '⭐ ' : '  '}{p.name}
                        </Text>
                        <Text style={[styles.scorecardStatus, { color: Colors.textMuted }]}>{p.status}</Text>
                        <Text style={[styles.scorecardScore, { color }]}>{p.score}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Home')}
              activeOpacity={0.85}
              style={[styles.homeBtnWrapper, { shadowColor: Colors.shadow }]}
            >
              <LinearGradient colors={Gradients.primary} style={styles.homeBtn}>
                <Text style={styles.homeBtnText}>🏠  BACK TO HOME</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  winnerGlow: {
    position: 'absolute', top: -100, alignSelf: 'center',
    width: 300, height: 300, borderRadius: 150, opacity: 0.1,
  },
  scroll: { paddingBottom: Spacing['4xl'] },
  content: { paddingHorizontal: Spacing.xl, paddingTop: 60, alignItems: 'center' },
  trophy: { fontSize: 72, marginBottom: Spacing.md },
  winnerName: { fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: 2 },
  winnerLabel: { fontSize: Typography['2xl'], fontWeight: Typography.black, letterSpacing: 4, marginBottom: Spacing.sm },
  personalResult: { fontSize: Typography.md, marginBottom: Spacing.xs, fontWeight: '600' },
  myScore: { fontSize: Typography.sm, marginBottom: Spacing.xl },
  teamScoreCards: { flexDirection: 'row', gap: Spacing.md, width: '100%', marginBottom: Spacing.xl },
  teamScoreCard: {
    flex: 1, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  winnerBadge: { fontSize: Typography.xs, fontWeight: Typography.bold, marginBottom: Spacing.xs },
  teamScoreName: { fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: 1 },
  teamScoreTotal: { fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: -1, marginTop: 4 },
  scorecardSection: { width: '100%', marginBottom: Spacing.xl },
  scorecardTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.md },
  scorecardTeam: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  scorecardTeamHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  scorecardTeamName: { fontSize: Typography.md, fontWeight: Typography.bold },
  scorecardTeamTotal: { fontSize: Typography.md, fontWeight: Typography.bold },
  scorecardRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  scorecardPlayerName: { flex: 1, fontSize: Typography.base },
  scorecardStatus: { fontSize: Typography.xs, marginRight: Spacing.lg },
  scorecardScore: { fontSize: Typography.lg, fontWeight: Typography.black, minWidth: 40, textAlign: 'right' },
  actions: { width: '100%' },
  homeBtnWrapper: {
    borderRadius: BorderRadius.full, overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  homeBtn: { paddingVertical: Spacing.lg, alignItems: 'center' },
  homeBtnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold, letterSpacing: 1 },
});
