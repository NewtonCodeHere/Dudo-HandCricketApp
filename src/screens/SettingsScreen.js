import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Switch,
  Animated,
  Image,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const Colors = useColors();
  const { isDark, toggleTheme, accentColor, setAccentColor, presets } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [customHex, setCustomHex] = useState(accentColor);
  const [hexError, setHexError] = useState('');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  useEffect(() => {
    setCustomHex(accentColor);
  }, [accentColor]);

  const handleApplyCustomHex = () => {
    let hex = customHex.trim();
    if (!hex.startsWith('#')) hex = '#' + hex;
    const isValid = /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex);
    if (isValid) {
      setHexError('');
      setAccentColor(hex);
    } else {
      setHexError('Invalid Hex (e.g. #FF5A5F)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: Colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>SETTINGS</Text>
        <View style={{ width: 60 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>THEME & APPEARANCE</Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: Colors.backgroundCard,
              borderColor: Colors.border,
              shadowColor: Colors.shadow,
            },
          ]}
        >
          {/* Light / Dark Toggle */}
          <View style={[styles.row, { borderBottomColor: Colors.border }]}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>{isDark ? '🌙' : '☀️'}</Text>
              <View>
                <Text style={[styles.rowLabel, { color: Colors.textPrimary }]}>
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </Text>
                <Text style={[styles.rowSub, { color: Colors.textMuted }]}>
                  {isDark ? 'Charcoal night aesthetic' : 'Clean porcelain blush aesthetic'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#CBD5E1', true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Quick theme buttons */}
          <View style={styles.previewRow}>
            <TouchableOpacity
              onPress={() => !isDark && toggleTheme()}
              style={[
                styles.themeChip,
                {
                  backgroundColor: isDark ? Colors.primaryTint : Colors.backgroundElevated,
                  borderColor: isDark ? Colors.primary : Colors.border,
                  borderWidth: isDark ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.themeChipIcon}>🌙</Text>
              <Text
                style={[
                  styles.themeChipLabel,
                  { color: isDark ? Colors.primary : Colors.textMuted },
                ]}
              >
                Dark
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => isDark && toggleTheme()}
              style={[
                styles.themeChip,
                {
                  backgroundColor: !isDark ? Colors.primaryTint : Colors.backgroundElevated,
                  borderColor: !isDark ? Colors.primary : Colors.border,
                  borderWidth: !isDark ? 2 : 1,
                },
              ]}
            >
              <Text style={styles.themeChipIcon}>☀️</Text>
              <Text
                style={[
                  styles.themeChipLabel,
                  { color: !isDark ? Colors.primary : Colors.textMuted },
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Accent Color Customizer */}
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>APP ACCENT COLOR</Text>
        <Text style={[styles.sectionDesc, { color: Colors.textSecondary }]}>
          Pick your preferred theme color or enter any custom hex code below.
        </Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: Colors.backgroundCard,
              borderColor: Colors.border,
              shadowColor: Colors.shadow,
            },
          ]}
        >
          {/* Preset Swatches */}
          <View style={styles.presetGrid}>
            {presets.map((preset) => {
              const isSelected = accentColor.toLowerCase() === preset.color.toLowerCase();
              return (
                <TouchableOpacity
                  key={preset.id}
                  onPress={() => setAccentColor(preset.color)}
                  style={[
                    styles.swatchItem,
                    {
                      borderColor: isSelected ? Colors.textPrimary : 'transparent',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.swatchCircle, { backgroundColor: preset.color }]}>
                    {isSelected && <Text style={styles.swatchCheck}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.swatchName,
                      { color: isSelected ? Colors.textPrimary : Colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Custom Hex Input */}
          <View style={[styles.customHexRow, { borderTopColor: Colors.border, borderTopWidth: 1 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.customHexLabel, { color: Colors.textMuted }]}>
                CUSTOM HEX COLOR
              </Text>
              <View style={styles.inputWrap}>
                <View style={[styles.previewDot, { backgroundColor: customHex || Colors.primary }]} />
                <TextInput
                  value={customHex}
                  onChangeText={(val) => {
                    setCustomHex(val);
                    if (hexError) setHexError('');
                  }}
                  placeholder="#FF5A5F"
                  placeholderTextColor={Colors.inputPlaceholder}
                  style={[
                    styles.hexInput,
                    {
                      color: Colors.textPrimary,
                      backgroundColor: Colors.backgroundElevated,
                      borderColor: hexError ? Colors.accent : Colors.border,
                    },
                  ]}
                  autoCapitalize="characters"
                  maxLength={7}
                />
              </View>
              {hexError ? <Text style={styles.errorText}>{hexError}</Text> : null}
            </View>
            <TouchableOpacity
              onPress={handleApplyCustomHex}
              style={[styles.applyBtn, { backgroundColor: Colors.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Accent Preview Box */}
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>LIVE PREVIEW</Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: Colors.backgroundCard,
              borderColor: Colors.border,
              padding: Spacing.lg,
            },
          ]}
        >
          <View style={styles.livePreviewHeader}>
            <View style={[styles.pillBadge, { backgroundColor: Colors.primaryTint }]}>
              <Text style={[styles.pillBadgeText, { color: Colors.primary }]}>Active Palette</Text>
            </View>
            <Text style={[styles.livePreviewSub, { color: Colors.textMuted }]}>{accentColor}</Text>
          </View>

          <View style={styles.liveButtonRow}>
            <TouchableOpacity
              style={[styles.sampleBtn, { backgroundColor: Colors.primary }]}
              activeOpacity={0.9}
            >
              <Text style={styles.sampleBtnText}>Primary Button</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sampleOutlineBtn,
                { borderColor: Colors.primary, backgroundColor: Colors.primaryTint },
              ]}
              activeOpacity={0.9}
            >
              <Text style={[styles.sampleOutlineText, { color: Colors.primary }]}>Outline</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Brand */}
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>ABOUT DUDO</Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: Colors.backgroundCard,
              borderColor: Colors.border,
              shadowColor: Colors.shadow,
            },
          ]}
        >
          <View style={styles.aboutRow}>
            <View
              style={[
                styles.aboutLogoBox,
                {
                  backgroundColor: isDark ? '#1C1C22' : '#FFFFFF',
                  borderColor: Colors.borderLight,
                },
              ]}
            >
              <Image
                source={require('../../assets/dudo_logo.png')}
                style={styles.aboutLogo}
                resizeMode="contain"
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <Text style={[styles.aboutTitle, { color: Colors.textPrimary }]}>DUDO Hand Cricket</Text>
              <Text style={[styles.aboutSub, { color: Colors.textMuted }]}>
                Version 1.0.0 · Mobile Edition
              </Text>
            </View>
          </View>
          <Text style={[styles.aboutDesc, { color: Colors.textSecondary }]}>
            The classic finger hand-cricket duel, modernized for competitive mobile esports. Play
            offline against AI or battle live friends in real-time lobbies!
          </Text>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderBottomWidth: 1,
  },
  backBtn: { width: 60 },
  backText: { fontSize: Typography.lg, fontWeight: '600' },
  headerTitle: { fontSize: Typography.md, fontWeight: '900', letterSpacing: 3 },
  scroll: { padding: Spacing.xl, paddingBottom: 60 },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xs,
  },
  sectionDesc: {
    fontSize: Typography.xs,
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  rowIcon: { fontSize: 24, width: 32, textAlign: 'center' },
  rowLabel: { fontSize: Typography.base, fontWeight: '600' },
  rowSub: { fontSize: Typography.xs, marginTop: 2 },
  previewRow: { flexDirection: 'row', padding: Spacing.lg, gap: Spacing.md },
  themeChip: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  themeChipIcon: { fontSize: 26 },
  themeChipLabel: { fontSize: Typography.sm, fontWeight: '700', letterSpacing: 0.5 },

  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  swatchItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.sm,
  },
  swatchCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  swatchCheck: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
  },
  swatchName: {
    fontSize: Typography.xs,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },

  customHexRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  customHexLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  previewDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  hexInput: {
    flex: 1,
    height: 42,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sm,
    fontWeight: '600',
    borderWidth: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: Typography.xs,
    marginTop: 4,
  },
  applyBtn: {
    height: 42,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: Typography.sm,
  },

  livePreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  pillBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  pillBadgeText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
  },
  livePreviewSub: {
    fontSize: Typography.xs,
    fontWeight: '600',
    letterSpacing: 1,
  },
  liveButtonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sampleBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  sampleBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: Typography.sm,
  },
  sampleOutlineBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  sampleOutlineText: {
    fontWeight: 'bold',
    fontSize: Typography.sm,
  },

  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  aboutLogoBox: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  aboutLogo: { width: 44, height: 44 },
  aboutTitle: { fontSize: Typography.md, fontWeight: '700' },
  aboutSub: { fontSize: Typography.xs, marginTop: 2 },
  aboutDesc: { fontSize: Typography.sm, lineHeight: 20, padding: Spacing.lg, paddingTop: 0 },
});
