import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { useColors } from '../theme/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_COUNT = 16;

function SingleBubble({ size, startX, duration, delay, swayDistance, color }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;
    const startFloating = () => {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }).start(() => {
        if (isMounted) {
          // Loop indefinitely with a small random jitter
          Animated.loop(
            Animated.timing(progress, {
              toValue: 1,
              duration,
              useNativeDriver: true,
            }),
          ).start();
        }
      });
    };

    startFloating();
    return () => {
      isMounted = false;
      progress.stopAnimation();
    };
  }, [delay, duration, progress]);

  // Float from bottom of screen to top
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT + 30, -40],
  });

  // Calm horizontal sway
  const translateX = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [
      0,
      swayDistance,
      -swayDistance * 0.7,
      swayDistance * 0.5,
      0,
    ],
  });

  // Soft fade in, glow while floating, fade out at top
  const opacity = progress.interpolate({
    inputRange: [0, 0.12, 0.82, 1],
    outputRange: [0, 0.45, 0.4, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.75, 1.05, 0.85],
  });

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          left: startX,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderColor: color,
          opacity,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
}

export default function FloatingBubbles({ count = BUBBLE_COUNT }) {
  const Colors = useColors();
  const bubbleColor = Colors.primaryAlpha ? Colors.primaryAlpha(0.35) : Colors.primary + '55';

  const bubbles = useMemo(() => {
    const list = [];
    for (let i = 0; i < count; i++) {
      const size = Math.floor(7 + Math.random() * 16);
      const startX = Math.floor(Math.random() * (SCREEN_WIDTH - 20));
      const duration = Math.floor(8000 + Math.random() * 7000);
      const delay = Math.floor((i * 600) + Math.random() * 800);
      const swayDistance = Math.floor(12 + Math.random() * 18);

      list.push({
        id: i,
        size,
        startX,
        duration,
        delay,
        swayDistance,
      });
    }
    return list;
  }, [count]);

  return (
    <View style={styles.container} pointerEvents="none">
      {bubbles.map((b) => (
        <SingleBubble key={b.id} {...b} color={bubbleColor} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  bubble: {
    position: 'absolute',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
});
