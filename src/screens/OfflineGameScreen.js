import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
  Dimensions,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';
import FingerButton from '../components/FingerButton';
import ScoreBoard from '../components/ScoreBoard';
import BallResult from '../components/BallResult';
import BallHistory from '../components/BallHistory';
import Countdown from '../components/Countdown';
import CelebrationOverlay from '../components/CelebrationOverlay';
import {
  createOfflineGame,
  processBall,
  startSecondInnings,
  readyForNextBall,
  isPlayerBatting as checkIsPlayerBatting,
  GAME_PHASE,
  BALL_STATE,
} from '../game/offlineEngine';
import { FINGER_NUMBERS } from '../game/gameRules';

const { width } = Dimensions.get('window');

const RESULT_DISPLAY_MS = 1800;

export default function OfflineGameScreen({ route, navigation }) {
  const { difficulty = 'medium', playerBatsFirst = true } = route.params || {};

  const [gameState, setGameState] = useState(() =>
    createOfflineGame({ difficulty, playerBatsFirst }),
  );
  const [selectedNumber, setSelectedNumber] = useState(null);
  const [showCountdown, setShowCountdown] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [inputEnabled, setInputEnabled] = useState(false);
  const [showInningsBreak, setShowInningsBreak] = useState(false);
  const [celebrationRuns, setCelebrationRuns] = useState(null);

  const resultTimer = useRef(null);
  const countdownComplete = useRef(false);

  const playerBatting = checkIsPlayerBatting(gameState);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (resultTimer.current) clearTimeout(resultTimer.current);
    };
  }, []);

  const onCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setInputEnabled(true);
  }, []);

  const handleNumberSelect = useCallback(
    (n) => {
      if (!inputEnabled) return;
      if (gameState.phase === GAME_PHASE.GAME_OVER) return;

      setSelectedNumber(n);
      setInputEnabled(false);

      // Process the ball
      const newState = processBall(gameState, n);
      setShowResult(true);

      if (resultTimer.current) clearTimeout(resultTimer.current);

      resultTimer.current = setTimeout(() => {
        setShowResult(false);
        setSelectedNumber(null);

        if (newState.phase === GAME_PHASE.INNINGS_BREAK) {
          setGameState(newState);
          setShowInningsBreak(true);
        } else if (newState.phase === GAME_PHASE.GAME_OVER) {
          setGameState(newState);
        } else {
          // Ready for next ball
          const readyState = readyForNextBall(newState);
          setGameState(readyState);
          // Restart countdown
          setShowCountdown(true);
          setInputEnabled(false);
        }
      }, RESULT_DISPLAY_MS);

      setGameState(newState);

      // 🎉 Big hit celebration (6–10 runs) when player is batting
      const lastBall = newState.ballHistory?.[newState.ballHistory.length - 1];
      if (lastBall && !lastBall.isOut && lastBall.runs >= 6 && playerBatting) {
        setCelebrationRuns(lastBall.runs);
      }
    },
    [inputEnabled, gameState, playerBatting],
  );

  const handleInningsBreakContinue = () => {
    setShowInningsBreak(false);
    const nextState = startSecondInnings(gameState);
    setGameState(nextState);
    setShowCountdown(true);
    setInputEnabled(false);
  };

  const handlePlayAgain = () => {
    setGameState(createOfflineGame({ difficulty, playerBatsFirst }));
    setSelectedNumber(null);
    setShowResult(false);
    setInputEnabled(false);
    setShowCountdown(true);
  };

  const handleGoHome = () => {
    navigation.navigate('Home');
  };

  const phase = gameState.phase;
  const isGameOver = phase === GAME_PHASE.GAME_OVER;
  const isChasing = phase === GAME_PHASE.CHASING || gameState.currentInnings === 2;
  const phaseLabel =
    phase === GAME_PHASE.CHASING || gameState.currentInnings === 2
      ? `2nd Innings · ${playerBatting ? 'You chase' : 'Bot chases'}`
      : `1st Innings · ${playerBatting ? 'You bat' : 'Bot bats'}`;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A1A', '#12122A', '#0A0A1A']} style={StyleSheet.absoluteFill} />

      {/* 🎉 Celebration overlay — unique per run value */}
      <CelebrationOverlay
        runs={celebrationRuns}
        visible={celebrationRuns !== null}
        onComplete={() => setCelebrationRuns(null)}
      />

      {/* Countdown overlay */}
      {showCountdown && !isGameOver && (
        <Countdown visible={showCountdown} onComplete={onCountdownComplete} />
      )}

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!showCountdown}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleGoHome} style={styles.homeBtn}>
            <Text style={styles.homeBtnText}>‹ Home</Text>
          </TouchableOpacity>
          <View style={styles.diffBadge}>
            <Text style={styles.diffBadgeText}>{difficulty.toUpperCase()}</Text>
          </View>
        </View>

        {/* Scoreboard */}
        <ScoreBoard
          playerLabel="YOU"
          botLabel="BOT"
          playerScore={gameState.playerScore}
          botScore={gameState.botScore}
          target={gameState.target}
          isPlayerBatting={playerBatting}
          phase={phaseLabel}
        />

        {/* Ball history */}
        <View style={styles.historyWrapper}>
          <BallHistory history={gameState.ballHistory} />
        </View>

        {/* Status area */}
        <View style={styles.statusArea}>
          {showResult && gameState.lastBall ? (
            <BallResult ball={gameState.lastBall} visible={showResult} />
          ) : !inputEnabled && !showCountdown && !isGameOver ? (
            <View style={styles.waitingIndicator}>
              <Text style={styles.waitingText}>🤖 Bot thinking...</Text>
            </View>
          ) : inputEnabled ? (
            <View style={styles.roleIndicator}>
              <Text style={styles.roleText}>
                {playerBatting ? '🏏 You are BATTING' : '⚾ You are BOWLING'}
              </Text>
              <Text style={styles.actionHint}>
                {playerBatting ? 'Pick a number to score runs!' : 'Match their number to get them OUT!'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Finger input grid */}
        {!isGameOver && (
          <View style={styles.fingerGrid}>
            <View style={styles.fingerRow}>
              {FINGER_NUMBERS.slice(0, 5).map((n) => (
                <FingerButton
                  key={n}
                  number={n}
                  onPress={handleNumberSelect}
                  selected={selectedNumber === n}
                  disabled={!inputEnabled}
                />
              ))}
            </View>
            <View style={styles.fingerRow}>
              {FINGER_NUMBERS.slice(5).map((n) => (
                <FingerButton
                  key={n}
                  number={n}
                  onPress={handleNumberSelect}
                  selected={selectedNumber === n}
                  disabled={!inputEnabled}
                />
              ))}
            </View>
          </View>
        )}

        {/* Game Over */}
        {isGameOver && (
          <GameOverCard
            winner={gameState.winner}
            winMessage={gameState.winMessage}
            playerScore={gameState.playerScore}
            botScore={gameState.botScore}
            ballHistory={[
              ...(gameState.playerInnings1 !== undefined
                ? [{ label: '1st Innings Score', score: playerBatsFirst ? gameState.playerInnings1 : gameState.botInnings1 }]
                : []),
            ]}
            onPlayAgain={handlePlayAgain}
            onHome={handleGoHome}
          />
        )}
      </ScrollView>

      {/* Innings break modal */}
      <InningsBreakModal
        visible={showInningsBreak}
        playerBatsFirst={playerBatsFirst}
        firstInningsScore={playerBatsFirst ? gameState.playerInnings1 : gameState.botInnings1}
        target={gameState.target}
        onContinue={handleInningsBreakContinue}
      />
    </View>
  );
}

