import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Animated, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, Gradients } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';
import FingerButton from '../components/FingerButton';
import BallResult from '../components/BallResult';
import BallHistory from '../components/BallHistory';
import Countdown from '../components/Countdown';
import CelebrationOverlay from '../components/CelebrationOverlay';
import { useGameplay } from '../networking/hooks';
import { SOCKET_EVENTS } from '../networking/config';
import { FINGER_NUMBERS } from '../game/gameRules';



export default function OnlineGameScreen({ route, navigation }) {
  const { game: initialGame, matches: initialMatches, myPlayerId, isHost } = route.params;
  const Colors = useColors();
  const { isDark } = useTheme();
  const TEAM_COLORS = [Colors.teamA, Colors.teamB, Colors.accentGreen, Colors.accentGold];

  const [game, setGame] = useState(initialGame);
  const [matches, setMatches] = useState(initialMatches);
  const [myPlayer, setMyPlayer] = useState(initialGame.players[myPlayerId]);

  // UI state
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [opponentSubmitted, setOpponentSubmitted] = useState(false);
  const [showCountdown, setShowCountdown] = useState(true);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [lastBall, setLastBall] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [inningsBreakData, setInningsBreakData] = useState(null);
  const [isSpectating, setIsSpectating] = useState(false);
  const [spectatorMatchIndex, setSpectatorMatchIndex] = useState(0);
  const [celebrationRuns, setCelebrationRuns] = useState(null);

  // Disconnection notification
  const [disconnectNotice, setDisconnectNotice] = useState(null);

  const resultTimer = useRef(null);
  const { submitBall, startSecondInnings, getSpectatorView, subscribe } = useGameplay();

  // Find my active match
  const myMatch = matches.find(
    (m) =>
      m.status === 'ACTIVE' &&
      (m.battingPlayerId === myPlayerId || m.bowlingPlayerId === myPlayerId),
  );
  const amBatting = myMatch?.battingPlayerId === myPlayerId;
  const amBowling = myMatch?.bowlingPlayerId === myPlayerId;
  const myStatus = game.players[myPlayerId]?.status;
  const amOut = myStatus === 'OUT' || myStatus === 'SPECTATING';

  // Determine which team is batting/bowling
  const team0 = game.teams[0];
  const team1 = game.teams[1];
  const team0Color = TEAM_COLORS[0];
  const team1Color = TEAM_COLORS[1];

  // ─── Socket listeners ──────────────────────────────────────────────────

  useEffect(() => {
    const unsubBallSubmitted = subscribe(SOCKET_EVENTS.BALL_SUBMITTED, () => {
      // My submission acknowledged
    });

    const unsubOpponentSubmitted = subscribe(SOCKET_EVENTS.OPPONENT_SUBMITTED, () => {
      setOpponentSubmitted(true);
    });

    const unsubBallResolved = subscribe(SOCKET_EVENTS.BALL_RESOLVED, ({ matchId, ball, result, game: g }) => {
      setGame(g);
      setMatches(g.matches);

      // If it's our match
      const resolvedMatch = g.matches.find((m) => m.matchId === matchId);
      if (resolvedMatch && (resolvedMatch.battingPlayerId === myPlayerId || resolvedMatch.bowlingPlayerId === myPlayerId)) {
        setLastBall(ball);
        setShowResult(true);
        setSubmitted(false);
        setOpponentSubmitted(false);
        setSelectedNumber(null);

        if (resultTimer.current) clearTimeout(resultTimer.current);
        resultTimer.current = setTimeout(() => {
          setShowResult(false);
          setLastBall(null);
          // Re-enable input for next ball if still active
          const updatedMatch = g.matches.find((m) => m.matchId === matchId);
          if (updatedMatch?.status === 'ACTIVE') {
            setShowCountdown(true);
            setInputEnabled(false);
          }
        }, 2000);

        // 🎉 Celebration for big hits when player is batting
        const amCurrentlyBatting = resolvedMatch.battingPlayerId === myPlayerId;
        if (amCurrentlyBatting && !ball.isOut && ball.runs >= 6) {
          setCelebrationRuns(ball.runs);
        }
      }

      // Update my player status
      if (g.players[myPlayerId]) {
        setMyPlayer(g.players[myPlayerId]);
      }
    });

    const unsubMatchFinished = subscribe(SOCKET_EVENTS.MATCH_FINISHED, ({ matchId, game: g }) => {
      setGame(g);
      setMatches(g.matches);
      if (g.players[myPlayerId]) {
        const p = g.players[myPlayerId];
        setMyPlayer(p);
        if (p.status === 'SPECTATING' || p.status === 'OUT') {
          setIsSpectating(true);
        }
      }
    });

    const unsubInningsBreak = subscribe(SOCKET_EVENTS.INNINGS_BREAK, ({ game: g, target, inningsResult }) => {
      setGame(g);
      setMatches(g.matches);
      setInningsBreakData({ target, inningsResult });
      setShowInningsBreak(true);
    });

    const unsubSecondInnings = subscribe(SOCKET_EVENTS.SECOND_INNINGS_STARTED, ({ game: g, matches: m }) => {
      setGame(g);
      setMatches(g.matches);
      setShowInningsBreak(false);
      setIsSpectating(false);
      setSubmitted(false);
      setOpponentSubmitted(false);
      setSelectedNumber(null);
      if (g.players[myPlayerId]) {
        setMyPlayer(g.players[myPlayerId]);
        const myNewStatus = g.players[myPlayerId].status;
        if (myNewStatus === 'BATTING' || myNewStatus === 'BOWLING') {
          setShowCountdown(true);
          setInputEnabled(false);
          setIsSpectating(false);
        } else {
          setIsSpectating(true);
        }
      }
    });

    const unsubGameOver = subscribe(SOCKET_EVENTS.GAME_OVER, ({ game: g, winnerTeamId, winnerTeamName }) => {
      setGame(g);
      navigation.replace('OnlineGameOver', { game: g, winnerTeamId, winnerTeamName, myPlayerId });
    });

    const unsubDisconnect = subscribe(SOCKET_EVENTS.PLAYER_DISCONNECTED, ({ playerName, reconnectWindowSeconds, game: g }) => {
      setGame(g);
      setDisconnectNotice({ playerName, window: reconnectWindowSeconds });
      setTimeout(() => setDisconnectNotice(null), 5000);
    });

    const unsubReconnect = subscribe(SOCKET_EVENTS.PLAYER_RECONNECTED, ({ game: g }) => {
      setGame(g);
      setDisconnectNotice(null);
    });

    return () => {
      unsubBallSubmitted(); unsubOpponentSubmitted(); unsubBallResolved();
      unsubMatchFinished(); unsubInningsBreak(); unsubSecondInnings();
      unsubGameOver(); unsubDisconnect(); unsubReconnect();
      if (resultTimer.current) clearTimeout(resultTimer.current);
    };
  }, [myPlayerId]);

  const onCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setInputEnabled(true);
  }, []);

  const handleNumberSelect = useCallback((n) => {
    if (!inputEnabled || submitted) return;
    setSelectedNumber(n);
    setSubmitted(true);
    setInputEnabled(false);
    submitBall(n);
  }, [inputEnabled, submitted]);

  const handleStartSecondInnings = () => {
    startSecondInnings();
  };

  // Active matches for the scoreboard
  const activeMatches = matches.filter((m) => m.status === 'ACTIVE');
  const spectatorMatches = activeMatches.filter(
    (m) => m.battingPlayerId !== myPlayerId && m.bowlingPlayerId !== myPlayerId,
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      {/* 🎉 Celebration overlay */}
      <CelebrationOverlay
        runs={celebrationRuns}
        visible={celebrationRuns !== null}
        onComplete={() => setCelebrationRuns(null)}
      />

      {/* Countdown */}
      {showCountdown && !isSpectating && (myMatch?.status === 'ACTIVE') && (
        <Countdown visible onComplete={onCountdownComplete} />
      )}

      {/* Disconnect notice */}
      {disconnectNotice && (
        <View style={styles.disconnectBanner}>
          <Text style={styles.disconnectText}>
            ⚡ {disconnectNotice.playerName} disconnected — {disconnectNotice.window}s to reconnect
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.inningsLabel}>
              {game.currentInnings === 1 ? '1st INNINGS' : '2nd INNINGS'}
            </Text>
          </View>
          {game.target && (
            <View style={styles.targetBadge}>
              <Text style={styles.targetLabel}>TARGET</Text>
              <Text style={styles.targetScore}>{game.target}</Text>
            </View>
          )}
        </View>

        {/* Team scoreboard */}
        <TeamScoreboard game={game} team0Color={team0Color} team1Color={team1Color} Colors={Colors} />

        {/* Active matches list */}
        <View style={styles.matchesSection}>
          <Text style={styles.sectionTitle}>ACTIVE MATCHES</Text>
          {activeMatches.map((m) => (
            <MatchCard
              key={m.matchId}
              match={m}
              game={game}
              isMyMatch={m.battingPlayerId === myPlayerId || m.bowlingPlayerId === myPlayerId}
              team0Color={team0Color}
              team1Color={team1Color}
            />
          ))}
          {activeMatches.length === 0 && (
            <View style={styles.noMatchBox}>
              <Text style={styles.noMatchText}>⏳ All matches in progress...</Text>
            </View>
          )}
        </View>

        {/* My match or spectator view */}
        {!isSpectating && myMatch?.status === 'ACTIVE' ? (
          <View style={styles.myMatchSection}>
            <Text style={styles.sectionTitle}>YOUR MATCH</Text>

            {/* Ball History */}
            <BallHistory history={myMatch.ballHistory || []} />

            {/* Status */}
            <View style={styles.statusArea}>
              {showResult && lastBall ? (
                <BallResult ball={lastBall} visible={showResult} />
              ) : submitted && !opponentSubmitted ? (
                <View style={styles.waitCard}>
                  <Text style={styles.waitEmoji}>⏳</Text>
                  <Text style={styles.waitText}>Waiting for opponent...</Text>
                  <Text style={styles.waitSub}>You chose: {selectedNumber}</Text>
                </View>
              ) : submitted && opponentSubmitted ? (
                <View style={styles.waitCard}>
                  <Text style={styles.waitEmoji}>⚡</Text>
                  <Text style={styles.waitText}>Both submitted! Resolving...</Text>
                </View>
              ) : inputEnabled ? (
                <View style={styles.roleCard}>
                  <Text style={styles.roleText}>
                    {amBatting ? '🏏 You are BATTING' : '⚾ You are BOWLING'}
                  </Text>
                  <Text style={styles.roleHint}>
                    {amBatting ? 'Pick a number to score runs!' : 'Match their number for OUT!'}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Finger grid */}
            <View style={styles.fingerGrid}>
              <View style={styles.fingerRow}>
                {FINGER_NUMBERS.slice(0, 5).map((n) => (
                  <FingerButton
                    key={n} number={n} onPress={handleNumberSelect}
                    selected={selectedNumber === n}
                    disabled={!inputEnabled || submitted}
                  />
                ))}
              </View>
              <View style={styles.fingerRow}>
                {FINGER_NUMBERS.slice(5).map((n) => (
                  <FingerButton
                    key={n} number={n} onPress={handleNumberSelect}
                    selected={selectedNumber === n}
                    disabled={!inputEnabled || submitted}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : isSpectating ? (
          <SpectatorView
            matches={spectatorMatches}
            game={game}
            spectatorMatchIndex={spectatorMatchIndex}
            onSwitchMatch={() => setSpectatorMatchIndex((i) => (i + 1) % Math.max(1, spectatorMatches.length))}
            myPlayer={myPlayer}
          />
        ) : null}
      </ScrollView>

      {/* Innings break modal */}
      <InningsBreakModal
        visible={showInningsBreak}
        data={inningsBreakData}
        isHost={isHost}
        game={game}
        onStart={handleStartSecondInnings}
      />
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TeamScoreboard({ game, team0Color, team1Color }) {
  const team0 = game.teams[0];
  const team1 = game.teams[1];
  const runsNeeded = game.target ? game.target - team1.totalScore : null;

  return (
    <View style={styles.scoreboard}>
      <TeamScoreBlock team={team0} color={team0Color} />
      <View style={styles.scoreboardDivider}>
        {game.target ? (
          <View style={styles.targetBlock}>
            <Text style={styles.targetMiniLabel}>TARGET</Text>
            <Text style={styles.targetMiniScore}>{game.target}</Text>
            {runsNeeded !== null && runsNeeded > 0 && (
              <Text style={styles.needText}>Need {runsNeeded}</Text>
            )}
          </View>
        ) : <Text style={styles.vsText}>VS</Text>}
      </View>
      <TeamScoreBlock team={team1} color={team1Color} />
    </View>
  );
}

function TeamScoreBlock({ team, color }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(team.totalScore);

  useEffect(() => {
    if (team.totalScore !== prevScore.current) {
      prevScore.current = team.totalScore;
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true, tension: 300 }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }),
      ]).start();
    }
  }, [team.totalScore]);

  return (
    <View style={[styles.teamScoreBlock, { borderColor: color + '33' }]}>
      <Text style={[styles.teamScoreLabel, { color }]}>{team.name.toUpperCase()}</Text>
      <Animated.Text style={[styles.teamScore, { color, transform: [{ scale: scaleAnim }] }]}>
        {team.totalScore}
      </Animated.Text>
    </View>
  );
}

function MatchCard({ match, game, isMyMatch, team0Color, team1Color }) {
  const batPlayer = game.players[match.battingPlayerId];
  const bowlPlayer = game.players[match.bowlingPlayerId];
  const batTeamColor = game.teams[0].players.includes(match.battingPlayerId) ? team0Color : team1Color;

  return (
    <View style={[styles.matchCard, isMyMatch && styles.matchCardHighlight]}>
      {isMyMatch && (
        <View style={styles.myMatchBadge}>
          <Text style={styles.myMatchBadgeText}>YOUR MATCH</Text>
        </View>
      )}
      <View style={styles.matchRow}>
        <View style={styles.matchPlayer}>
          <Text style={[styles.matchPlayerName, { color: batTeamColor }]}>{batPlayer?.name || '?'}</Text>
          <Text style={[styles.matchPlayerScore, { color: batTeamColor }]}>{batPlayer?.score || 0}</Text>
          <Text style={styles.matchPlayerRole}>🏏 BAT</Text>
        </View>
        <View style={styles.matchVs}>
          <Text style={styles.matchVsText}>⚔️</Text>
          {/* Submission indicators */}
          <View style={styles.submitRow}>
            <View style={[styles.submitDot, match.hasBatSubmitted && styles.submitDotActive]} />
            <View style={[styles.submitDot, match.hasBowlSubmitted && styles.submitDotActive]} />
          </View>
        </View>
        <View style={[styles.matchPlayer, styles.matchPlayerRight]}>
          <Text style={styles.matchPlayerName}>{bowlPlayer?.name || '?'}</Text>
          <Text style={styles.matchPlayerScore}>{bowlPlayer?.score || 0}</Text>
          <Text style={styles.matchPlayerRole}>⚾ BOWL</Text>
        </View>
      </View>
      {/* Ball history mini */}
      <View style={styles.matchMiniHistory}>
        {(match.ballHistory || []).slice(-6).map((b, i) => (
          <View key={i} style={[styles.miniBall, b.isOut ? styles.miniBallOut : styles.miniBallRun]}>
            <Text style={styles.miniBallText}>{b.isOut ? 'W' : b.runs}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SpectatorView({ matches, game, spectatorMatchIndex, onSwitchMatch, myPlayer }) {
  const activeMatch = matches[spectatorMatchIndex];
  const batPlayer = activeMatch ? game.players[activeMatch.battingPlayerId] : null;
  const bowlPlayer = activeMatch ? game.players[activeMatch.bowlingPlayerId] : null;

  return (
    <View style={styles.spectatorSection}>
      <View style={styles.spectatorHeader}>
        <Text style={styles.youAreOutText}>💀 YOU ARE OUT</Text>
        <Text style={styles.myScoreText}>Your Score: {myPlayer.score}</Text>
      </View>

      <Text style={styles.sectionTitle}>SPECTATING</Text>

      {activeMatch ? (
        <View style={styles.spectatorMatchCard}>
          <Text style={styles.spectatorMatchLabel}>{batPlayer?.name} vs {bowlPlayer?.name}</Text>
          <View style={styles.spectatorScores}>
            <View style={styles.spectatorScoreBlock}>
              <Text style={styles.spectatorPlayerName}>{batPlayer?.name}</Text>
              <Text style={styles.spectatorScore}>{batPlayer?.score}</Text>
              <Text style={styles.spectatorRole}>🏏 BAT</Text>
            </View>
            <Text style={styles.spectatorVs}>⚔️</Text>
            <View style={[styles.spectatorScoreBlock, styles.spectatorScoreRight]}>
              <Text style={styles.spectatorPlayerName}>{bowlPlayer?.name}</Text>
              <Text style={styles.spectatorScore}>{bowlPlayer?.score}</Text>
              <Text style={styles.spectatorRole}>⚾ BOWL</Text>
            </View>
          </View>
          <BallHistory history={activeMatch.ballHistory || []} />
        </View>
      ) : (
        <View style={styles.noMatchBox}>
          <Text style={styles.noMatchText}>No active matches to watch</Text>
        </View>
      )}

      {matches.length > 1 && (
        <TouchableOpacity onPress={onSwitchMatch} style={styles.switchMatchBtn} activeOpacity={0.7}>
          <Text style={styles.switchMatchText}>👁️ SWITCH MATCH ({spectatorMatchIndex + 1}/{matches.length})</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InningsBreakModal({ visible, data, isHost, game, onStart }) {
  if (!data) return null;
  const battingTeam = game.teams[0];
  const chasingTeam = game.teams[1];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <LinearGradient colors={['#1A1A35', '#12122A']} style={styles.modalGrad}>
            <Text style={styles.modalTitle}>⚡ INNINGS BREAK</Text>
            <View style={styles.inningsResult}>
              <Text style={styles.inningsResultTeam}>{battingTeam.name}</Text>
              <Text style={styles.inningsResultScore}>{battingTeam.totalScore}</Text>
            </View>
            <View style={styles.targetBadgeModal}>
              <Text style={styles.targetBadgeLabel}>TARGET FOR {chasingTeam.name}</Text>
              <Text style={styles.targetBadgeScore}>{data.target}</Text>
            </View>
            {isHost ? (
              <TouchableOpacity onPress={onStart} activeOpacity={0.85} style={styles.startInningsBtnWrapper}>
                <LinearGradient colors={['#6C63FF', '#4C45CC']} style={styles.startInningsBtn}>
                  <Text style={styles.startInningsBtnText}>🏏  START 2ND INNINGS</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <View style={styles.waitingHostBox}>
                <Text style={styles.waitingHostText}>⏳ Waiting for host to start 2nd innings...</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing['4xl'] },

  disconnectBanner: {
    backgroundColor: Colors.danger + 'CC', padding: Spacing.md,
    alignItems: 'center', zIndex: 999,
  },
  disconnectText: { color: '#fff', fontSize: Typography.sm, fontWeight: Typography.bold },

  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 52, paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg,
  },
  inningsLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2 },
  targetBadge: { backgroundColor: Colors.accentGold + '22', borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: Colors.accentGold + '55', alignItems: 'center' },
  targetLabel: { color: Colors.accentGold, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1 },
  targetScore: { color: Colors.accentGold, fontSize: Typography.lg, fontWeight: Typography.black },

  scoreboard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.xl, backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  teamScoreBlock: {
    flex: 1, alignItems: 'center', padding: Spacing.md,
    borderRadius: BorderRadius.lg, borderWidth: 1,
  },
  teamScoreLabel: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2 },
  teamScore: { fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: -2, marginTop: 4 },
  scoreboardDivider: { paddingHorizontal: Spacing.md, alignItems: 'center' },
  targetBoxOnline: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xs,
    minHeight: 85,
  },
  needBadgeOnline: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  needBadgeTextOnline: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  targetBlock: { alignItems: 'center' },
  targetMiniLabel: { color: Colors.accentGold, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1 },
  targetMiniScore: { color: Colors.accentGold, fontSize: Typography.xl, fontWeight: Typography.black },
  needText: { color: Colors.accent, fontSize: Typography.xs, fontWeight: Typography.semibold },
  vsText: { color: Colors.textMuted, fontSize: Typography.xl, fontWeight: Typography.bold },

  matchesSection: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.md },

  matchCard: {
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  matchCardHighlight: { borderColor: Colors.primary, backgroundColor: 'rgba(108,99,255,0.08)' },
  myMatchBadge: {
    backgroundColor: Colors.primary + '33', borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: Spacing.sm,
  },
  myMatchBadgeText: { color: Colors.primary, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1 },
  matchRow: { flexDirection: 'row', alignItems: 'center' },
  matchPlayer: { flex: 1, alignItems: 'flex-start' },
  matchPlayerRight: { alignItems: 'flex-end' },
  matchPlayerName: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.bold },
  matchPlayerScore: { color: Colors.textPrimary, fontSize: Typography['2xl'], fontWeight: Typography.black },
  matchPlayerRole: { color: Colors.textMuted, fontSize: Typography.xs, marginTop: 2 },
  matchVs: { alignItems: 'center', paddingHorizontal: Spacing.md },
  matchVsText: { fontSize: Typography.xl },
  submitRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  submitDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.textMuted },
  submitDotActive: { backgroundColor: Colors.accentGreen },
  matchMiniHistory: { flexDirection: 'row', gap: 4, marginTop: Spacing.sm, flexWrap: 'wrap' },
  miniBall: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  miniBallRun: { backgroundColor: Colors.accentGreen + '33' },
  miniBallOut: { backgroundColor: Colors.danger + '33' },
  miniBallText: { color: Colors.textPrimary, fontSize: 10, fontWeight: Typography.bold },

  myMatchSection: { paddingHorizontal: Spacing.xl },
  statusArea: { minHeight: 80, alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.md },
  waitCard: {
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, width: '100%',
  },
  waitEmoji: { fontSize: 28, marginBottom: Spacing.xs },
  waitText: { color: Colors.textSecondary, fontSize: Typography.base, fontWeight: Typography.semibold },
  waitSub: { color: Colors.textMuted, fontSize: Typography.sm, marginTop: 2 },
  roleCard: { alignItems: 'center' },
  roleText: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.bold },
  roleHint: { color: Colors.textSecondary, fontSize: Typography.sm, marginTop: 4 },

  fingerGrid: {
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  fingerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: Spacing.xs },

  noMatchBox: {
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  noMatchText: { color: Colors.textMuted, fontSize: Typography.sm },

  // Spectator
  spectatorSection: { paddingHorizontal: Spacing.xl },
  spectatorHeader: {
    backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: BorderRadius.xl,
    padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.xl,
    borderWidth: 1, borderColor: Colors.danger + '44',
  },
  youAreOutText: { color: Colors.danger, fontSize: Typography.xl, fontWeight: Typography.black, letterSpacing: 1 },
  myScoreText: { color: Colors.textSecondary, fontSize: Typography.base, marginTop: Spacing.xs },
  spectatorMatchCard: {
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.md,
  },
  spectatorMatchLabel: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.md },
  spectatorScores: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  spectatorScoreBlock: { flex: 1, alignItems: 'flex-start' },
  spectatorScoreRight: { alignItems: 'flex-end' },
  spectatorPlayerName: { color: Colors.textPrimary, fontSize: Typography.base, fontWeight: Typography.bold },
  spectatorScore: { color: Colors.textPrimary, fontSize: Typography['2xl'], fontWeight: Typography.black },
  spectatorRole: { color: Colors.textMuted, fontSize: Typography.xs },
  spectatorVs: { fontSize: Typography.xl, paddingHorizontal: Spacing.md },
  switchMatchBtn: {
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.xl,
    padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.sm,
  },
  switchMatchText: { color: Colors.primary, fontSize: Typography.sm, fontWeight: Typography.bold },

  // Innings Break Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    alignItems: 'center', justifyContent: 'center', padding: Spacing.xl,
  },
  modalCard: {
    width: '100%', borderRadius: BorderRadius['2xl'], overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  modalGrad: { padding: Spacing.xl, alignItems: 'center', gap: Spacing.lg },
  modalTitle: { color: Colors.accentGold, fontSize: Typography.lg, fontWeight: Typography.black, letterSpacing: 3 },
  inningsResult: { alignItems: 'center' },
  inningsResultTeam: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: 2 },
  inningsResultScore: { color: Colors.textPrimary, fontSize: Typography['4xl'], fontWeight: Typography.black, letterSpacing: -2 },
  targetBadgeModal: {
    backgroundColor: 'rgba(108,99,255,0.15)', borderWidth: 1, borderColor: Colors.primary,
    borderRadius: BorderRadius.xl, padding: Spacing.lg, alignItems: 'center', width: '100%',
  },
  targetBadgeLabel: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2 },
  targetBadgeScore: { color: Colors.primary, fontSize: Typography['4xl'], fontWeight: Typography.black },
  startInningsBtnWrapper: {
    width: '100%', borderRadius: BorderRadius.xl, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  startInningsBtn: { paddingVertical: Spacing.md, alignItems: 'center' },
  startInningsBtnText: { color: '#fff', fontSize: Typography.md, fontWeight: Typography.bold },
  waitingHostBox: {
    backgroundColor: Colors.backgroundGlass, borderRadius: BorderRadius.lg,
    padding: Spacing.md, width: '100%', alignItems: 'center',
  },
  waitingHostText: { color: Colors.textSecondary, fontSize: Typography.sm, textAlign: 'center' },
});
