import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Gradients } from '../theme/tokens';
import { useColors } from '../theme/ThemeContext';
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
} from '../game/offlineEngine';
import { FINGER_NUMBERS } from '../game/gameRules';

const RESULT_DISPLAY_MS = 1800;

export default function OfflineGameScreen({ route, navigation }) {
  const Colors = useColors();
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

  const playerBatting = checkIsPlayerBatting(gameState);

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
          const readyState = readyForNextBall(newState);
          setGameState(readyState);
          setShowCountdown(true);
          setInputEnabled(false);
        }
      }, RESULT_DISPLAY_MS);

      setGameState(newState);

      if (newState.lastBall && !newState.lastBall.isOut && newState.lastBall.runs >= 4) {
        setCelebrationRuns(newState.lastBall.runs);
      }
    },
    [inputEnabled, gameState],
  );

  const handleInningsBreakContinue = () => {
    setShowInningsBreak(false);
    const s2 = startSecondInnings(gameState);
    setGameState(s2);
    setSelectedNumber(null);
    setShowResult(false);
    setInputEnabled(false);
    setShowCountdown(true);
  };

  const handlePlayAgain = () => {
    const fresh = createOfflineGame({ difficulty, playerBatsFirst });
    setGameState(fresh);
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
  const phaseLabel =
    phase === GAME_PHASE.CHASING || gameState.currentInnings === 2
      ? `2nd Innings · ${playerBatting ? 'You chase' : 'Bot chases'}`
      : `1st Innings · ${playerBatting ? 'You bat' : 'Bot bats'}`;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      {/* Celebration overlay */}
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
            <Text style={[styles.homeBtnText, { color: Colors.primary }]}>‹ Home</Text>
          </TouchableOpacity>
          <View
            style={[
              styles.diffBadge,
              { backgroundColor: Colors.backgroundCard, borderColor: Colors.borderLight },
            ]}
          >
            <Text style={[styles.diffBadgeText, { color: Colors.textMuted }]}>
              {difficulty.toUpperCase()} AI
            </Text>
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
            <View
              style={[
                styles.waitingIndicator,
                { backgroundColor: Colors.backgroundCard, borderColor: Colors.borderLight },
              ]}
            >
              <Text style={[styles.waitingText, { color: Colors.textSecondary }]}>
                🤖 Bot thinking...
              </Text>
            </View>
          ) : inputEnabled ? (
            <View
              style={[
                styles.roleIndicator,
                {
                  backgroundColor: Colors.primaryTint,
                  borderColor: Colors.borderGlow,
                },
              ]}
            >
              <Text style={[styles.roleText, { color: Colors.textPrimary }]}>
                {playerBatting ? '🏏 You are BATTING' : '⚾ You are BOWLING'}
              </Text>
              <Text style={[styles.actionHint, { color: Colors.textSecondary }]}>
                {playerBatting
                  ? 'Pick a number to score runs!'
                  : 'Match their number to get them OUT!'}
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

        {/* Game Over Card */}
        {isGameOver && (
          <GameOverCard
            winner={gameState.winner}
            winMessage={gameState.winMessage}
            playerScore={gameState.playerScore}
            botScore={gameState.botScore}
            onPlayAgain={handlePlayAgain}
            onHome={handleGoHome}
            Colors={Colors}
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
        Colors={Colors}
      />
    </View>
  );
}

function GameOverCard({
  winner,
  winMessage,
  playerScore,
  botScore,
  onPlayAgain,
  onHome,
  Colors,
}) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const isPlayerWin = winner === 'player';
  const borderColor = isPlayerWin ? Colors.success : Colors.danger;

  return (
    <Animated.View
      style={[
        styles.gameOverCard,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          borderColor,
          backgroundColor: Colors.backgroundCard,
          shadowColor: Colors.shadow,
        },
      ]}
    >
      <View style={styles.gameOverContent}>
        <Text style={styles.gameOverEmoji}>
          {isPlayerWin ? '🏆' : winner === 'tie' ? '🤝' : '💀'}
        </Text>
        <Text style={[styles.gameOverTitle, { color: isPlayerWin ? Colors.success : Colors.danger }]}>
          {winMessage}
        </Text>
        <View style={styles.finalScores}>
          <ScoreRow label="YOU" score={playerScore} highlight={isPlayerWin} Colors={Colors} />
          <ScoreRow
            label="BOT"
            score={botScore}
            highlight={!isPlayerWin && winner !== 'tie'}
            Colors={Colors}
          />
        </View>
        <TouchableOpacity
          onPress={onPlayAgain}
          style={[styles.playAgainBtn, { shadowColor: Colors.shadow }]}
          activeOpacity={0.85}
        >
          <LinearGradient colors={Gradients.primary} style={styles.playAgainGrad}>
            <Text style={styles.playAgainText}>🔄  PLAY AGAIN</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={onHome} style={styles.homeLink}>
          <Text style={[styles.homeLinkText, { color: Colors.textMuted }]}>← Back to Home</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

function ScoreRow({ label, score, highlight, Colors }) {
  return (
    <View style={styles.scoreRow}>
      <Text style={[styles.scoreRowLabel, { color: Colors.textSecondary }]}>{label}</Text>
      <Text
        style={[
          styles.scoreRowValue,
          { color: highlight ? Colors.success : Colors.textPrimary },
        ]}
      >
        {score}
      </Text>
    </View>
  );
}

function InningsBreakModal({
  visible,
  playerBatsFirst,
  firstInningsScore,
  target,
  onContinue,
  Colors,
}) {
  const isPlayerChasing = !playerBatsFirst;
  const chaserLabel = isPlayerChasing ? 'YOU' : 'BOT';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: Colors.backgroundCard,
              borderColor: Colors.borderLight,
              shadowColor: Colors.shadow,
            },
          ]}
        >
          <Text style={[styles.modalTitle, { color: Colors.primary }]}>⚡ INNINGS BREAK</Text>
          <Text style={[styles.modalScore, { color: Colors.textPrimary }]}>
            {firstInningsScore} RUNS
          </Text>
          <Text style={[styles.modalDesc, { color: Colors.textSecondary }]}>
            {playerBatsFirst ? 'You scored' : 'Bot scored'} {firstInningsScore} runs.
          </Text>
          <View
            style={[
              styles.targetBadge,
              {
                backgroundColor: Colors.primaryTint,
                borderColor: Colors.primary,
              },
            ]}
          >
            <Text style={[styles.targetBadgeLabel, { color: Colors.textMuted }]}>
              TARGET FOR {chaserLabel}
            </Text>
            <Text style={[styles.targetBadgeScore, { color: Colors.primary }]}>{target}</Text>
          </View>
          <TouchableOpacity
            onPress={onContinue}
            style={[styles.continueBtn, { shadowColor: Colors.shadow }]}
            activeOpacity={0.85}
          >
            <LinearGradient colors={Gradients.primary} style={styles.continueGrad}>
              <Text style={styles.continueBtnText}>🏏  START 2ND INNINGS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  homeBtnText: { fontSize: Typography.lg, fontWeight: Typography.semibold },
  diffBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  diffBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 1,
  },

  historyWrapper: { marginTop: Spacing.sm },

  statusArea: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    marginVertical: Spacing.md,
  },
  waitingIndicator: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  waitingText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  roleIndicator: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
  },
  roleText: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    marginBottom: 2,
  },
  actionHint: {
    fontSize: Typography.xs,
  },

  fingerGrid: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  fingerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },

  gameOverCard: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 6,
  },
  gameOverContent: {
    alignItems: 'center',
    padding: Spacing['2xl'],
  },
  gameOverEmoji: { fontSize: 50, marginBottom: Spacing.sm },
  gameOverTitle: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.black,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: Spacing.lg,
  },
  finalScores: {
    flexDirection: 'row',
    gap: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  scoreRow: { alignItems: 'center' },
  scoreRowLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 1,
  },
  scoreRowValue: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
  },
  playAgainBtn: {
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: Spacing.md,
  },
  playAgainGrad: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  playAgainText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    letterSpacing: 1,
  },
  homeLink: { paddingVertical: Spacing.sm },
  homeLinkText: { fontSize: Typography.sm, fontWeight: '600' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.black,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  modalScore: {
    fontSize: Typography['4xl'],
    fontWeight: Typography.black,
    marginBottom: Spacing.xs,
  },
  modalDesc: {
    fontSize: Typography.sm,
    marginBottom: Spacing.lg,
  },
  targetBadge: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    marginBottom: Spacing.xl,
  },
  targetBadgeLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 1.5,
  },
  targetBadgeScore: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
  },
  continueBtn: {
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  continueGrad: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    letterSpacing: 1,
  },
});
