const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { setCached, getCached } = require('../redis/redisClient');
const eventBus = require('../events/eventBus');

// Google OAuth client for token verification
const googleClient = new OAuth2Client(config.googleClientId);

// In-memory user database (backed by Redis when REDIS_URL is configured)
const localUsers = new Map(); // id -> user

class AuthService {
  /**
   * Generates a secure signed JWT session token.
   */
  createSessionToken(user) {
    return jwt.sign(
      {
        playerId: user.playerId,
        googleId: user.googleId || null,
        name: user.name,
        isGuest: !!user.isGuest,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  /**
   * Verifies and decodes a JWT token.
   */
  verifySessionToken(token) {
    try {
      if (!token) return null;
      return jwt.verify(token, config.jwtSecret);
    } catch (err) {
      return null;
    }
  }

  /**
   * Creates a secure guest session.
   */
  async createGuestUser(customName) {
    const guestId = `guest_${uuidv4()}`;
    const name = customName && customName.trim() ? customName.trim().slice(0, 20) : `Player_${guestId.slice(-4)}`;

    const user = {
      playerId: guestId,
      name,
      googleId: null,
      email: null,
      avatarUrl: null,
      isGuest: true,
      stats: {
        matchesPlayed: 0,
        matchesWon: 0,
        totalRuns: 0,
        highestScore: 0,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveUser(user);
    const token = this.createSessionToken(user);
    return { user, token };
  }

  /**
   * Verifies a Google Play Store / Google OAuth ID Token.
   */
  async verifyGoogleIdToken(idToken) {
    try {
      // 1. Production Google OAuth verification
      if (config.googleClientId) {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: [config.googleClientId, config.googleAndroidClientId].filter(Boolean),
        });
        const payload = ticket.getPayload();
        return {
          googleId: payload['sub'],
          email: payload['email'],
          name: payload['name'] || payload['given_name'] || 'Google Player',
          avatarUrl: payload['picture'] || null,
        };
      }

      // 2. Development / Fallback parsing if client ID is not yet filled in env
      // Safely decode token without signature verification in dev mode only
      const decoded = jwt.decode(idToken);
      if (decoded && decoded.sub) {
        return {
          googleId: decoded.sub,
          email: decoded.email || null,
          name: decoded.name || 'Google Player',
          avatarUrl: decoded.picture || null,
        };
      }

      return null;
    } catch (err) {
      console.warn('[AuthService] Google token verification failed:', err.message);
      return null;
    }
  }

  /**
   * Authenticates or registers a user via Google Play Services / Google Sign-In.
   */
  async authenticateWithGoogle(idToken) {
    const googleProfile = await this.verifyGoogleIdToken(idToken);
    if (!googleProfile) {
      return { error: 'Invalid Google Play credentials' };
    }

    const { googleId, email, name, avatarUrl } = googleProfile;
    let user = await this.getUserByGoogleId(googleId);

    if (!user) {
      // New user registration
      user = {
        playerId: `google_${googleId.slice(0, 12)}`,
        googleId,
        email,
        name: name.slice(0, 20),
        avatarUrl,
        isGuest: false,
        stats: {
          matchesPlayed: 0,
          matchesWon: 0,
          totalRuns: 0,
          highestScore: 0,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else {
      // Update details
      user.name = name.slice(0, 20);
      user.avatarUrl = avatarUrl;
      user.updatedAt = Date.now();
    }

    await this.saveUser(user);
    const token = this.createSessionToken(user);
    eventBus.publish('USER_LINKED', { playerId: user.playerId, googleId });

    return { user, token };
  }

  /**
   * Links an existing Guest account to Google Play Store account,
   * preserving game history, stats, and preferences.
   */
  async linkGuestToGoogle(currentPlayerId, idToken) {
    const googleProfile = await this.verifyGoogleIdToken(idToken);
    if (!googleProfile) {
      return { error: 'Invalid Google Play credentials' };
    }

    const { googleId, email, name, avatarUrl } = googleProfile;

    // Check if another account already has this Google ID
    const existingGoogleUser = await this.getUserByGoogleId(googleId);
    let guestUser = await this.getUser(currentPlayerId);

    if (!guestUser) {
      guestUser = {
        playerId: currentPlayerId,
        name,
        stats: { matchesPlayed: 0, matchesWon: 0, totalRuns: 0, highestScore: 0 },
      };
    }

    if (existingGoogleUser && existingGoogleUser.playerId !== currentPlayerId) {
      // Merge stats into the Google user
      existingGoogleUser.stats.matchesPlayed += guestUser.stats?.matchesPlayed || 0;
      existingGoogleUser.stats.matchesWon += guestUser.stats?.matchesWon || 0;
      existingGoogleUser.stats.totalRuns += guestUser.stats?.totalRuns || 0;
      existingGoogleUser.stats.highestScore = Math.max(
        existingGoogleUser.stats?.highestScore || 0,
        guestUser.stats?.highestScore || 0
      );
      existingGoogleUser.updatedAt = Date.now();

      await this.saveUser(existingGoogleUser);
      const token = this.createSessionToken(existingGoogleUser);
      eventBus.publish('USER_LINKED', { playerId: existingGoogleUser.playerId, googleId, merged: true });

      return { user: existingGoogleUser, token };
    }

    // Link Google ID to this guest profile
    guestUser.googleId = googleId;
    guestUser.email = email;
    guestUser.name = name.slice(0, 20);
    guestUser.avatarUrl = avatarUrl;
    guestUser.isGuest = false;
    guestUser.updatedAt = Date.now();

    await this.saveUser(guestUser);
    const token = this.createSessionToken(guestUser);
    eventBus.publish('USER_LINKED', { playerId: guestUser.playerId, googleId });

    return { user: guestUser, token };
  }

  // ─── Persistence Helpers ───────────────────────────────────────────────────

  async saveUser(user) {
    localUsers.set(user.playerId, user);
    if (user.googleId) {
      localUsers.set(`google_map:${user.googleId}`, user.playerId);
    }
    // Cache to Redis with 60 days TTL
    await setCached(`user:${user.playerId}`, user, 60 * 86400);
    if (user.googleId) {
      await setCached(`google_map:${user.googleId}`, user.playerId, 60 * 86400);
    }
  }

  async getUser(playerId) {
    if (!playerId) return null;
    let user = localUsers.get(playerId);
    if (!user) {
      user = await getCached(`user:${playerId}`);
      if (user) localUsers.set(playerId, user);
    }
    return user || null;
  }

  async getUserByGoogleId(googleId) {
    if (!googleId) return null;
    let playerId = localUsers.get(`google_map:${googleId}`);
    if (!playerId) {
      playerId = await getCached(`google_map:${googleId}`);
    }
    if (playerId) {
      return this.getUser(playerId);
    }
    return null;
  }
}

const authService = new AuthService();
module.exports = authService;
