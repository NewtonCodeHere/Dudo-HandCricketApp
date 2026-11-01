import React, { useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  Dimensions,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors, ThemeToggle } from '../theme/ThemeContext';

const { width, height } = Dimensions.get('window');

function AnimatedParticle({ delay, x, size, color }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 4500 + Math.random() * 3000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [height + 20, -20] });
  const opacity = anim.interpolate({ inputRange: [0, 0.15, 0.85, 1], outputRange: [0, 0.4, 0.2, 0] });

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
  const titleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;

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
        Animated.timing(logoAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(logoAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ]),
    ).start();
  }, [fadeAnim, logoAnim, titleAnim]);

  const titleTranslateY = titleAnim.interpolate({ inputRange: [0, 1], outputRange: [-25, 0] });
  const logoScale = logoAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });

  const particles = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: (width / 14) * i + Math.random() * 20,
      delay: i * 400,
      size: 3 + Math.random() * 4,
    })), []);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      {particles.map((p) => (
        <AnimatedParticle key={p.id} x={p.x} delay={p.delay} size={p.size} color={Colors.primary} />
      ))}

      {/* Top Header Bar with Mode Toggle */}
      <View style={styles.topBar}>
        <View style={[styles.badgeContainer, { backgroundColor: Colors.primaryTint, borderColor: Colors.borderLight }]}>
          <Text style={[styles.badgeText, { color: Colors.primary }]}>DUDO CRICKET</Text>
        </View>
        <ThemeToggle />
      </View>

      {/* Ambient background glow */}
      <View style={[styles.headerGlow, { backgroundColor: Colors.primary }]} />

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: titleTranslateY }] }]}
      >
        {/* DUDO Logo Badge */}
        <Animated.View
          style={[
            styles.logoCard,
            {
              backgroundColor: Colors.backgroundCard,
              borderColor: Colors.borderLight,
              shadowColor: Colors.shadow,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/dudo_logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={[styles.titleBrand, { color: Colors.primary }]}>DUDO</Text>
        <Text style={[styles.title, { color: Colors.textPrimary }]}>HAND CRICKET</Text>
        <Text style={[styles.subtitle, { color: Colors.textSecondary }]}>The Ultimate Finger Clash</Text>

        {/* Menu Buttons styled like modern reference */}
        <View style={styles.menu}>
          <MenuButton
            label="⚡  OFFLINE BATTLE"
            sublabel="Play vs AI (Easy, Medium, Hard)"
            onPress={() => navigation.navigate('OfflineSetup')}
            gradient={Colors.primaryGradient}
            Colors={Colors}
          />
          <MenuButton
            label="🌐  ONLINE MULTIPLAYER"
            sublabel="Real-time 1v1 & Team matches"
            onPress={() => navigation.navigate('OnlineSetup')}
            gradient={[Colors.primaryDark, Colors.primary]}
            Colors={Colors}
          />

          <View style={styles.rowButtons}>
            <SmallMenuButton
              label="📖  Rules"
              onPress={() => navigation.navigate('HowToPlay')}
              Colors={Colors}
            />
            <SmallMenuButton
              label="🎨  Theme & Colors"
              onPress={() => navigation.navigate('Settings')}
              Colors={Colors}
              highlight
            />
          </View>
        </View>

        <Text style={[styles.footer, { color: Colors.textMuted }]}>
          DUDO Hand Cricket · Mobile Edition
        </Text>
      </Animated.View>
    </View>
  );
}

function MenuButton({ label, sublabel, onPress, gradient, Colors }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start();
  const handlePressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View
      style={[
        styles.menuBtnWrapper,
        {
          shadowColor: Colors.shadow,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        style={styles.menuBtn}
      >
        <LinearGradient
          colors={gradient}
          style={styles.menuBtnGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.menuBtnContent}>
            <Text style={styles.menuBtnLabel}>{label}</Text>
            <Text style={styles.menuBtnSublabel}>{sublabel}</Text>
          </View>
          <View style={styles.arrowCircle}>
            <Text style={styles.menuBtnArrow}>›</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

function SmallMenuButton({ label, onPress, Colors, highlight }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.smallBtn,
        {
          backgroundColor: highlight ? Colors.primaryTint : Colors.backgroundCard,
          borderColor: highlight ? Colors.primary : Colors.border,
          shadowColor: Colors.shadow,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.smallBtnText,
          { color: highlight ? Colors.primary : Colors.textPrimary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  particle: { position: 'absolute', borderRadius: 999 },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  badgeContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerGlow: {
    position: 'absolute',
    top: -90,
    left: width / 2 - 130,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.12,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    marginTop: -15,
  },
  logoCard: {
    width: 105,
    height: 105,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: 95,
    height: 95,
  },
  titleBrand: {
    fontSize: Typography.sm,
    fontWeight: Typography.bold,
    letterSpacing: 4,
    marginBottom: 2,
  },
  title: {
    fontSize: Typography['3xl'],
    fontWeight: Typography.black,
    letterSpacing: 2.5,
    lineHeight: Typography['3xl'] * 1.15,
  },
  subtitle: {
    fontSize: Typography.sm,
    fontWeight: '500',
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  menu: { width: '100%', gap: Spacing.md },
  menuBtnWrapper: {
    width: '100%',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  menuBtn: { width: '100%', borderRadius: BorderRadius.full, overflow: 'hidden' },
  menuBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  menuBtnContent: { flex: 1 },
  menuBtnLabel: { color: '#FFFFFF', fontSize: Typography.md, fontWeight: '700', letterSpacing: 0.5 },
  menuBtnSublabel: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.xs, fontWeight: '500', marginTop: 2 },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBtnArrow: { color: '#FFFFFF', fontSize: Typography.xl, fontWeight: 'bold', marginTop: -2 },
  rowButtons: { flexDirection: 'row', gap: Spacing.md },
  smallBtn: {
    flex: 1,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  smallBtnText: { fontSize: Typography.sm, fontWeight: '700' },
  footer: { fontSize: Typography.xs, marginTop: Spacing.xl, letterSpacing: 0.5 },
});
