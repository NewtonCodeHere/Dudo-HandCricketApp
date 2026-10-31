import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Typography, BorderRadius } from '../theme/tokens';
import { useColors } from '../theme/ThemeContext';

const FINGER_EMOJIS = {
  1: '☝️',
  2: '✌️',
  3: '🤟',
  4: '🖖',
  5: '🖐️',
  6: '🤙',
  7: '🤞',
  8: '🎱',
  9: '🤚',
  10: '🙌',
};

export default function FingerButton({ number, onPress, selected, disabled, size = 'normal' }) {
  const Colors = useColors();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1.12,
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
  }, [selected, glowAnim, scaleAnim]);

  const handlePress = () => {
    if (disabled) return;
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.92,
        useNativeDriver: true,
        tension: 300,
        friction: 10,
      }),
      Animated.spring(scaleAnim, {
        toValue: selected ? 1.12 : 1,
        useNativeDriver: true,
        tension: 200,
        friction: 10,
      }),
    ]).start();
    onPress(number);
  };

  const isSmall = size === 'small';
  const buttonSize = isSmall ? 56 : 66;
  const emojiSize = isSmall ? 22 : 26;
  const numberSize = isSmall ? Typography.xs : Typography.sm;

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
          {
            width: buttonSize,
            height: buttonSize,
            backgroundColor: selected ? Colors.primary : Colors.primaryTint,
            borderColor: selected ? Colors.primaryDark : Colors.borderLight,
            shadowColor: Colors.shadow,
          },
          selected && styles.selected,
          disabled && styles.disabled,
        ]}
      >
        <Text style={[styles.emoji, { fontSize: emojiSize }]}>
          {FINGER_EMOJIS[number] || number}
        </Text>
        <Text
          style={[
            styles.number,
            {
              fontSize: numberSize,
              color: selected ? '#FFFFFF' : Colors.textPrimary,
            },
          ]}
        >
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
  button: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  selected: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  disabled: {
    opacity: 0.35,
  },
  emoji: {
    lineHeight: 30,
  },
  number: {
    fontWeight: Typography.bold,
    marginTop: -2,
  },
});
