import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  TextInput, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Gradients } from '../theme/tokens';
import { useColors } from '../theme/ThemeContext';
import { useLobby } from '../networking/hooks';
import { SOCKET_EVENTS } from '../networking/config';
import * as SocketClient from '../networking/socket';

export default function JoinGameScreen({ navigation }) {
  const Colors = useColors();
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
  }, [navigation, subscribe]);

  const handleJoin = () => {
    if (!playerName.trim()) { setError('Enter your name'); shake(); return; }
    const code = gameCode.trim().toUpperCase();
    if (code.length < 6) { setError('Enter a valid 6-character room code'); shake(); return; }
    setError('');
    setLoading(true);
    joinGame(code, playerName.trim());
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: Colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>JOIN LOBBY</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>Enter the match code</Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustration}>
          <View
            style={[
              styles.illustrationCircle,
              { backgroundColor: Colors.primaryTint, borderColor: Colors.borderGlow },
            ]}
          >
            <Text style={styles.illustrationEmoji}>🔗</Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: Colors.textMuted }]}>YOUR NICKNAME</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors.backgroundCard,
                  color: Colors.textPrimary,
                  borderColor: Colors.border,
                },
              ]}
              placeholder="Enter your name..."
              placeholderTextColor={Colors.inputPlaceholder}
              value={playerName}
              onChangeText={setPlayerName}
              maxLength={16}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: Colors.textMuted }]}>6-DIGIT ROOM CODE</Text>
            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TextInput
                style={[
                  styles.input,
                  styles.codeInput,
                  {
                    backgroundColor: Colors.backgroundCard,
                    color: Colors.primary,
                    borderColor: error && gameCode.length < 6 ? '#EF4444' : Colors.border,
                  },
                ]}
                placeholder="HC7K92"
                placeholderTextColor={Colors.inputPlaceholder}
                value={gameCode}
                onChangeText={(t) => setGameCode(t.toUpperCase())}
                maxLength={8}
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </Animated.View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleJoin}
            disabled={loading}
            activeOpacity={0.85}
            style={[styles.joinBtnWrapper, { shadowColor: Colors.shadow }, loading && { opacity: 0.6 }]}
          >
            <LinearGradient colors={Gradients.primary} style={styles.joinBtn}>
              <Text style={styles.joinBtnText}>{loading ? '⏳ Joining...' : 'ENTER MATCH ›'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between' },
  header: { paddingTop: 40, marginBottom: Spacing.md },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: Typography.lg, fontWeight: Typography.semibold },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: 2 },
  subtitle: { fontSize: Typography.sm, marginTop: 2 },
  illustration: { alignItems: 'center', marginVertical: Spacing.md },
  illustrationCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  illustrationEmoji: { fontSize: 40 },
  form: { flex: 1, justifyContent: 'center' },
  inputGroup: { marginBottom: Spacing.lg },
  label: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.sm },
  input: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    borderWidth: 1.5,
  },
  codeInput: {
    fontSize: Typography['2xl'],
    fontWeight: Typography.black,
    letterSpacing: 6,
    textAlign: 'center',
  },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: Spacing.md, fontSize: Typography.sm },
  joinBtnWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginTop: Spacing.md,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  joinBtn: { paddingVertical: Spacing.lg, alignItems: 'center' },
  joinBtnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold, letterSpacing: 1.5 },
});
