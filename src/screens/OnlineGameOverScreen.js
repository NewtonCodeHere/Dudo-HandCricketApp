import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';

const TEAM_COLORS = [Colors.teamA, Colors.teamB, Colors.accentGreen, Colors.accentGold];

export default function OnlineGameOverScreen({ route, navigation }) {
  const { game, winnerTeamId, winnerTeamName, myPlayerId } = route.params;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const trophyAnim = useRef(new Animated.Value(0)).current;

  const myPlayer = game.players[myPlayerId];
  const winnerTeam = game.teams.find((t) => t.teamId === winnerTeamId);
  const winnerIndex = game.teams.indexOf(winnerTeam);
  const winnerColor = TEAM_COLORS[winnerIndex % TEAM_COLORS.length];
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
  }, []);

  const trophyScale = trophyAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A1A', '#12122A', '#0A0A1A']} style={StyleSheet.absoluteFill} />

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
          <Text style={styles.personalResult}>
            {didWin ? '🎉 You won with your team!' : '😔 Better luck next time!'}
          </Text>
          {myPlayer && (
            <Text style={styles.myScore}>Your score: {myPlayer.score} runs</Text>
          )}

          {/* Team scores */}
          <View style={styles.teamScoreCards}>
            {game.teams.map((team, ti) => {
              const color = TEAM_COLORS[ti % TEAM_COLORS.length];
              const isWinner = team.teamId === winnerTeamId;
              return (
                <View key={team.teamId} style={[styles.teamScoreCard, { borderColor: color + (isWinner ? 'AA' : '33') }, isWinner && styles.winnerCard]}>
                  {isWinner && <Text style={styles.winnerBadge}>🏆 WINNER</Text>}
                  <Text style={[styles.teamScoreName, { color }]}>{team.name}</Text>
                  <Text style={[styles.teamScoreTotal, { color }]}>{team.totalScore}</Text>
                </View>
              );
            })}
          </View>

          {/* Full scorecard */}
          <View style={styles.scorecardSection}>
            <Text style={styles.scorecardTitle}>PLAYER SCORECARD</Text>
            {game.teams.map((team, ti) => {
              const color = TEAM_COLORS[ti % TEAM_COLORS.length];
              return (
                <View key={team.teamId} style={styles.scorecardTeam}>
                  <View style={[styles.scorecardTeamHeader, { backgroundColor: color + '22', borderColor: color + '44' }]}>
                    <Text style={[styles.scorecardTeamName, { color }]}>{team.name}</Text>
                    <Text style={[styles.scorecardTeamTotal, { color }]}>{team.totalScore} total</Text>
                  </View>
                  {team.players.map((pid) => {
                    const p = game.players[pid];
                    if (!p) return null;
                    const isMe = pid === myPlayerId;
                    return (
                      <View key={pid} style={[styles.scorecardRow, isMe && styles.scorecardRowMe]}>
                        <Text style={styles.scorecardPlayerName}>
                          {isMe ? '⭐ ' : '  '}{p.name}
                        </Text>
                        <Text style={styles.scorecardStatus}>{p.status}</Text>
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
              style={styles.homeBtnWrapper}
            >
              <LinearGradient colors={['#6C63FF', '#4C45CC']} style={styles.homeBtn}>
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
  container: { flex: 1, backgroundColor: Colors.background },
  winnerGlow: {
    position: 'absolute', top: -100, alignSelf: 'center',
    width: 300, height: 300, borderRadius: 150, opacity: 0.06,
  },
  scroll: { paddingBottom: Spacing['4xl'] },
  content: { paddingHorizontal: Spacing.xl, paddingTop: 80, alignItems: 'center' },
  trophy: { fontSize: 80, marginBottom: Spacing.lg },
  winnerName: { fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: 2 },
  winnerLabel: { fontSize: Typography['2xl'], fontWeight: Typography.black, letterSpacing: 4, marginBottom: Spacing.md },
  personalResult: { color: Colors.textSecondary, fontSize: Typography.md, marginBottom: Spacing.xs },
  myScore: { color: Colors.textMuted, fontSize: Typography.sm, marginBottom: Spacing['2xl'] },
  teamScoreCards: { flexDirection: 'row', gap: Spacing.md, width: '100%', marginBottom: Spacing['2xl'] },
  teamScoreCard: {
    flex: 1, backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center', borderWidth: 1.5,
  },
  winnerCard: { backgroundColor: 'rgba(255,255,255,0.04)' },
  winnerBadge: { fontSize: Typography.xs, fontWeight: Typography.bold, marginBottom: Spacing.xs },
  teamScoreName: { fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: 1 },
  teamScoreTotal: { fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: -2, marginTop: 4 },
  scorecardSection: { width: '100%', marginBottom: Spacing['2xl'] },
  scorecardTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.md },
  scorecardTeam: { backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  scorecardTeamHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  scorecardTeamName: { fontSize: Typography.md, fontWeight: Typography.bold },
  scorecardTeamTotal: { fontSize: Typography.md, fontWeight: Typography.bold },
  scorecardRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  scorecardRowMe: { backgroundColor: 'rgba(108,99,255,0.08)' },
  scorecardPlayerName: { flex: 1, color: Colors.textPrimary, fontSize: Typography.base },
  scorecardStatus: { color: Colors.textMuted, fontSize: Typography.xs, marginRight: Spacing.lg },
  scorecardScore: { fontSize: Typography.lg, fontWeight: Typography.black, minWidth: 40, textAlign: 'right' },
  actions: { width: '100%' },
  homeBtnWrapper: {
    borderRadius: BorderRadius.xl, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  homeBtn: { paddingVertical: Spacing.lg, alignItems: 'center' },
  homeBtnText: { color: '#fff', fontSize: Typography.lg, fontWeight: Typography.bold, letterSpacing: 1 },
});
