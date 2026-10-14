// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      // React Native Animated.Value with useRef(...).current is an
      // established community pattern that works correctly at runtime
      'react-hooks/refs': 'off',
      // React Compiler and immutability rules over-fire on valid RN patterns
      'react-compiler/react-compiler': 'off',
      'react-hooks/immutability': 'off',
      // useMemo with Math.random() is intentional (stable particle positions)
      'react-hooks/purity': 'off',
      // setState at start of effect is needed for countdown reset
      'react-hooks/set-state-in-effect': 'off',
      // Allow common unused vars in callbacks
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ["dist/*", "server/*"],
  }
]);
