import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Gradients } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';

const steps = [
  {
    emoji: '✌️',
    title: 'Pick a number',
    desc: 'Both you and your opponent secretly choose a number from 1 to 10.',
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
    desc: 'After the first innings, the other team chases the target score to win.',
  },
  {
    emoji: '🏆',
    title: 'Win the duel',
    desc: 'First team or player to exceed the target wins! If all wickets fall first, bowling side wins.',
  },
];

const onlineRules = [
  '🏟️ Simultaneous 1v1 duels run between opposing team members',
  '📊 Every ball and run directly accumulates into your team total',
  '👁️ Spectator mode unlocks instantly upon getting OUT',
  '🔒 Both players submit blindly before the server reveals the ball',
  '⚡ Low-latency live socket updates across every table',
];

export default function HowToPlayScreen({ navigation }) {
  const Colors = useColors();
  const { isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: Colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>HOW TO PLAY</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>Rules & Strategy</Text>
        </View>

        {/* Basic rules */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>THE BASICS</Text>
          {steps.map((s, i) => (
            <View key={i} style={[styles.stepCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, shadowColor: Colors.shadow }]}>
              <View style={[styles.stepEmojiBox, { backgroundColor: isDark ? 'rgba(30,128,255,0.1)' : 'rgba(13,110,253,0.08)' }]}>
                <Text style={styles.stepEmoji}>{s.emoji}</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={[styles.stepTitle, { color: Colors.textPrimary }]}>{s.title}</Text>
                <Text style={[styles.stepDesc, { color: Colors.textSecondary }]}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Finger guide */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>NUMBER BUTTONS</Text>
          <View style={[styles.fingerGuide, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border, shadowColor: Colors.shadow }]}>
            {[
              ['☝️', '1'], ['✌️', '2'], ['🤟', '3'],
              ['🖖', '4'], ['🖐️', '5'], ['🤙', '6'],
              ['🤞', '7'], ['🎱', '8'], ['🤚', '9'], ['🙌', '10'],
            ].map(([emoji, num]) => (
              <View key={num} style={[styles.fingerItem, { borderColor: Colors.borderLight }]}>
                <Text style={styles.fingerEmoji}>{emoji}</Text>
                <Text style={[styles.fingerNum, { color: Colors.textPrimary }]}>{num}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Online rules */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>ONLINE MULTIPLAYER</Text>
          {onlineRules.map((rule, i) => (
            <View key={i} style={[styles.ruleItem, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
              <Text style={[styles.ruleText, { color: Colors.textSecondary }]}>{rule}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.doneBtn} activeOpacity={0.85}>
          <LinearGradient colors={Gradients.primary} style={styles.doneBtnGrad}>
            <Text style={styles.doneBtnText}>{"GOT IT, LET'S PLAY"}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.xl, paddingTop: 52, paddingBottom: 60 },
  header: { marginBottom: Spacing.xl },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: Typography.lg, fontWeight: '600' },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: 2 },
  subtitle: { fontSize: Typography.sm, marginTop: 2 },
  section: { marginBottom: Spacing['2xl'] },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  stepCard: {
    flexDirection: 'row',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  stepEmojiBox: {
    width: 46,
    height: 46,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  stepEmoji: { fontSize: 24 },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: Typography.base, fontWeight: Typography.bold, marginBottom: 2 },
  stepDesc: { fontSize: Typography.sm, lineHeight: 18 },
  fingerGuide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    gap: Spacing.sm,
    justifyContent: 'space-between',
  },
  fingerItem: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 0.5,
  },
  fingerEmoji: { fontSize: 22, marginBottom: 2 },
  fingerNum: { fontSize: Typography.xs, fontWeight: Typography.bold },
  ruleItem: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
  },
  ruleText: { fontSize: Typography.sm, lineHeight: 18 },
  doneBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginTop: Spacing.md },
  doneBtnGrad: { paddingVertical: Spacing.lg, alignItems: 'center' },
  doneBtnText: { color: '#FFFFFF', fontSize: Typography.base, fontWeight: Typography.bold, letterSpacing: 1 },
});
