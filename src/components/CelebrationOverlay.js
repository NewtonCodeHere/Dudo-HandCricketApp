/**
 * CelebrationOverlay — unique particle celebrations for runs 6-10.
 *
 * 6  → 🌸 Flower burst        — pink/magenta petals exploding from centre
 * 7  → ⭐ Star shower         — golden stars raining from top
 * 8  → 🎆 Fireworks           — multicolour explosions from corners
 * 9  → 🌈 Rainbow cascade     — multicoloured arcs streaming across
 * 10 → 🎊 MEGA party          — confetti + flowers + fire combo
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

// ─── Per-score config ─────────────────────────────────────────────────────────

const CONFIGS = {
  6: {
    label: '🌸 SIX!',
    labelColor: '#FF69B4',
    glowColor: '#FF69B4',
    count: 28,
    emojis: ['🌸', '🌺', '🌷', '🌼', '💐'],
    origin: 'center',
    pattern: 'burst',
    duration: 1800,
  },
  7: {
    label: '⭐ SEVEN!',
    labelColor: '#FFD700',
    glowColor: '#FFD700',
    count: 30,
    emojis: ['⭐', '🌟', '💫', '✨', '🌠'],
    origin: 'top',
    pattern: 'rain',
    duration: 2000,
  },
  8: {
    label: '🎆 EIGHT!',
    labelColor: '#FF4500',
    glowColor: '#FF4500',
    count: 36,
    emojis: ['🎆', '🎇', '✨', '💥', '🔥'],
    origin: 'corners',
    pattern: 'explode',
    duration: 2200,
  },
  9: {
    label: '🌈 NINE!',
    labelColor: '#00FA9A',
    glowColor: '#00FA9A',
    count: 32,
    emojis: ['🌈', '✨', '⭐', '🎈', '🎉'],
    origin: 'sides',
    pattern: 'cascade',
    duration: 2200,
  },
  10: {
    label: '🎊 PERFECT 10!',
    labelColor: '#FF1493',
    glowColor: '#FFD700',
    count: 45,
    emojis: ['🎊', '🎉', '🔥', '👑', '💯', '🌸', '⭐', '🚀'],
    origin: 'all',
    pattern: 'mega',
    duration: 2600,
  },
};

// ─── Single Particle ──────────────────────────────────────────────────────────

function Particle({ emoji, startX, startY, angle, speed, duration, delay, size }) {
  const x = useRef(new Animated.Value(startX)).current;
  const y = useRef(new Animated.Value(startY)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const rad = (angle * Math.PI) / 180;
  const endX = startX + Math.cos(rad) * speed;
  const endY = startY + Math.sin(rad) * speed;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 200, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(x, { toValue: endX, duration, useNativeDriver: true }),
        Animated.timing(y, { toValue: endY, duration, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.3, duration, useNativeDriver: true }),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [delay, duration, endX, endY, opacity, rotate, scale, x, y]);

  const rotateDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '720deg'] });

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        fontSize: size,
        transform: [{ translateX: x }, { translateY: y }, { scale }, { rotate: rotateDeg }],
        opacity,
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

// ─── Label pulse animation ────────────────────────────────────────────────────

function CelebrationLabel({ label, color }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
      Animated.delay(1200),
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.2, duration: 300, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();
  }, [opacity, scale]);

  return (
    <Animated.Text
      style={[
        styles.label,
        {
          color,
          textShadowColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      {label}
    </Animated.Text>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CelebrationOverlay({ runs, visible, onComplete }) {
  const config = CONFIGS[runs];

  const particles = useMemo(() => {
    if (!config) return [];
    const list = [];
    const { count, emojis, pattern, duration } = config;

    for (let i = 0; i < count; i++) {
      const emoji = emojis[i % emojis.length];
      const size = 18 + Math.random() * 18;
      const delay = Math.random() * 400;
      const speed = 200 + Math.random() * 300;

      let startX, startY, angle;

      if (pattern === 'burst') {
        // All from centre, explode outward
        startX = W / 2 - size / 2;
        startY = H / 2 - size / 2;
        angle = (360 / count) * i + Math.random() * 20 - 10;

      } else if (pattern === 'rain') {
        // Random x at top, fall down
        startX = Math.random() * W;
        startY = -40;
        angle = 80 + Math.random() * 20; // mostly downward

      } else if (pattern === 'explode') {
        // 4 corners
        const corner = i % 4;
        startX = corner < 2 ? Math.random() * 60 : W - Math.random() * 60;
        startY = corner % 2 === 0 ? Math.random() * 60 : H - Math.random() * 60;
        // angle toward centre with spread
        const toCenterX = W / 2 - startX;
        const toCenterY = H / 2 - startY;
        angle = (Math.atan2(toCenterY, toCenterX) * 180) / Math.PI + (Math.random() * 60 - 30);

      } else if (pattern === 'cascade') {
        // Alternating sides, arcing across
        const fromLeft = i % 2 === 0;
        startX = fromLeft ? -20 : W + 20;
        startY = (H / count) * i + Math.random() * 40;
        angle = fromLeft ? Math.random() * 30 : 150 + Math.random() * 30;

      } else if (pattern === 'mega') {
        // Mix of all patterns
        const sub = i % 4;
        if (sub === 0) {
          startX = W / 2; startY = H / 2; angle = (360 / 12) * i;
        } else if (sub === 1) {
          startX = Math.random() * W; startY = -30; angle = 70 + Math.random() * 40;
        } else if (sub === 2) {
          startX = i % 2 === 0 ? 0 : W; startY = Math.random() * H;
          angle = i % 2 === 0 ? Math.random() * 60 : 120 + Math.random() * 60;
        } else {
          startX = Math.random() * W; startY = H + 20; angle = -60 + Math.random() * 60;
        }
      }

      list.push({ id: i, emoji, startX, startY, angle, speed, duration, delay, size });
    }
    return list;
  }, [config]);

  useEffect(() => {
    if (!visible || !config) return;
    const timer = setTimeout(onComplete, config.duration + 500);
    return () => clearTimeout(timer);
  }, [visible, config, onComplete]);

  if (!visible || !config) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={p.id} {...p} />
      ))}
      <View style={styles.labelContainer}>
        <CelebrationLabel label={config.label} color={config.labelColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  labelContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 30,
    textAlign: 'center',
  },
});
