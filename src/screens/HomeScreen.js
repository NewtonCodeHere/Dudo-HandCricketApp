import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

function AnimatedParticle({ delay, x, size, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 4000 + Math.random() * 3000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [height + 20, -20] });
  const opacity = anim.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.5, 0.3, 0] });

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: x, width: size, height: size, backgroundColor: color, opacity, transform: [{ translateY }] },
      ]}
    />
  );
}

export default function HomeScreen({ navigation }) {
  const Colors = useColors();
  const { isDark } = useTheme();
  const titleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ballAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(100),
      Animated.parallel([
        Animated.spring(titleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ballAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(ballAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const titleTranslateY = titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] });
  const ballScale = ballAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  const particles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: (width / 12) * i + Math.random() * 30,
      delay: i * 500,
      size: 4 + Math.random() * 4,
    })), []);

  const bgColors = isDark
    ? ['#0A0A1A', '#12122A', '#0D0D20']
    : ['#F4F4FF', '#EEEEFF', '#F0F0FF'];

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />

      {particles.map((p) => (
        <AnimatedParticle key={p.id} x={p.x} delay={p.delay} size={p.size} color={Colors.primary} />
      ))}

      {/* Header glow */}
      <View style={[styles.headerGlow, { backgroundColor: Colors.primary }]} />

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: titleTranslateY }] }]}
      >
        {/* Cricket ball */}
        <Animated.View style={[styles.ballContainer, { transform: [{ scale: ballScale }] }]}>
          <LinearGradient colors={['#FF6B6B', '#CC3333']} style={styles.ball}>
            <Text style={styles.ballEmoji}>🏏</Text>
          </LinearGradient>
        </Animated.View>

        <Text style={[styles.title, { color: Colors.textPrimary }]}>HAND</Text>
        <Text style={[styles.titleAccent, { color: Colors.primary, textShadowColor: Colors.primary }]}>CRICKET</Text>
        <Text style={[styles.subtitle, { color: Colors.textMuted }]}>The Ultimate Finger Game</Text>

        <View style={styles.menu}>
          <MenuButton
            label="⚡  OFFLINE"
            sublabel="vs Bot"
            onPress={() => navigation.navigate('OfflineSetup')}
            gradient={['#6C63FF', '#4C45CC']}
          />
          <MenuButton
            label="🌐  ONLINE"
            sublabel="Multiplayer"
            onPress={() => navigation.navigate('OnlineSetup')}
            gradient={['#FF6B6B', '#CC3333']}
          />
          <View style={styles.rowButtons}>
            <SmallMenuButton
              label="📖  HOW TO PLAY"
              onPress={() => navigation.navigate('HowToPlay')}
              Colors={Colors}
            />
            <SmallMenuButton
              label="⚙️  SETTINGS"
              onPress={() => navigation.navigate('Settings')}
              Colors={Colors}
            />
          </View>
        </View>

        <Text style={[styles.footer, { color: Colors.textMuted }]}>v1.0 · Made with ✌️</Text>
      </Animated.View>
    </View>
  );
}

function MenuButton({ label, sublabel, onPress, gradient }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View style={[styles.menuBtnWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut} activeOpacity={1} style={styles.menuBtn}>
        <LinearGradient colors={gradient} style={styles.menuBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.menuBtnContent}>
            <Text style={styles.menuBtnLabel}>{label}</Text>
            <Text style={styles.menuBtnSublabel}>{sublabel}</Text>
          </View>
          <Text style={styles.menuBtnArrow}>›</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function SmallMenuButton({ label, onPress, Colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.smallBtn, { backgroundColor: Colors.backgroundCard, borderColor: Colors.border }]}
      activeOpacity={0.7}
    >
      <Text style={[styles.smallBtnText, { color: Colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  particle: { position: 'absolute', borderRadius: 999 },
  headerGlow: {
    position: 'absolute', top: -120, left: width / 2 - 150,
    width: 300, height: 300, borderRadius: 150, opacity: 0.08,
  },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  ballContainer: {
    marginBottom: Spacing.xl,
    shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  ball: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  ballEmoji: { fontSize: 44 },
  title: { fontSize: Typography['4xl'], fontWeight: Typography.black, letterSpacing: 8, lineHeight: Typography['4xl'] * 1.1 },
  titleAccent: {
    fontSize: Typography['4xl'], fontWeight: Typography.black, letterSpacing: 8,
    lineHeight: Typography['4xl'] * 1.1,
    textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  subtitle: { fontSize: Typography.base, fontWeight: '500', letterSpacing: 1, marginTop: Spacing.sm, marginBottom: Spacing['2xl'] },
  menu: { width: '100%', gap: Spacing.md },
  menuBtnWrapper: {
    width: '100%', shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  menuBtn: { width: '100%', borderRadius: BorderRadius.xl, overflow: 'hidden' },
  menuBtnGradient: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
  menuBtnContent: { flex: 1 },
  menuBtnLabel: { color: '#FFFFFF', fontSize: Typography.lg, fontWeight: '700', letterSpacing: 0.5 },
  menuBtnSublabel: { color: 'rgba(255,255,255,0.65)', fontSize: Typography.sm, fontWeight: '500', marginTop: 2 },
  menuBtnArrow: { color: 'rgba(255,255,255,0.6)', fontSize: Typography['2xl'] },
  rowButtons: { flexDirection: 'row', gap: Spacing.md },
  smallBtn: { flex: 1, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md, alignItems: 'center', borderWidth: 1 },
  smallBtnText: { fontSize: Typography.sm, fontWeight: '600' },
  footer: { fontSize: Typography.xs, marginTop: Spacing['2xl'] },
});
