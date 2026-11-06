const authService = require('../auth/authService');
const { sanitizeText } = require('../middleware/security');

/**
 * Socket.IO Handshake Authentication Middleware.
 * Validates player session token, or gracefully creates an authenticated guest context.
 */
async function socketAuthMiddleware(socket, next) {
  try {
    const authData = socket.handshake.auth || {};
    const token = authData.token;
    const providedName = sanitizeText(authData.playerName || '', 20);

    let user = null;

    if (token) {
      const decoded = authService.verifySessionToken(token);
      if (decoded && decoded.playerId) {
        user = await authService.getUser(decoded.playerId);
      }
    }

    if (!user) {
      // Auto-assign authenticated guest player
      const guestResult = await authService.createGuestUser(providedName || `Player_${socket.id.slice(-4)}`);
      user = guestResult.user;
      socket.assignedToken = guestResult.token;
    }

    // Attach verified user identity to socket
    socket.user = {
      playerId: user.playerId,
      name: user.name,
      googleId: user.googleId || null,
      isGuest: !!user.isGuest,
    };

    next();
  } catch (err) {
    console.warn('[SocketAuth] Authentication error:', err.message);
    next(new Error('Authentication failed'));
  }
}

module.exports = { socketAuthMiddleware };
