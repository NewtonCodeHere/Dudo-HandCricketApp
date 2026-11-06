const { GameManager, GAME_STATUS, PLAYER_STATUS } = require('../game/GameManager');
const eventBus = require('../events/eventBus');
const {
  checkSocketRateLimit,
  cleanupSocketRateLimit,
  sanitizeText,
  sanitizeGameCode,
  isValidBall,
} = require('../middleware/security');

const gameManager = new GameManager();

/**
 * Register all Socket.IO event handlers with enterprise security and rate limiting.
 * @param {import('socket.io').Server} io
 */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    const verifiedUser = socket.user || {
      playerId: socket.id,
      name: `Player_${socket.id.slice(-4)}`,
      isGuest: true,
    };

    console.log(`[Socket] Authenticated connection: ${socket.id} (User: ${verifiedUser.name})`);

    // Acknowledge authentication back to client
    socket.emit('AUTHENTICATED', {
      user: verifiedUser,
      token: socket.assignedToken || null,
    });

    // ─── Lobby Events ────────────────────────────────────────────────────

    socket.on('CREATE_GAME', ({ playerName, maxPlayers, teamCount, overs }) => {
      if (!checkSocketRateLimit(socket, 'CREATE_GAME')) {
        socket.emit('ERROR', { message: 'Action rate limit exceeded. Please wait a moment.' });
        return;
      }

      const cleanName = sanitizeText(playerName || verifiedUser.name, 20);
      const playersNum = parseInt(maxPlayers, 10);
      const teamsNum = parseInt(teamCount, 10);
      const oversVal = (overs !== null && overs !== undefined && overs !== 'unlimited')
        ? Math.max(1, Math.min(50, parseInt(overs, 10) || 1))
        : null;

      const result = gameManager.createGame({
        hostId: socket.id,
        hostName: cleanName || 'Host',
        maxPlayers: playersNum,
        teamCount: teamsNum,
        overs: oversVal,
      });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      socket.join(result.game.gameCode);
      socket.emit('GAME_CREATED', { game: sanitizeGame(result.game), player: result.player });
      console.log(`[Lobby] Game created: ${result.game.gameCode} by ${cleanName}`);
    });

    socket.on('JOIN_GAME', ({ gameCode, playerName }) => {
      if (!checkSocketRateLimit(socket, 'JOIN_GAME')) {
        socket.emit('ERROR', { message: 'Too many join attempts. Please slow down.' });
        return;
      }

      const cleanCode = sanitizeGameCode(gameCode);
      const cleanName = sanitizeText(playerName || verifiedUser.name, 20);

      if (!cleanCode) {
        socket.emit('ERROR', { message: 'Invalid game code format' });
        return;
      }

      const result = gameManager.joinGame({
        gameCode: cleanCode,
        playerId: socket.id,
        playerName: cleanName || 'Player',
      });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      socket.join(result.game.gameCode);

      if (result.reconnected) {
        socket.emit('RECONNECTED', { game: sanitizeGame(result.game), player: result.player });
        io.to(result.game.gameCode).emit('PLAYER_RECONNECTED', {
          game: sanitizeGame(result.game),
          player: result.player,
        });
      } else {
        socket.emit('GAME_JOINED', { game: sanitizeGame(result.game), player: result.player });
        io.to(result.game.gameCode).emit('LOBBY_UPDATED', { game: sanitizeGame(result.game) });
      }

      console.log(`[Lobby] Player ${cleanName} joined game ${result.game.gameCode}`);
    });

    socket.on('JOIN_TEAM', ({ teamId }) => {
      if (!checkSocketRateLimit(socket, 'JOIN_TEAM')) return;

      const cleanTeamId = sanitizeText(teamId, 20);
      const result = gameManager.joinTeam({ playerId: socket.id, teamId: cleanTeamId });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      socket.emit('TEAM_JOINED', { player: result.player });
      io.to(result.game.gameCode).emit('LOBBY_UPDATED', { game: sanitizeGame(result.game) });
    });

    socket.on('RENAME_TEAM', ({ teamId, newName }) => {
      if (!checkSocketRateLimit(socket, 'RENAME_TEAM')) return;

      const cleanTeamId = sanitizeText(teamId, 20);
      const cleanName = sanitizeText(newName, 20);

      const result = gameManager.renameTeam({
        playerId: socket.id,
        teamId: cleanTeamId,
        newName: cleanName,
      });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      io.to(result.game.gameCode).emit('LOBBY_UPDATED', { game: sanitizeGame(result.game) });
    });

    socket.on('SET_READY', ({ isReady }) => {
      if (!checkSocketRateLimit(socket, 'SET_READY')) return;

      const result = gameManager.setReady({ playerId: socket.id, isReady: !!isReady });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      io.to(result.game.gameCode).emit('LOBBY_UPDATED', {
        game: sanitizeGame(result.game),
        allReady: result.allReady,
      });
    });

    socket.on('START_GAME', () => {
      if (!checkSocketRateLimit(socket, 'START_GAME')) return;

      const result = gameManager.startGame(socket.id);

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      io.to(result.game.gameCode).emit('GAME_STARTED', {
        game: sanitizeGame(result.game),
        matches: result.matches.map(sanitizeMatch),
      });
      console.log(`[Game] Game started: ${result.game.gameCode}`);
    });

    // ─── Game Play Events ────────────────────────────────────────────────

    socket.on('SUBMIT_BALL', ({ number }) => {
      if (!checkSocketRateLimit(socket, 'SUBMIT_BALL')) {
        socket.emit('ERROR', { message: 'Submitting too fast. Please wait.' });
        return;
      }

      if (!isValidBall(number)) {
        socket.emit('ERROR', { message: 'Invalid move: number must be 1 to 10' });
        return;
      }

      const result = gameManager.submitBall({ playerId: socket.id, number: parseInt(number, 10) });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      if (result.waiting) {
        socket.emit('BALL_SUBMITTED', { waiting: true });
        const match = result.match;
        const opponentId =
          match.battingPlayerId === socket.id ? match.bowlingPlayerId : match.battingPlayerId;
        io.to(opponentId).emit('OPPONENT_SUBMITTED');
        return;
      }

      const gameCode = result.game.gameCode;

      // Ball resolved — broadcast to everyone in the game
      io.to(gameCode).emit('BALL_RESOLVED', {
        matchId: result.match.matchId,
        ball: result.ball,
        result: result.result,
        game: sanitizeGame(result.game),
      });

      // Async event streaming for stats/telemetry
      eventBus.publish('BALL_RECORDED', {
        gameCode,
        matchId: result.match.matchId,
        ball: result.ball,
      });

      if (result.gameOver) {
        io.to(gameCode).emit('GAME_OVER', {
          game: sanitizeGame(result.game),
          winnerTeamId: result.winnerTeamId,
          winnerTeamName: result.winnerTeamName,
        });
        console.log(`[Game] Game over: ${gameCode} — winner: ${result.winnerTeamName}`);

        // Offload match persistence & leaderboard update via event queue
        eventBus.publish('MATCH_COMPLETED', {
          gameCode,
          winnerTeam: result.winnerTeamId,
          players: result.game.players,
        });
        return;
      }

      if (result.inningsBreak) {
        io.to(gameCode).emit('INNINGS_BREAK', {
          game: sanitizeGame(result.game),
          target: result.game.target,
          inningsResult: result.game.inningsResult,
        });
        return;
      }

      if (result.matchFinished) {
        io.to(gameCode).emit('MATCH_FINISHED', {
          matchId: result.match.matchId,
          game: sanitizeGame(result.game),
        });
      }
    });

    socket.on('START_SECOND_INNINGS', () => {
      if (!checkSocketRateLimit(socket, 'START_SECOND_INNINGS')) return;

      const result = gameManager.startSecondInnings(socket.id);

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      io.to(result.game.gameCode).emit('SECOND_INNINGS_STARTED', {
        game: sanitizeGame(result.game),
        matches: result.matches.map(sanitizeMatch),
      });
    });

    // ─── Spectator Events ─────────────────────────────────────────────────

    socket.on('GET_SPECTATOR_VIEW', () => {
      if (!checkSocketRateLimit(socket, 'GET_SPECTATOR_VIEW')) return;

      const game = gameManager.getGameByPlayer(socket.id);
      if (!game) {
        socket.emit('ERROR', { message: 'Not in a game' });
        return;
      }
      const view = gameManager.getSpectatorView(game.gameCode);
      socket.emit('SPECTATOR_VIEW', { view: sanitizeSpectatorView(view) });
    });

    // ─── Disconnect / Reconnect ───────────────────────────────────────────

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      cleanupSocketRateLimit(socket.id);

      const result = gameManager.disconnectPlayer(socket.id);
      if (!result) return;

      const { game, player, newHostId } = result;

      io.to(game.gameCode).emit('PLAYER_DISCONNECTED', {
        playerId: socket.id,
        playerName: player.name,
        newHostId,
        reconnectWindowSeconds: 30,
        game: sanitizeGame(game),
      });

      if (newHostId) {
        io.to(newHostId).emit('YOU_ARE_HOST');
      }
    });
  });
}

// ─── Sanitizers (Prevents leaking secret pending numbers) ─────────────────

function sanitizeGame(game) {
  if (!game) return null;
  const sanitized = { ...game };
  sanitized.matches = (game.matches || []).map(sanitizeMatch);
  return sanitized;
}

function sanitizeMatch(match) {
  if (!match) return null;
  return {
    matchId: match.matchId,
    innings: match.innings,
    battingTeamId: match.battingTeamId,
    bowlingTeamId: match.bowlingTeamId,
    battingPlayerId: match.battingPlayerId,
    bowlingPlayerId: match.bowlingPlayerId,
    status: match.status,
    ballHistory: match.ballHistory || [],
    hasBatSubmitted: match.pendingBat !== null && match.pendingBat !== undefined,
    hasBowlSubmitted: match.pendingBowl !== null && match.pendingBowl !== undefined,
  };
}

function sanitizeSpectatorView(view) {
  if (!view) return null;
  return {
    ...view,
    game: sanitizeGame(view.game),
    activeMatches: (view.activeMatches || []).map(sanitizeMatch),
  };
}

module.exports = { registerSocketHandlers, gameManager };
