const express = require('express');
const authService = require('../auth/authService');
const { authLimiter, apiLimiter, sanitizeText } = require('../middleware/security');

const router = express.Router();

/**
 * Middleware: Protect routes with Bearer JWT
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const decoded = authService.verifySessionToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }

  req.user = decoded;
  next();
}

// ─── 1. Guest Authentication ──────────────────────────────────────────────────

router.post('/auth/guest', authLimiter, async (req, res) => {
  try {
    const { playerName } = req.body || {};
    const cleanName = sanitizeText(playerName || '', 20);
    const { user, token } = await authService.createGuestUser(cleanName);

    res.json({
      success: true,
      user,
      token,
      message: 'Guest session created securely',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create guest session' });
  }
});

// ─── 2. Google Play Store / Google OAuth Sign-in ──────────────────────────────

router.post('/auth/google', authLimiter, async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: 'Google ID Token is required' });
    }

    const result = await authService.authenticateWithGoogle(idToken);
    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    res.json({
      success: true,
      user: result.user,
      token: result.token,
      message: 'Authenticated with Google Play account',
    });
  } catch (err) {
    res.status(500).json({ error: 'Google authentication failed' });
  }
});

// ─── 3. Link Existing Guest Account to Google Play Store ─────────────────────

router.post('/auth/link-google', authLimiter, authenticateToken, async (req, res) => {
  try {
    const { idToken } = req.body || {};
    if (!idToken) {
      return res.status(400).json({ error: 'Google ID Token is required' });
    }

    const result = await authService.linkGuestToGoogle(req.user.playerId, idToken);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      user: result.user,
      token: result.token,
      message: 'Your Google Play account is now securely linked to your stats and profile!',
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to link Google account' });
  }
});

// ─── 4. User Profile & Live Cloud Stats ───────────────────────────────────────

router.get('/user/profile', apiLimiter, authenticateToken, async (req, res) => {
  try {
    const user = await authService.getUser(req.user.playerId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({
      success: true,
      user: {
        playerId: user.playerId,
        name: user.name,
        googleId: user.googleId,
        email: user.email,
        avatarUrl: user.avatarUrl,
        isGuest: !!user.isGuest,
        stats: user.stats,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

module.exports = router;