function GameOverCard({ winner, winMessage, playerScore, botScore, onPlayAgain, onHome }) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const isPlayerWin = winner === 'player';
  const gradient = isPlayerWin ? ['#1A3A1A', '#0A1A0A'] : ['#3A1A1A', '#1A0A0A'];
  const borderColor = isPlayerWin ? Colors.accentGreen : Colors.danger;

  return (
    <Animated.View style={[styles.gameOverCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }], borderColor }]}>
      <LinearGradient colors={gradient} style={styles.gameOverGradient}>
        <Text style={styles.gameOverEmoji}>{isPlayerWin ? '🏆' : winner === 'tie' ? '🤝' : '💀'}</Text>
        <Text style={[styles.gameOverTitle, { color: isPlayerWin ? Colors.accentGreen : Colors.danger }]}>
          {winMessage}
        </Text>
        <View style={styles.finalScores}>
          <ScoreRow label="YOU" score={playerScore} highlight={isPlayerWin} />
          <ScoreRow label="BOT" score={botScore} highlight={!isPlayerWin && winner !== 'tie'} />
        </View>
        <TouchableOpacity onPress={onPlayAgain} style={styles.playAgainBtn} activeOpacity={0.8}>
          <LinearGradient colors={['#6C63FF', '#4C45CC']} style={styles.playAgainGrad}>
            <Text style={styles.playAgainText}>🔄  PLAY AGAIN</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onHome} style={styles.homeLink}>
          <Text style={styles.homeLinkText}>← Back to Home</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

