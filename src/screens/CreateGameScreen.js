import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Gradients } from '../theme/tokens';
import { useColors } from '../theme/ThemeContext';
import { useAudio } from '../context/AudioContext';
import FloatingBubbles from '../components/FloatingBubbles';
import { useLobby } from '../networking/hooks';
import { SOCKET_EVENTS } from '../networking/config';
import * as SocketClient from '../networking/socket';

const PLAYER_OPTIONS = [2, 4, 6, 8, 10, 12];
const TEAM_OPTIONS = [2, 3, 4];

const OVERS_MODES = {
  SUPER_OVER: 'SUPER_OVER',
  UNLIMITED: 'UNLIMITED',
  CUSTOM: 'CUSTOM',
};

export default function CreateGameScreen({ navigation }) {
  const Colors = useColors();
  const { playBubblePop } = useAudio();
  const [playerName, setPlayerName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [teamCount, setTeamCount] = useState(2);
  const [oversMode, setOversMode] = useState(OVERS_MODES.SUPER_OVER);
  const [customOvers, setCustomOvers] = useState(2);
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
    playBubblePop();
    if (!playerName.trim()) { setError('Please enter your name'); return; }
    if (!isValidCombo) { setError('Invalid player/team division'); return; }
    setError('');
    setLoading(true);

    const effectiveOvers =
      oversMode === OVERS_MODES.SUPER_OVER
        ? 1
        : oversMode === OVERS_MODES.UNLIMITED
        ? null
        : Math.max(1, Math.min(50, parseInt(customOvers, 10) || 2));

    createGame(playerName.trim(), maxPlayers, teamCount, effectiveOvers);
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />
      <FloatingBubbles count={14} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { playBubblePop(); navigation.goBack(); }} style={styles.backBtn}>
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

        {/* Number of Overs */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>NUMBER OF OVERS</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              onPress={() => {
                playBubblePop();
                setOversMode(OVERS_MODES.SUPER_OVER);
              }}
              style={[
                styles.oversChip,
                {
                  backgroundColor: oversMode === OVERS_MODES.SUPER_OVER ? Colors.primaryTint : Colors.backgroundCard,
                  borderColor: oversMode === OVERS_MODES.SUPER_OVER ? Colors.primary : Colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.oversChipText, { color: oversMode === OVERS_MODES.SUPER_OVER ? Colors.primary : Colors.textSecondary }]}>
                ⚡ Super Over
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                playBubblePop();
                setOversMode(OVERS_MODES.UNLIMITED);
              }}
              style={[
                styles.oversChip,
                {
                  backgroundColor: oversMode === OVERS_MODES.UNLIMITED ? Colors.primaryTint : Colors.backgroundCard,
                  borderColor: oversMode === OVERS_MODES.UNLIMITED ? Colors.primary : Colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.oversChipText, { color: oversMode === OVERS_MODES.UNLIMITED ? Colors.primary : Colors.textSecondary }]}>
                ♾️ Unlimited
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                playBubblePop();
                setOversMode(OVERS_MODES.CUSTOM);
              }}
              style={[
                styles.oversChip,
                {
                  backgroundColor: oversMode === OVERS_MODES.CUSTOM ? Colors.primaryTint : Colors.backgroundCard,
                  borderColor: oversMode === OVERS_MODES.CUSTOM ? Colors.primary : Colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.oversChipText, { color: oversMode === OVERS_MODES.CUSTOM ? Colors.primary : Colors.textSecondary }]}>
                ⚙️ Custom
              </Text>
            </TouchableOpacity>
          </View>

          {/* Custom Overs Stepper & Numeric Editor */}
          {oversMode === OVERS_MODES.CUSTOM && (
            <View style={[styles.customOversCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
              <Text style={[styles.customOversLabel, { color: Colors.textSecondary }]}>Select Custom Overs:</Text>
              <View style={styles.stepperContainer}>
                <TouchableOpacity
                  onPress={() => {
                    playBubblePop();
                    setCustomOvers((prev) => Math.max(1, (parseInt(prev, 10) || 2) - 1));
                  }}
                  style={[styles.stepperBtn, { backgroundColor: Colors.primaryTint, borderColor: Colors.primary }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stepperBtnSymbol, { color: Colors.primary }]}>−</Text>
                </TouchableOpacity>

                <TextInput
                  style={[
                    styles.stepperTextInput,
                    {
                      backgroundColor: Colors.background,
                      color: Colors.textPrimary,
                      borderColor: Colors.borderLight,
                    },
                  ]}
                  keyboardType="number-pad"
                  value={String(customOvers)}
                  onChangeText={(val) => {
                    const clean = val.replace(/[^0-9]/g, '');
                    if (clean === '') {
                      setCustomOvers('');
                    } else {
                      const num = parseInt(clean, 10);
                      setCustomOvers(Math.max(1, Math.min(50, num)));
                    }
                  }}
                  onBlur={() => {
                    if (!customOvers || parseInt(customOvers, 10) < 1) {
                      setCustomOvers(2);
                    }
                  }}
                  maxLength={2}
                  textAlign="center"
                />

                <TouchableOpacity
                  onPress={() => {
                    playBubblePop();
                    setCustomOvers((prev) => Math.min(50, (parseInt(prev, 10) || 1) + 1));
                  }}
                  style={[styles.stepperBtn, { backgroundColor: Colors.primaryTint, borderColor: Colors.primary }]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stepperBtnSymbol, { color: Colors.primary }]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Description helper */}
          <Text style={[styles.oversDesc, { color: Colors.textMuted }]}>
            {oversMode === OVERS_MODES.SUPER_OVER
              ? '⚡ 1 Over (6 balls) per match'
              : oversMode === OVERS_MODES.UNLIMITED
              ? '♾️ Unlimited overs · batsman plays until OUT'
              : `🏏 ${parseInt(customOvers, 10) || 2} Overs · ${(parseInt(customOvers, 10) || 2) * 6} Balls per match`}
          </Text>
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
          <View style={styles.previewHeaderRow}>
            <Text style={[styles.previewTitle, { color: Colors.textMuted }]}>LOBBY PREVIEW</Text>
            <View style={[styles.previewOversTag, { backgroundColor: Colors.primaryTint, borderColor: Colors.borderLight }]}>
              <Text style={[styles.previewOversTagText, { color: Colors.primary }]}>
                {oversMode === OVERS_MODES.SUPER_OVER
                  ? '⚡ 1 Over (6b)'
                  : oversMode === OVERS_MODES.UNLIMITED
                  ? '♾️ Unlimited'
                  : `🏏 ${parseInt(customOvers, 10) || 2} Overs (${(parseInt(customOvers, 10) || 2) * 6}b)`}
              </Text>
            </View>
          </View>
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
  oversChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oversChipText: { fontSize: Typography.xs, fontWeight: Typography.bold },
  customOversCard: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customOversLabel: { fontSize: Typography.sm, fontWeight: Typography.semibold },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  stepperTextInput: {
    width: 54,
    height: 38,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    paddingVertical: 0,
  },
  oversDesc: {
    fontSize: Typography.xs,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewOversTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  previewOversTagText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
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
  previewTitle: { fontSize: Typography.xs, fontWeight: Typography.bold, letterSpacing: 2 },
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
