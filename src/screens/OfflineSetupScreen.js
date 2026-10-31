import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Gradients } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';

export default function OfflineSetupScreen({ navigation }) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const [difficulty, setDifficulty] = useState('medium');
  const [playerBatsFirst, setPlayerBatsFirst] = useState(true);

  const difficultyOptions = [
    {
      id: 'easy',
      label: '😌 Casual Bot',
      desc: 'Picks randomly. Great for a quick warmup.',
      color: Colors.accentGreen,
    },
    {
      id: 'medium',
      label: '😤 Strategic Bot',
      desc: 'Analyzes tendencies and counters frequent choices.',
      color: Colors.primary,
    },
    {
      id: 'hard',
      label: '😈 Master Bot',
      desc: 'Predictive neural-style frequency tracking. Hard to beat.',
      color: Colors.danger,
    },
  ];

  const startGame = () => {
    navigation.navigate('OfflineGame', { difficulty, playerBatsFirst });
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: Colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: Colors.textPrimary }]}>OFFLINE DUEL</Text>
          <Text style={[styles.pageSubtitle, { color: Colors.textSecondary }]}>Match Configuration</Text>
        </View>

        {/* Bot Avatar Section */}
        <View style={styles.botSection}>
          <View
            style={[
              styles.botCard,
              {
                backgroundColor: Colors.backgroundCard,
                borderColor: isDark ? 'rgba(30,128,255,0.25)' : Colors.border,
                shadowColor: Colors.shadow,
              },
            ]}
          >
            <Text style={styles.botEmoji}>🤖</Text>
            <Text style={[styles.botLabel, { color: Colors.primary }]}>AI OPPONENT</Text>
          </View>
        </View>

        {/* Bat / Bowl first */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>INNINGS TOSS</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              onPress={() => setPlayerBatsFirst(true)}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: playerBatsFirst ? Colors.primary + '20' : Colors.backgroundCard,
                  borderColor: playerBatsFirst ? Colors.primary : Colors.border,
                  shadowColor: Colors.shadow,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleBtnText, { color: playerBatsFirst ? Colors.primary : Colors.textSecondary }]}>
                🏏 I Bat First
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPlayerBatsFirst(false)}
              style={[
                styles.toggleBtn,
                {
                  backgroundColor: !playerBatsFirst ? Colors.primary + '20' : Colors.backgroundCard,
                  borderColor: !playerBatsFirst ? Colors.primary : Colors.border,
                  shadowColor: Colors.shadow,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.toggleBtnText, { color: !playerBatsFirst ? Colors.primary : Colors.textSecondary }]}>
                ⚾ Bot Bats First
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Difficulty */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>DIFFICULTY LEVEL</Text>
          {difficultyOptions.map((d) => {
            const isSelected = difficulty === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                onPress={() => setDifficulty(d.id)}
                style={[
                  styles.diffCard,
                  {
                    backgroundColor: Colors.backgroundCard,
                    borderColor: isSelected ? d.color : Colors.border,
                    borderWidth: isSelected ? 2 : 1,
                    shadowColor: Colors.shadow,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.diffIndicator, { backgroundColor: d.color }]} />
                <View style={styles.diffContent}>
                  <Text style={[styles.diffLabel, { color: isSelected ? d.color : Colors.textPrimary }]}>
                    {d.label}
                  </Text>
                  <Text style={[styles.diffDesc, { color: Colors.textSecondary }]}>{d.desc}</Text>
                </View>
                {isSelected && (
                  <View style={[styles.diffCheck, { backgroundColor: d.color }]}>
                    <Text style={styles.diffCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Start Button */}
        <TouchableOpacity onPress={startGame} activeOpacity={0.85} style={[styles.startBtnWrapper, { shadowColor: Colors.shadow }]}>
          <LinearGradient colors={Gradients.primary} style={styles.startBtn}>
            <Text style={styles.startBtnText}>START MATCH ›</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: Spacing['3xl'] },
  header: {
    paddingTop: 56,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: Typography.lg, fontWeight: Typography.semibold },
  pageTitle: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
    letterSpacing: 2,
  },
  pageSubtitle: {
    fontSize: Typography.sm,
    marginTop: 2,
  },
  botSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  botCard: {
    width: 110,
    height: 110,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  botEmoji: { fontSize: 44 },
  botLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 1.5,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
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
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  diffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  diffIndicator: {
    width: 4,
    height: 38,
    borderRadius: 2,
  },
  diffContent: { flex: 1 },
  diffLabel: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  diffDesc: {
    fontSize: Typography.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  diffCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffCheckText: { color: '#FFFFFF', fontWeight: Typography.bold, fontSize: Typography.xs },
  startBtnWrapper: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  startBtn: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.base,
    fontWeight: Typography.bold,
    letterSpacing: 1.5,
  },
});
