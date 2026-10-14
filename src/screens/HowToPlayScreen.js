import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';

const steps = [
  {
    emoji: '✌️',
    title: 'Pick a number',
    desc: 'Both you and your opponent secretly pick a number from 1 to 10 using finger emojis.',
  },
  {
    emoji: '🤩',
    title: 'Score runs',
    desc: 'If the numbers are DIFFERENT, the batsman scores that many runs. Simple!',
  },
  {
    emoji: '💀',
    title: 'Get OUT',
    desc: 'If both numbers MATCH, the batsman is OUT. Innings over!',
  },
  {
    emoji: '🎯',
    title: 'Chase the target',
    desc: 'After the first innings, the other team chases the target score.',
  },
  {
    emoji: '🏆',
    title: 'Win the game',
    desc: 'First team to exceed the target wins! If the chasing team gets out first, they lose.',
  },
];

const onlineRules = [
  '🏟️ Multiple 1v1 matches run simultaneously between team players',
  '📊 Each player\'s score counts towards their team total',
  '👁️ When you\'re out, watch other ongoing matches as a spectator',
  '🔒 Both players\' choices are hidden until both have submitted',
  '⚡ Real-time score updates across all active matches',
];

export default function HowToPlayScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A1A', '#12122A']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>HOW TO PLAY</Text>
          <Text style={styles.subtitle}>Hand Cricket rules</Text>
        </View>

        {/* Basic rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BASICS</Text>
          {steps.map((s, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={styles.stepEmojiBox}>
                <Text style={styles.stepEmoji}>{s.emoji}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Finger guide */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FINGER GUIDE</Text>
          <View style={styles.fingerGuide}>
            {[
              ['☝️', '1'], ['✌️', '2'], ['🤟', '3'],
              ['🖖', '4'], ['🖐️', '5'], ['🤙', '6'],
              ['🤞', '7'], ['🤙', '8'], ['🤚', '9'], ['🙌', '10'],
            ].map(([emoji, num]) => (
              <View key={num} style={styles.fingerItem}>
                <Text style={styles.fingerEmoji}>{emoji}</Text>
                <Text style={styles.fingerNum}>{num}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Online rules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ONLINE MODE</Text>
          {onlineRules.map((rule, i) => (
            <View key={i} style={styles.ruleItem}>
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.doneBtn} activeOpacity={0.8}>
          <LinearGradient colors={['#6C63FF', '#4C45CC']} style={styles.doneBtnGrad}>
            <Text style={styles.doneBtnText}>{"Got it! Let's Play 🏏"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing['4xl'] },
  header: {
    paddingTop: 56,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  backBtn: { marginBottom: Spacing.lg },
  backText: { color: Colors.primary, fontSize: Typography.lg, fontWeight: Typography.semibold },
  title: { color: Colors.textPrimary, fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: 3 },
  subtitle: { color: Colors.textSecondary, fontSize: Typography.base, marginTop: Spacing.xs },

  section: { paddingHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },

  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  stepEmojiBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(108,99,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepEmoji: { fontSize: 26 },
  stepContent: { flex: 1 },
  stepTitle: { color: Colors.textPrimary, fontSize: Typography.md, fontWeight: Typography.bold, marginBottom: 4 },
  stepDesc: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: 20 },

  fingerGuide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  fingerItem: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    minWidth: 60,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fingerEmoji: { fontSize: 26 },
  fingerNum: { color: Colors.textSecondary, fontSize: Typography.sm, fontWeight: Typography.bold, marginTop: 2 },

  ruleItem: {
    backgroundColor: Colors.backgroundCard,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ruleText: { color: Colors.textSecondary, fontSize: Typography.sm, lineHeight: 20 },

  doneBtn: {
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  doneBtnGrad: { paddingVertical: Spacing.lg, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontSize: Typography.md, fontWeight: Typography.bold },
});
