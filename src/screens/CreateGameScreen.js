import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useLobby } from '../networking/hooks';
import { SOCKET_EVENTS } from '../networking/config';
import * as SocketClient from '../networking/socket';

const PLAYER_OPTIONS = [2, 4, 6, 8, 10, 12];
const TEAM_OPTIONS = [2, 3, 4];

export default function CreateGameScreen({ navigation }) {
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [teamCount, setTeamCount] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { createGame, subscribe } = useLobby();

  const playersPerTeam = maxPlayers / teamCount;
  const isValidCombo = Number.isInteger(playersPerTeam) && playersPerTeam >= 1;

  useEffect(() => {
    SocketClient.connect();
    const unsubCreated = subscribe(SOCKET_EVENTS.GAME_CREATED, ({ game, player }) => {
      setLoading(false);
      navigation.replace('Lobby', { game, player, isHost: true });
    });
    const unsubError = subscribe(SOCKET_EVENTS.ERROR, ({ message }) => {
      setLoading(false);
      setError(message);
    });
    return () => { unsubCreated(); unsubError(); };
  }, []);

  const handleCreate = () => {
    if (!playerName.trim()) { setError('Enter your name'); return; }
    if (!isValidCombo) { setError('Invalid player/team combo'); return; }
    setError('');
    setLoading(true);
    createGame(playerName.trim(), maxPlayers, teamCount);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A1A', '#12122A']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>HOST GAME</Text>
          <Text style={styles.subtitle}>Create a new lobby</Text>
        </View>

        {/* Name input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>YOUR NAME</Text>
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

        {/* Players */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TOTAL PLAYERS</Text>
          <View style={styles.optionRow}>
            {PLAYER_OPTIONS.map((n) => (
              <OptionChip key={n} label={n} selected={maxPlayers === n} onPress={() => setMaxPlayers(n)} />
            ))}
          </View>
        </View>

        {/* Teams */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NUMBER OF TEAMS</Text>
          <View style={styles.optionRow}>
            {TEAM_OPTIONS.map((n) => (
              <OptionChip key={n} label={n} selected={teamCount === n} onPress={() => setTeamCount(n)} />
            ))}
          </View>
        </View>

        {/* Preview */}
        <View style={styles.previewCard}>
          <Text style={styles.previewTitle}>GAME SETUP PREVIEW</Text>
          {isValidCombo ? (
            <View style={styles.previewGrid}>
              {Array.from({ length: teamCount }).map((_, ti) => {
                const teamNames = ['A', 'B', 'C', 'D'];
                const teamColors = [Colors.teamA, Colors.teamB, Colors.accentGreen, Colors.accentGold];
                return (
                  <View key={ti} style={[styles.previewTeam, { borderColor: teamColors[ti] + '55' }]}>
                    <Text style={[styles.previewTeamName, { color: teamColors[ti] }]}>TEAM {teamNames[ti]}</Text>
                    {Array.from({ length: playersPerTeam }).map((_, pi) => (
                      <View key={pi} style={styles.previewPlayer}>
                        <Text style={styles.previewPlayerText}>👤 Player {pi + 1}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.invalidCombo}>
              <Text style={styles.invalidText}>⚠️ {maxPlayers} players cannot be divided evenly into {teamCount} teams</Text>
            </View>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading || !isValidCombo}
          activeOpacity={0.85}
          style={[styles.createBtnWrapper, (!isValidCombo || loading) && { opacity: 0.5 }]}
        >
          <LinearGradient colors={['#6C63FF', '#4C45CC']} style={styles.createBtn}>
            <Text style={styles.createBtnText}>{loading ? '⏳ Creating...' : '🏟️  CREATE LOBBY'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function OptionChip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing['4xl'] },
  header: { paddingTop: 56, paddingHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
  backBtn: { marginBottom: Spacing.lg },
  backText: { color: Colors.primary, fontSize: Typography.lg, fontWeight: Typography.semibold },
  title: { color: Colors.textPrimary, fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: 3 },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.base, marginTop: Spacing.xs },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  sectionTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.md },
  input: {
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    color: Colors.textPrimary, fontSize: Typography.md,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundCard,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  chipSelected: { backgroundColor: 'rgba(108,99,255,0.25)', borderColor: Colors.primary },
  chipText: { color: Colors.textSecondary, fontSize: Typography.md, fontWeight: Typography.bold },
  chipTextSelected: { color: Colors.primary },
  previewCard: {
    marginHorizontal: Spacing.xl, backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl,
  },
  previewTitle: { color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.md },
  previewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  previewTeam: {
    flex: 1, minWidth: 100, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1, gap: Spacing.xs,
  },
  previewTeamName: { fontSize: Typography.sm, fontWeight: Typography.bold, letterSpacing: 1, marginBottom: 4 },
  previewPlayer: { backgroundColor: Colors.backgroundGlass, borderRadius: BorderRadius.sm, padding: Spacing.xs },
  previewPlayerText: { color: Colors.textSecondary, fontSize: Typography.xs },
  invalidCombo: { backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: BorderRadius.md, padding: Spacing.md },
  invalidText: { color: Colors.danger, fontSize: Typography.sm, textAlign: 'center' },
  errorText: { color: Colors.danger, fontSize: Typography.sm, textAlign: 'center', marginBottom: Spacing.md },
  createBtnWrapper: {
    marginHorizontal: Spacing.xl, borderRadius: BorderRadius.xl, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  createBtn: { paddingVertical: Spacing.lg, alignItems: 'center' },
  createBtnText: { color: '#fff', fontSize: Typography.lg, fontWeight: Typography.bold, letterSpacing: 1 },
});
