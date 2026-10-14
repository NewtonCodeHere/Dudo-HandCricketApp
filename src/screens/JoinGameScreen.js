import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  TextInput, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useLobby } from '../networking/hooks';
import { SOCKET_EVENTS } from '../networking/config';
import * as SocketClient from '../networking/socket';

export default function JoinGameScreen({ navigation }) {
  const [playerName, setPlayerName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { joinGame, subscribe } = useLobby();

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    SocketClient.connect();
    const unsubJoined = subscribe(SOCKET_EVENTS.GAME_JOINED, ({ game, player }) => {
      setLoading(false);
      navigation.replace('Lobby', { game, player, isHost: false });
    });
    const unsubError = subscribe(SOCKET_EVENTS.ERROR, ({ message }) => {
      setLoading(false);
      setError(message);
      shake();
    });
    return () => { unsubJoined(); unsubError(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = () => {
    if (!playerName.trim()) { setError('Enter your name'); shake(); return; }
    const code = gameCode.trim().toUpperCase();
    if (code.length < 6) { setError('Enter a valid 6-character game code'); shake(); return; }
    setError('');
    setLoading(true);
    joinGame(code, playerName.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A1A', '#12122A']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>JOIN GAME</Text>
          <Text style={styles.subtitle}>Enter the lobby code</Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustration}>
          <LinearGradient colors={['#FF6B6B33', '#FF6B6B11']} style={styles.illustrationCircle}>
            <Text style={styles.illustrationEmoji}>🔗</Text>
          </LinearGradient>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>YOUR NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name..."
              placeholderTextColor={Colors.textMuted}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={16}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>GAME CODE</Text>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                style={[styles.input, styles.codeInput, error && gameCode.length < 6 && styles.inputError]}
                placeholder="e.g. HC7K92"
                placeholderTextColor={Colors.textMuted}
                value={gameCode}
                onChangeText={(t) => setGameCode(t.toUpperCase())}
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </Animated.View>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleJoin}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.joinBtnWrapper, loading && { opacity: 0.6 }]}
          >
            <LinearGradient colors={['#FF6B6B', '#CC3333']} style={styles.joinBtn}>
              <Text style={styles.joinBtnText}>{loading ? '⏳ Joining...' : '🔗  JOIN LOBBY'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Tip */}
        <View style={styles.tip}>
          <Text style={styles.tipText}>💡 Ask your host for the 6-character game code</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingTop: 52 },
  header: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  backBtn: { marginBottom: Spacing.lg },
  backText: { color: Colors.danger, fontSize: Typography.lg, fontWeight: Typography.semibold },
  title: { color: Colors.textPrimary, fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: 3 },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.base, marginTop: Spacing.xs },
  illustration: { alignItems: 'center', marginBottom: Spacing['2xl'] },
  illustrationCircle: {
    width: 110, height: 110, borderRadius: 55,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.danger + '44',
  },
  illustrationEmoji: { fontSize: 52 },
  form: { paddingHorizontal: Spacing.xl, gap: Spacing.lg },
  inputGroup: {},
  label: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.sm },
  input: {
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    color: Colors.textPrimary, fontSize: Typography.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  codeInput: {
    fontSize: Typography['2xl'], fontWeight: Typography.black,
    letterSpacing: 8, textAlign: 'center', paddingVertical: Spacing.lg,
    color: Colors.danger,
  },
  inputError: { borderColor: Colors.danger },
  errorBox: {
    backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.danger + '44',
  },
  errorText: { color: Colors.danger, fontSize: Typography.sm, textAlign: 'center' },
  joinBtnWrapper: {
    borderRadius: BorderRadius.xl, overflow: 'hidden',
    shadowColor: Colors.danger, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12, marginTop: Spacing.sm,
  },
  joinBtn: { paddingVertical: Spacing.lg, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontSize: Typography.lg, fontWeight: Typography.bold, letterSpacing: 1 },
  tip: { alignItems: 'center', padding: Spacing.xl },
  tipText: { color: Colors.textMuted, fontSize: Typography.sm, textAlign: 'center' },
});
