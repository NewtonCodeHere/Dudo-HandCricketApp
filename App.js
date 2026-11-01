import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ThemeProvider } from './src/theme/ThemeContext';

// ── Offline Screens ──────────────────────────────────────────────────────────
import HomeScreen from './src/screens/HomeScreen';
import OfflineSetupScreen from './src/screens/OfflineSetupScreen';
import OfflineGameScreen from './src/screens/OfflineGameScreen';

// ── Online Screens ───────────────────────────────────────────────────────────
import OnlineSetupScreen from './src/screens/OnlineSetupScreen';
import CreateGameScreen from './src/screens/CreateGameScreen';
import JoinGameScreen from './src/screens/JoinGameScreen';
import LobbyScreen from './src/screens/LobbyScreen';
import OnlineGameScreen from './src/screens/OnlineGameScreen';
import OnlineGameOverScreen from './src/screens/OnlineGameOverScreen';

// ── Info Screens ─────────────────────────────────────────────────────────────
import HowToPlayScreen from './src/screens/HowToPlayScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
            initialRouteName="Home"
          >
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="HowToPlay" component={HowToPlayScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="OfflineSetup" component={OfflineSetupScreen} />
            <Stack.Screen name="OfflineGame" component={OfflineGameScreen} />
            <Stack.Screen name="OnlineSetup" component={OnlineSetupScreen} />
            <Stack.Screen name="CreateGame" component={CreateGameScreen} />
            <Stack.Screen name="JoinGame" component={JoinGameScreen} />
            <Stack.Screen name="Lobby" component={LobbyScreen} />
            <Stack.Screen name="OnlineGame" component={OnlineGameScreen} />
            <Stack.Screen name="OnlineGameOver" component={OnlineGameOverScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
