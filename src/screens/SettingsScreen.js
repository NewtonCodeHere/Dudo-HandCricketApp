import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar, Switch, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const Colors = useColors();
  const { isDark, toggleTheme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} />
      <LinearGradient
        colors={isDark ? ['#0A0A1A', '#12122A'] : ['#F4F4FF', '#EEEEFF']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: Colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>SETTINGS</Text>
        <View style={{ width: 60 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance */}
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>APPEARANCE</Text>

        <View style={[styles.card, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
          {/* Theme toggle row */}
          <View style={[styles.row, { borderBottomColor: Colors.border }]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>{isDark ? '🌙' : '☀️'}</Text>
              <View>
                <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.rowSub, { color: Colors.textMuted }]}>
                  {isDark ? 'Tap to switch to light theme' : 'Tap to switch to dark theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E0E0F0', true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Theme preview */}
          <View style={styles.previewRow}>
            <TouchableOpacity
              onPress={() => !isDark && toggleTheme()}
              style={[
                styles.themeChip,
                {
                  backgroundColor: isDark ? Colors.primary + '22' : Colors.backgroundGlass,
                  borderColor: isDark ? Colors.primary : Colors.border,
                  borderWidth: isDark ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.themeChipIcon}>🌙</Text>
              <Text style={[styles.themeChipLabel, { color: isDark ? Colors.primary : Colors.textMuted }]}>Dark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => isDark && toggleTheme()}
              style={[
                styles.themeChip,
                {
                  backgroundColor: !isDark ? Colors.primary + '22' : Colors.backgroundGlass,
                  borderColor: !isDark ? Colors.primary : Colors.border,
                  borderWidth: !isDark ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.themeChipIcon}>☀️</Text>
              <Text style={[styles.themeChipLabel, { color: !isDark ? Colors.primary : Colors.textMuted }]}>Light</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>ABOUT</Text>
        <View style={[styles.card, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutIcon}>🏏</Text>
            <View>
              <Text style={[styles.aboutTitle, { color: Colors.textPrimary }]}>Hand Cricket</Text>
              <Text style={[styles.aboutSub, { color: Colors.textMuted }]}>Version 1.0.0</Text>
            </View>
          </View>
          <Text style={[styles.aboutDesc, { color: Colors.textSecondary }]}>
            The classic finger game, reimagined for mobile. Play offline against the bot or challenge friends online in real-time multiplayer matches.
          </Text>
        </View>

        {/* Game rules summary */}
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>QUICK RULES</Text>
        <View style={[styles.card, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}>
          {[
            ['☝️ 1–5', 'Score that many runs'],
            ['6–10', 'Score that many runs (celebrations!)'],
            ['🤜 MATCH', 'Same number = batsman is OUT!'],
            ['🏏 Target', '2nd innings: chase the total to win'],
          ].map(([key, val], i, arr) => (
            <View
              key={key}
              style={[
                styles.ruleRow,
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border },
              ]}
            >
              <Text style={[styles.ruleKey, { color: Colors.primary }]}>{key}</Text>
              <Text style={[styles.ruleVal, { color: Colors.textSecondary }]}>{val}</Text>
            </View>
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
  },
  backBtn: { width: 60 },
  backText: { fontSize: Typography.base, fontWeight: '600' },
  headerTitle: { fontSize: Typography.lg, fontWeight: '900', letterSpacing: 3 },
  scroll: { padding: Spacing.xl, paddingBottom: 60 },
  sectionTitle: {
    fontSize: Typography.xs, fontWeight: '700', letterSpacing: 2,
    marginTop: Spacing['2xl'], marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.xl, borderWidth: 1, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg, borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  rowIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  rowLabel: { fontSize: Typography.base, fontWeight: '600' },
  rowSub: { fontSize: Typography.xs, marginTop: 2 },
  previewRow: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md },
  themeChip: {
    flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.md,
    alignItems: 'center', gap: 6,
  },
  themeChipIcon: { fontSize: 28 },
  themeChipLabel: { fontSize: Typography.sm, fontWeight: '700', letterSpacing: 1 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.lg, paddingBottom: Spacing.md },
  aboutIcon: { fontSize: 40 },
  aboutTitle: { fontSize: Typography.lg, fontWeight: '700' },
  aboutSub: { fontSize: Typography.sm, marginTop: 2 },
  aboutDesc: { fontSize: Typography.sm, lineHeight: 20, padding: Spacing.lg, paddingTop: 0 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  ruleKey: { fontSize: Typography.sm, fontWeight: '700', width: 80 },
  ruleVal: { fontSize: Typography.sm, flex: 1 },
});
