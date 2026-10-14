const { GameManager, GAME_STATUS, PLAYER_STATUS } = require('../game/GameManager');

const gameManager = new GameManager();

/**
 * Register all Socket.IO event handlers.
 * @param {import('socket.io').Server} io
 */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── Lobby Events ────────────────────────────────────────────────────

    socket.on('CREATE_GAME', ({ playerName, maxPlayers, teamCount }) => {
      const result = gameManager.createGame({
        hostId: socket.id,
        hostName: playerName,
        maxPlayers,
        teamCount,
      });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      socket.join(result.game.gameCode);
      socket.emit('GAME_CREATED', { game: sanitizeGame(result.game), player: result.player });
      console.log(`[Lobby] Game created: ${result.game.gameCode} by ${playerName}`);
    });

    socket.on('JOIN_GAME', ({ gameCode, playerName }) => {
      const result = gameManager.joinGame({
        gameCode: gameCode.toUpperCase(),
        playerId: socket.id,
        playerName,
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

      console.log(`[Lobby] Player ${playerName} joined game ${result.game.gameCode}`);
    });

    socket.on('JOIN_TEAM', ({ teamId }) => {
      const result = gameManager.joinTeam({ playerId: socket.id, teamId });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      socket.emit('TEAM_JOINED', { player: result.player });
      io.to(result.game.gameCode).emit('LOBBY_UPDATED', { game: sanitizeGame(result.game) });
    });

    socket.on('RENAME_TEAM', ({ teamId, newName }) => {
      const result = gameManager.renameTeam({ playerId: socket.id, teamId, newName });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      io.to(result.game.gameCode).emit('LOBBY_UPDATED', { game: sanitizeGame(result.game) });
    });

    socket.on('SET_READY', ({ isReady }) => {
      const result = gameManager.setReady({ playerId: socket.id, isReady });

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

    // ─── Game Events ──────────────────────────────────────────────────────

    socket.on('SUBMIT_BALL', ({ number }) => {
      if (!Number.isInteger(number) || number < 1 || number > 10) {
        socket.emit('ERROR', { message: 'Invalid number' });
        return;
      }

      const result = gameManager.submitBall({ playerId: socket.id, number });

      if (result.error) {
        socket.emit('ERROR', { message: result.error });
        return;
      }

      if (result.waiting) {
        // Notify the submitter they are waiting
        socket.emit('BALL_SUBMITTED', { waiting: true });
        // Notify the opponent that opponent submitted (no number revealed)
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

      if (result.gameOver) {
        io.to(gameCode).emit('GAME_OVER', {
          game: sanitizeGame(result.game),
          winnerTeamId: result.winnerTeamId,
          winnerTeamName: result.winnerTeamName,
        });
        console.log(`[Game] Game over: ${gameCode} — winner: ${result.winnerTeamName}`);
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

// ─── Sanitizers (don't leak pending numbers) ──────────────────────────────

function sanitizeGame(game) {
  const sanitized = { ...game };
  // Sanitize matches — remove pending submissions
  sanitized.matches = game.matches.map(sanitizeMatch);
  return sanitized;
}

function sanitizeMatch(match) {
  return {
    matchId: match.matchId,
    innings: match.innings,
    battingTeamId: match.battingTeamId,
    bowlingTeamId: match.bowlingTeamId,
    battingPlayerId: match.battingPlayerId,
    bowlingPlayerId: match.bowlingPlayerId,
    status: match.status,
    ballHistory: match.ballHistory,
    // DO NOT include pendingBat/pendingBowl
    hasBatSubmitted: match.pendingBat !== null,
    hasBowlSubmitted: match.pendingBowl !== null,
  };
}

function sanitizeSpectatorView(view) {
  if (!view) return null;
  return {
    ...view,
    game: sanitizeGame(view.game),
    activeMatches: view.activeMatches.map(sanitizeMatch),
  };
}

module.exports = { registerSocketHandlers, gameManager };

