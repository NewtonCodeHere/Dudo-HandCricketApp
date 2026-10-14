import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';

const DIFFICULTY_OPTIONS = [
  {
    id: 'easy',
    label: '😌 Easy',
    desc: 'Bot picks randomly. Great for beginners.',
    color: Colors.accentGreen,
  },
  {
    id: 'medium',
    label: '😤 Medium',
    desc: 'Bot sometimes remembers your patterns.',
    color: Colors.accentGold,
  },
  {
    id: 'hard',
    label: '😈 Hard',
    desc: 'Bot tracks your frequency and adapts.',
    color: Colors.danger,
  },
];

export default function OfflineSetupScreen({ navigation }) {
  const [difficulty, setDifficulty] = useState('medium');
  const [playerBatsFirst, setPlayerBatsFirst] = useState(true);

  const startGame = () => {
    navigation.navigate('OfflineGame', { difficulty, playerBatsFirst });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <LinearGradient colors={['#0A0A1A', '#12122A']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>OFFLINE MODE</Text>
          <Text style={styles.pageSubtitle}>Configure your game</Text>
        </View>

        {/* Bot emoji */}
        <View style={styles.botSection}>
          <LinearGradient colors={['#1A1A35', '#12122A']} style={styles.botCard}>
            <Text style={styles.botEmoji}>🤖</Text>
            <Text style={styles.botLabel}>vs BOT</Text>
          </LinearGradient>
        </View>

        {/* Bat / Bowl first */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHO BATS FIRST?</Text>
          <View style={styles.toggleRow}>
            <ToggleButton
              label="🏏 I Bat First"
              active={playerBatsFirst}
              onPress={() => setPlayerBatsFirst(true)}
            />
            <ToggleButton
              label="⚾ Bot Bats First"
              active={!playerBatsFirst}
              onPress={() => setPlayerBatsFirst(false)}
            />
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DIFFICULTY</Text>
          {DIFFICULTY_OPTIONS.map((d) => (
            <DifficultyCard
              key={d.id}
              {...d}
              selected={difficulty === d.id}
              onPress={() => setDifficulty(d.id)}
            />
          ))}
        </View>

        {/* Start */}
        <TouchableOpacity onPress={startGame} activeOpacity={0.85} style={styles.startBtnWrapper}>
          <LinearGradient colors={['#6C63FF', '#4C45CC']} style={styles.startBtn}>
            <Text style={styles.startBtnText}>🏏  START GAME</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function ToggleButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.toggleBtn, active && styles.toggleBtnActive]}
      activeOpacity={0.7}
    >
      <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function DifficultyCard({ label, desc, color, selected, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.diffCard, selected && { borderColor: color }]}
      activeOpacity={0.7}
    >
      <View style={[styles.diffIndicator, { backgroundColor: color }]} />
      <View style={styles.diffContent}>
        <Text style={[styles.diffLabel, selected && { color }]}>{label}</Text>
        <Text style={styles.diffDesc}>{desc}</Text>
      </View>
      {selected && (
        <View style={[styles.diffCheck, { backgroundColor: color }]}>
          <Text style={styles.diffCheckText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing['3xl'] },

  header: {
    paddingTop: 56,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  backBtn: { marginBottom: Spacing.lg },
  backText: { color: Colors.primary, fontSize: Typography.lg, fontWeight: Typography.semibold },
  pageTitle: {
    color: Colors.textPrimary,
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
    letterSpacing: 3,
  },
  pageSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    marginTop: Spacing.xs,
  },

  botSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  botCard: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  botEmoji: { fontSize: 50 },
  botLabel: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 2,
    marginTop: 4,
  },

  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },

  toggleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundCard,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderColor: Colors.primary,
  },
  toggleBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  toggleBtnTextActive: {
    color: Colors.primary,
  },

  diffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  diffIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  diffContent: { flex: 1 },
  diffLabel: {
    color: Colors.textPrimary,
    fontSize: Typography.md,
    fontWeight: Typography.bold,
  },
  diffDesc: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  diffCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffCheckText: { color: '#fff', fontWeight: Typography.bold, fontSize: Typography.base },

  startBtnWrapper: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  startBtn: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  startBtnText: {
    color: Colors.textPrimary,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    letterSpacing: 1,
  },
});