function ScoreRow({ label, score, highlight }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={styles.scoreRowLabel}>{label}</Text>
      <Text style={[styles.scoreRowValue, highlight && styles.scoreRowHighlight]}>{score}</Text>
    </View>
  );
}

function InningsBreakModal({ visible, playerBatsFirst, firstInningsScore, target, onContinue }) {
  const isPlayerChasing = !playerBatsFirst;
  const chaserLabel = isPlayerChasing ? 'YOU' : 'BOT';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <LinearGradient colors={['#1A1A35', '#12122A']} style={styles.modalGrad}>
            <Text style={styles.modalTitle}>⚡ INNINGS BREAK</Text>
            <Text style={styles.modalScore}>{firstInningsScore} RUNS</Text>
            <Text style={styles.modalDesc}>
              {playerBatsFirst ? 'You scored' : 'Bot scored'} {firstInningsScore} runs.
            </Text>
            <View style={styles.targetBadge}>
              <Text style={styles.targetBadgeLabel}>TARGET FOR {chaserLabel}</Text>
              <Text style={styles.targetBadgeScore}>{target}</Text>
            </View>
            <TouchableOpacity onPress={onContinue} style={styles.continueBtn} activeOpacity={0.85}>
              <LinearGradient colors={['#6C63FF', '#4C45CC']} style={styles.continueGrad}>
                <Text style={styles.continueBtnText}>🏏  START 2ND INNINGS</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing['3xl'] },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  homeBtn: {},
  homeBtnText: { color: Colors.primary, fontSize: Typography.lg, fontWeight: Typography.semibold },
  diffBadge: {
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  diffBadgeText: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1 },

  historyWrapper: { marginVertical: Spacing.md },

  statusArea: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
  },

  waitingIndicator: {
    backgroundColor: Colors.backgroundCard,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  waitingText: { color: Colors.textSecondary, fontSize: Typography.base, fontWeight: Typography.semibold },

  roleIndicator: { alignItems: 'center' },
  roleText: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
    marginBottom: Spacing.xs,
  },
  actionHint: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    textAlign: 'center',
  },

  fingerGrid: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fingerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  // Game Over
  gameOverCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 2,
  },
  gameOverGradient: { padding: Spacing.xl, alignItems: 'center' },
  gameOverEmoji: { fontSize: 60, marginBottom: Spacing.md },
  gameOverTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.black,
    letterSpacing: 1,
    marginBottom: Spacing.xl,
  },
  finalScores: {
    width: '100%',
    marginBottom: Spacing.xl,
    backgroundColor: Colors.backgroundGlass,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreRowLabel: { color: Colors.textSecondary, fontSize: Typography.md, fontWeight: Typography.bold },
  scoreRowValue: { color: Colors.textPrimary, fontSize: Typography['2xl'], fontWeight: Typography.black },
  scoreRowHighlight: { color: Colors.accentGreen },
  playAgainBtn: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  playAgainGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
  playAgainText: { color: '#fff', fontSize: Typography.md, fontWeight: Typography.bold },
  homeLink: { padding: Spacing.md },
  homeLinkText: { color: Colors.textMuted, fontSize: Typography.sm },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  modalGrad: { padding: Spacing.xl, alignItems: 'center' },
  modalTitle: {
    color: Colors.accentGold,
    fontSize: Typography.lg,
    fontWeight: Typography.black,
    letterSpacing: 3,
    marginBottom: Spacing.md,
  },
  modalScore: {
    color: Colors.textPrimary,
    fontSize: Typography['4xl'],
    fontWeight: Typography.black,
    letterSpacing: -2,
    marginBottom: Spacing.sm,
  },
  modalDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  targetBadge: {
    backgroundColor: 'rgba(108,99,255,0.15)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    width: '100%',
    marginBottom: Spacing.xl,
  },
  targetBadgeLabel: { color: Colors.textSecondary, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2 },
  targetBadgeScore: { color: Colors.primary, fontSize: Typography['4xl'], fontWeight: Typography.black },
  continueBtn: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  continueGrad: { paddingVertical: Spacing.md, alignItems: 'center' },
  continueBtnText: { color: '#fff', fontSize: Typography.md, fontWeight: Typography.bold },
});
