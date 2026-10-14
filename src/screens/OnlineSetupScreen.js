import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius } from '../theme/tokens';


export default function OnlineSetupScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0A0A1A', '#12122A']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>ONLINE MODE</Text>
          <Text style={styles.subtitle}>Real-time multiplayer</Text>
        </View>

        {/* Mode cards */}
        <View style={styles.modes}>
          <ModeCard
            emoji="🏟️"
            title="HOST GAME"
            desc="Create a new lobby, invite friends and control game settings."
            gradient={['#6C63FF', '#4C45CC']}
            onPress={() => navigation.navigate('CreateGame')}
          />
          <ModeCard
            emoji="🔗"
            title="JOIN GAME"
            desc="Enter a 6-character game code to join a friend's lobby."
            gradient={['#FF6B6B', '#CC3333']}
            onPress={() => navigation.navigate('JoinGame')}
          />
        </View>

        {/* Feature list */}
        <View style={styles.featureSection}>
          <Text style={styles.featureTitle}>HOW IT WORKS</Text>
          {[
            { icon: '⚡', text: 'Multiple 1v1 matches run simultaneously' },
            { icon: '📊', text: 'Each player\'s score builds the team total' },
            { icon: '🔒', text: 'Choices are hidden until both submit' },
            { icon: '👁️', text: 'Spectate other matches when you\'re out' },
            { icon: '🔄', text: 'Automatic reconnect if you disconnect' },
          ].map((f, i) => (
            <View key={i} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ModeCard({ emoji, title, desc, gradient, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.modeCardWrapper}>
      <LinearGradient colors={gradient} style={styles.modeCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <Text style={styles.modeEmoji}>{emoji}</Text>
        <View style={styles.modeContent}>
          <Text style={styles.modeTitle}>{title}</Text>
          <Text style={styles.modeDesc}>{desc}</Text>
        </View>
        <Text style={styles.modeArrow}>›</Text>
      </LinearGradient>
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
  modes: { paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing['2xl'] },
  modeCardWrapper: {
    borderRadius: BorderRadius.xl, overflow: 'hidden',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  modeCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.xl, gap: Spacing.lg,
  },
  modeEmoji: { fontSize: 36 },
  modeContent: { flex: 1 },
  modeTitle: { color: '#fff', fontSize: Typography.lg, fontWeight: Typography.bold },
  modeDesc: { color: 'rgba(255,255,255,0.7)', fontSize: Typography.sm, marginTop: 4, lineHeight: 18 },
  modeArrow: { color: 'rgba(255,255,255,0.6)', fontSize: Typography['2xl'] },
  featureSection: { paddingHorizontal: Spacing.xl },
  featureTitle: {
    color: Colors.textMuted, fontSize: Typography.xs, fontWeight: Typography.bold,
    letterSpacing: 2, marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.backgroundCard, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  featureIcon: { fontSize: 20 },
  featureText: { color: Colors.textSecondary, fontSize: Typography.sm, flex: 1 },
});
