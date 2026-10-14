import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { Colors, Typography, BorderRadius } from '../theme/tokens';

const FINGER_EMOJIS = {
  1: '☝️',
  2: '✌️',
  3: '🤟',
  4: '🖖',
  5: '🖐️',
  6: '🤙',
  7: '🤞',
  8: '🤙',
  9: '🤚',
  10: '🙌',
};

export default function FingerButton({ number, onPress, selected, disabled, size = 'normal' }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.15,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [selected]);

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(scaleAnim, {
        toValue: selected ? 1.15 : 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
    onPress(number);
  };

  const isSmall = size === 'small';
  const buttonSize = isSmall ? 58 : 68;
  const emojiSize = isSmall ? 22 : 26;
  const numberSize = isSmall ? Typography.xs : Typography.sm;

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', 'rgba(108, 99, 255, 0.4)'],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { width: buttonSize, height: buttonSize },
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.8}
        style={[
          styles.button,
          { width: buttonSize, height: buttonSize },
          selected && styles.selected,
          disabled && styles.disabled,
        ]}
      >
        <Animated.View
          style={[
            styles.glowRing,
            { width: buttonSize + 8, height: buttonSize + 8, borderColor: glowColor },
          ]}
        />
        <Text style={[styles.emoji, { fontSize: emojiSize }]}>
          {FINGER_EMOJIS[number]}
        </Text>
        <Text style={[styles.number, { fontSize: numberSize }, selected && styles.numberSelected]}>
          {number}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    margin: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  button: {
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(108, 99, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
  },
  selected: {
    backgroundColor: 'rgba(108, 99, 255, 0.35)',
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  disabled: {
    opacity: 0.3,
  },
  emoji: {
    lineHeight: 30,
  },
  number: {
    color: Colors.textSecondary,
    fontWeight: Typography.bold,
    fontSize: Typography.xs,
    marginTop: -2,
  },
  numberSelected: {
    color: Colors.primary,
  },
});
