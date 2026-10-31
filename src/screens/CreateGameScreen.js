import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Gradients } from '../theme/tokens';
import { useColors } from '../theme/ThemeContext';
import { useLobby } from '../networking/hooks';
import { SOCKET_EVENTS } from '../networking/config';
import * as SocketClient from '../networking/socket';

const PLAYER_OPTIONS = [2, 4, 6, 8, 10, 12];
const TEAM_OPTIONS = [2, 3, 4];

export default function CreateGameScreen({ navigation }) {
  const Colors = useColors();
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
  }, [navigation, subscribe]);

  const handleCreate = () => {
    if (!playerName.trim()) { setError('Please enter your name'); return; }
    if (!isValidCombo) { setError('Invalid player/team division'); return; }
    setError('');
    setLoading(true);
    createGame(playerName.trim(), maxPlayers, teamCount);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: Colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>HOST GAME</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>Create a new lobby</Text>
        </View>

        {/* Name input */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>YOUR NICKNAME</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: Colors.backgroundCard,
                color: Colors.textPrimary,
                borderColor: Colors.border,
              },
            ]}
            placeholder="Enter player name..."
            placeholderTextColor={Colors.inputPlaceholder}
            value={playerName}
            onChangeText={setPlayerName}
            maxLength={16}
            autoCapitalize="words"
          />
        </View>

        {/* Players */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>TOTAL PLAYERS</Text>
          <View style={styles.optionRow}>
            {PLAYER_OPTIONS.map((n) => (
              <OptionChip
                key={n}
                label={n}
                selected={maxPlayers === n}
                onPress={() => setMaxPlayers(n)}
                Colors={Colors}
              />
            ))}
          </View>
        </View>

        {/* Teams */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>NUMBER OF TEAMS</Text>
          <View style={styles.optionRow}>
            {TEAM_OPTIONS.map((n) => (
              <OptionChip
                key={n}
                label={n}
                selected={teamCount === n}
                onPress={() => setTeamCount(n)}
                Colors={Colors}
              />
            ))}
          </View>
        </View>

        {/* Preview */}
        <View
          style={[
            styles.previewCard,
            {
              backgroundColor: Colors.backgroundCard,
              borderColor: Colors.border,
              shadowColor: Colors.shadow,
            },
          ]}
        >
          <Text style={[styles.previewTitle, { color: Colors.textMuted }]}>LOBBY PREVIEW</Text>
          {isValidCombo ? (
            <View style={styles.previewGrid}>
              {Array.from({ length: teamCount }).map((_, ti) => {
                const teamNames = ['A', 'B', 'C', 'D'];
                const teamColors = [Colors.teamA, Colors.teamB, Colors.accentGreen, Colors.accentGold];
                return (
                  <View key={ti} style={[styles.previewTeam, { borderColor: teamColors[ti] + '40', backgroundColor: teamColors[ti] + '10' }]}>
                    <Text style={[styles.previewTeamName, { color: teamColors[ti] }]}>TEAM {teamNames[ti]}</Text>
                    {Array.from({ length: playersPerTeam }).map((_, pi) => (
                      <View key={pi} style={styles.previewPlayer}>
                        <Text style={[styles.previewPlayerText, { color: Colors.textSecondary }]}>👤 Slot {pi + 1}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.invalidCombo}>
              <Text style={styles.invalidText}>⚠️ {maxPlayers} players cannot divide evenly into {teamCount} teams</Text>
            </View>
          )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          onPress={handleCreate}
          disabled={loading || !isValidCombo}
          activeOpacity={0.85}
          style={[styles.createBtnWrapper, { shadowColor: Colors.shadow }, (!isValidCombo || loading) && { opacity: 0.5 }]}
        >
          <LinearGradient colors={Gradients.primary} style={styles.createBtn}>
            <Text style={styles.createBtnText}>{loading ? '⏳ Creating...' : 'CREATE LOBBY ›'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function OptionChip({ label, selected, onPress, Colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? Colors.primaryTint : Colors.backgroundCard,
          borderColor: selected ? Colors.primary : Colors.border,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, { color: selected ? Colors.primary : Colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: Spacing['4xl'] },
  header: { paddingTop: 56, paddingHorizontal: Spacing.xl, marginBottom: Spacing.xl },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: Typography.lg, fontWeight: Typography.semibold },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: 2 },
  subtitle: { fontSize: Typography.sm, marginTop: 2 },
  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.sm },
  input: {
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.base,
    borderWidth: 1.5,
  },
  optionRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    minWidth: 48,
    alignItems: 'center',
  },
  chipText: { fontSize: Typography.sm, fontWeight: Typography.bold },
  previewCard: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    marginBottom: Spacing.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  previewTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2, marginBottom: Spacing.md },
  previewGrid: { flexDirection: 'row', gap: Spacing.md },
  previewTeam: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
  },
  previewTeamName: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 1, marginBottom: Spacing.sm },
  previewPlayer: { paddingVertical: 2 },
  previewPlayerText: { fontSize: Typography.xs },
  invalidCombo: { padding: Spacing.md, alignItems: 'center' },
  invalidText: { color: '#EF4444', fontSize: Typography.xs, textAlign: 'center' },
  errorText: { color: '#EF4444', textAlign: 'center', marginBottom: Spacing.md, fontSize: Typography.sm },
  createBtnWrapper: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  createBtn: { paddingVertical: Spacing.lg, alignItems: 'center' },
  createBtnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold, letterSpacing: 1.5 },
});
