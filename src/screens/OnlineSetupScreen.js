import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius, Gradients } from '../theme/tokens';
import { useColors } from '../theme/ThemeContext';

export default function OnlineSetupScreen({ navigation }) {
  const Colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backText, { color: Colors.primary }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>ONLINE ARENA</Text>
          <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>
            Real-time Multiplayer Duels
          </Text>
        </View>

        {/* Mode cards */}
        <View style={styles.modes}>
          <ModeCard
            emoji="🏟️"
            title="CREATE LOBBY"
            desc="Host a new room, share the code, and customize match settings."
            gradient={Gradients.primary}
            onPress={() => navigation.navigate('CreateGame')}
            Colors={Colors}
          />
          <ModeCard
            emoji="🔗"
            title="JOIN WITH CODE"
            desc="Enter a 6-letter lobby code to battle your friends."
            gradient={['#00B8D4', '#0052D4']}
            onPress={() => navigation.navigate('JoinGame')}
            Colors={Colors}
          />
        </View>

        {/* Feature list */}
        <View style={styles.featureSection}>
          <Text style={[styles.featureTitle, { color: Colors.textMuted }]}>HOW IT WORKS</Text>
          {[
            { icon: '⚡', text: 'Simultaneous 1v1 duels between team members' },
            { icon: '📊', text: 'Every run scored builds towards your team target' },
            { icon: '🔒', text: 'Secret ball submission prevents peeking' },
            { icon: '👁️', text: 'Switch to spectator mode seamlessly when out' },
            { icon: '🔄', text: 'Auto reconnection with state recovery' },
          ].map((f, i) => (
            <View
              key={i}
              style={[
                styles.featureItem,
                {
                  backgroundColor: Colors.backgroundCard,
                  borderColor: Colors.border,
                  shadowColor: Colors.shadow,
                },
              ]}
            >
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={[styles.featureText, { color: Colors.textSecondary }]}>{f.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function ModeCard({ emoji, title, desc, gradient, onPress, Colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.modeCardWrapper, { shadowColor: Colors.shadow }]}
    >
      <LinearGradient
        colors={gradient}
        style={styles.modeCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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
  container: { flex: 1 },
  scroll: { paddingBottom: Spacing['4xl'] },
  header: { paddingTop: 56, paddingHorizontal: Spacing.xl, marginBottom: Spacing['2xl'] },
  backBtn: { marginBottom: Spacing.sm },
  backText: { fontSize: Typography.lg, fontWeight: Typography.semibold },
  title: { fontSize: Typography['3xl'], fontWeight: Typography.black, letterSpacing: 2 },
  subtitle: { fontSize: Typography.sm, marginTop: 2 },
  modes: { paddingHorizontal: Spacing.xl, gap: Spacing.md, marginBottom: Spacing['2xl'] },
  modeCardWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 6,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  modeEmoji: { fontSize: 34 },
  modeContent: { flex: 1 },
  modeTitle: { color: '#FFFFFF', fontSize: Typography.md, fontWeight: Typography.bold, letterSpacing: 0.5 },
  modeDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: Typography.xs,
    marginTop: 4,
    lineHeight: 16,
  },
  modeArrow: { color: 'rgba(255,255,255,0.7)', fontSize: Typography['2xl'] },
  featureSection: { paddingHorizontal: Spacing.xl },
  featureTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  featureIcon: { fontSize: 20 },
  featureText: { fontSize: Typography.sm, flex: 1, lineHeight: 18 },
});
