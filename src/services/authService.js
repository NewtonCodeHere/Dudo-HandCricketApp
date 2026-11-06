/**
 * DUDO Hand Cricket - Secure Authentication & Google Play Identity Service
 * Uses hardware-backed expo-secure-store on iOS/Android and localStorage on web.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { getServerUrl } from '../networking/config';

const TOKEN_KEY = 'dudo_sec_token_v1';
const USER_KEY = 'dudo_user_prof_v1';

let cachedToken = null;
let cachedUser = null;
const authSubscribers = new Set();

function notifySubscribers() {
  authSubscribers.forEach((cb) => {
    try {
      cb({ token: cachedToken, user: cachedUser });
    } catch (e) {
      console.warn('[AuthService] Subscriber callback error:', e);
    }
  });
}

// ─── Storage Helpers ──────────────────────────────────────────────────────────

async function setSecureItem(key, value) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } else {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
      });
    }
  } catch (err) {
    console.warn(`[AuthService] Failed to securely write ${key}:`, err.message);
  }
}

async function getSecureItem(key) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } else {
      return await SecureStore.getItemAsync(key);
    }
  } catch (err) {
    console.warn(`[AuthService] Failed to securely read ${key}:`, err.message);
    return null;
  }
}

async function removeSecureItem(key) {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (err) {
    console.warn(`[AuthService] Failed to delete ${key}:`, err.message);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Subscribe to auth state updates (e.g. guest -> Google linked).
   */
  subscribe(callback) {
    authSubscribers.add(callback);
    callback({ token: cachedToken, user: cachedUser });
    return () => authSubscribers.delete(callback);
  },

  getToken() {
    return cachedToken;
  },

  getUser() {
    return cachedUser;
  },

  async saveSession(token, user) {
    cachedToken = token;
    cachedUser = user;
    if (token) await setSecureItem(TOKEN_KEY, token);
    if (user) await setSecureItem(USER_KEY, JSON.stringify(user));
    notifySubscribers();
  },

  /**
   * Initialize or restore persistent authentication session.
   * If no session exists, provisions an authenticated guest identity.
   */
  async initAuthSession(preferredName = '') {
    try {
      const storedToken = await getSecureItem(TOKEN_KEY);
      const storedUserJson = await getSecureItem(USER_KEY);

      if (storedToken && storedUserJson) {
        cachedToken = storedToken;
        try {
          cachedUser = JSON.parse(storedUserJson);
        } catch {
          cachedUser = null;
        }

        // Verify with server in background to refresh stats
        this.fetchProfile().catch(() => {});
        notifySubscribers();
        return { token: cachedToken, user: cachedUser };
      }

      // No stored token: register guest account
      const response = await fetch(`${getServerUrl()}/api/auth/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: preferredName }),
      });

      if (response.ok) {
        const data = await response.json();
        await this.saveSession(data.token, data.user);
        return { token: data.token, user: data.user };
      }
    } catch (err) {
      console.warn('[AuthService] Session init fallback:', err.message);
    }

    // Offline / local fallback
    const fallbackUser = {
      playerId: `guest_${Math.random().toString(36).substring(2, 9)}`,
      name: preferredName || 'Player',
      isGuest: true,
      stats: { matchesPlayed: 0, matchesWon: 0, totalRuns: 0 },
    };
    cachedUser = fallbackUser;
    notifySubscribers();
    return { token: null, user: fallbackUser };
  },

  /**
   * Fetch current authenticated profile & statistics from backend
   */
  async fetchProfile() {
    if (!cachedToken) return cachedUser;
    try {
      const res = await fetch(`${getServerUrl()}/api/user/profile`, {
        headers: { Authorization: `Bearer ${cachedToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        cachedUser = data.user;
        await setSecureItem(USER_KEY, JSON.stringify(data.user));
        notifySubscribers();
        return data.user;
      }
    } catch (e) {
      // offline or network hiccup
    }
    return cachedUser;
  },

  /**
   * Link an existing guest player session to a Google / Google Play account.
   * Retains all stats, match history, and achievements!
   */
  async linkGoogleAccount(idToken) {
    if (!idToken) throw new Error('Google ID token is required');
    try {
      const res = await fetch(`${getServerUrl()}/api/auth/link-google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cachedToken ? { Authorization: `Bearer ${cachedToken}` } : {}),
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to link Google account');
      }

      await this.saveSession(data.token, data.user);
      return data;
    } catch (err) {
      console.error('[AuthService] Google linking error:', err);
      throw err;
    }
  },

  /**
   * Sign in directly with Google (e.g. on new device)
   */
  async signInWithGoogle(idToken) {
    if (!idToken) throw new Error('Google ID token is required');
    try {
      const res = await fetch(`${getServerUrl()}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to sign in with Google');
      }

      await this.saveSession(data.token, data.user);
      return data;
    } catch (err) {
      console.error('[AuthService] Google sign in error:', err);
      throw err;
    }
  },

  /**
   * Disconnect and clear credentials
   */
  async logout() {
    await removeSecureItem(TOKEN_KEY);
    await removeSecureItem(USER_KEY);
    cachedToken = null;
    cachedUser = null;
    return this.initAuthSession();
  },
};
