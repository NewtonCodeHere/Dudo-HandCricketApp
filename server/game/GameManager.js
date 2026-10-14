const { v4: uuidv4 } = require('uuid');
const { generateGameCode, isValidPlayerCount } = require('./GameRules');

const GAME_STATUS = {
  LOBBY: 'LOBBY',
  STARTING: 'STARTING',
  INNINGS_1: 'INNINGS_1',
  INNINGS_BREAK: 'INNINGS_BREAK',
  INNINGS_2: 'INNINGS_2',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
};

const PLAYER_STATUS = {
  LOBBY: 'LOBBY',
  READY: 'READY',
  BATTING: 'BATTING',
  BOWLING: 'BOWLING',
  OUT: 'OUT',
  SPECTATING: 'SPECTATING',
  DISCONNECTED: 'DISCONNECTED',
};

class GameManager {
  constructor() {
    this.games = new Map();       // gameCode -> Game
    this.playerToGame = new Map(); // playerId -> gameCode
    this.codeToGame = new Map();  // gameCode -> Game (same as games)

    // Reconnect windows
    this.reconnectTimers = new Map(); // playerId -> timer
  }

  // ─── Game Creation ───────────────────────────────────────────────────────

  createGame({ hostId, hostName, maxPlayers, teamCount }) {
    if (!isValidPlayerCount(maxPlayers, teamCount)) {
      return { error: 'Invalid player/team combination' };
    }

    let code;
    do { code = generateGameCode(); } while (this.games.has(code));

    const teams = [];
    const teamColors = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFD700'];
    const teamNames = ['Team A', 'Team B', 'Team C', 'Team D'];
    for (let i = 0; i < teamCount; i++) {
      teams.push({
        teamId: `team_${i}`,
        name: teamNames[i],
        color: teamColors[i],
        players: [],
        totalScore: 0,
      });
    }

    const host = {
      playerId: hostId,
      name: hostName,
      gameCode: code,
      teamId: null,
      status: PLAYER_STATUS.LOBBY,
      score: 0,
      ballsPlayed: 0,
      isReady: false,
      isConnected: true,
      isHost: true,
    };

    const game = {
      gameCode: code,
      hostId,
      maxPlayers,
      playersPerTeam: maxPlayers / teamCount,
      teamCount,
      status: GAME_STATUS.LOBBY,
      players: { [hostId]: host },
      teams,
      matches: [],
      currentInnings: 0,
      inningsResult: null,
      target: null,
      createdAt: Date.now(),
    };

    this.games.set(code, game);
    this.playerToGame.set(hostId, code);

    return { game, player: host };
  }

  // ─── Join Game ───────────────────────────────────────────────────────────

  joinGame({ gameCode, playerId, playerName }) {
    const game = this.games.get(gameCode);
    if (!game) return { error: 'Game not found' };
    if (game.status !== GAME_STATUS.LOBBY) return { error: 'Game already started' };
    if (Object.keys(game.players).length >= game.maxPlayers) return { error: 'Game is full' };

    // Check if this is a reconnect
    if (game.players[playerId]) {
      return this.reconnectPlayer(game, playerId);
    }

    const player = {
      playerId,
      name: playerName,
      gameCode,
      teamId: null,
      status: PLAYER_STATUS.LOBBY,
      score: 0,
      ballsPlayed: 0,
      isReady: false,
      isConnected: true,
      isHost: false,
    };

    game.players[playerId] = player;
    this.playerToGame.set(playerId, gameCode);

    return { game, player };
  }

  // ─── Team Selection ───────────────────────────────────────────────────────

  joinTeam({ playerId, teamId }) {
    const gameCode = this.playerToGame.get(playerId);
    const game = this.games.get(gameCode);
    if (!game) return { error: 'Game not found' };

    const player = game.players[playerId];
    if (!player) return { error: 'Player not found' };

    const team = game.teams.find((t) => t.teamId === teamId);
    if (!team) return { error: 'Team not found' };
    if (team.players.length >= game.playersPerTeam) return { error: 'Team is full' };

    // Remove from old team if switching
    if (player.teamId) {
      const oldTeam = game.teams.find((t) => t.teamId === player.teamId);
      if (oldTeam) {
        oldTeam.players = oldTeam.players.filter((id) => id !== playerId);
      }
    }

    player.teamId = teamId;
    team.players.push(playerId);

    return { game, player };
  }

  // ─── Ready ────────────────────────────────────────────────────────────────

  setReady({ playerId, isReady }) {
    const gameCode = this.playerToGame.get(playerId);
    const game = this.games.get(gameCode);
    if (!game) return { error: 'Game not found' };

    const player = game.players[playerId];
    if (!player) return { error: 'Player not found' };
    if (!player.teamId) return { error: 'Must join a team first' };

    player.isReady = isReady;
    const allReady = this.checkAllReady(game);

    return { game, allReady };
  }

  checkAllReady(game) {
    const players = Object.values(game.players).filter((p) => p.isConnected);
    if (players.length < game.maxPlayers) return false;
    return players.every((p) => p.isReady && p.teamId !== null);
  }

  // ─── Team Rename ─────────────────────────────────────────────────────────

  renameTeam({ playerId, teamId, newName }) {
    const gameCode = this.playerToGame.get(playerId);
    const game = this.games.get(gameCode);
    if (!game) return { error: 'Game not found' };
    if (game.hostId !== playerId) return { error: 'Only the host can rename teams' };
    if (game.status !== 'LOBBY') return { error: 'Cannot rename after game has started' };

    const trimmed = newName?.trim?.();
    if (!trimmed || trimmed.length < 1) return { error: 'Team name cannot be empty' };
    if (trimmed.length > 20) return { error: 'Team name too long (max 20 chars)' };

    const team = game.teams.find((t) => t.teamId === teamId);
    if (!team) return { error: 'Team not found' };

    team.name = trimmed;
    return { game };
  }


  startGame(hostId) {
    const gameCode = this.playerToGame.get(hostId);
    const game = this.games.get(gameCode);
    if (!game) return { error: 'Game not found' };
    if (game.hostId !== hostId) return { error: 'Only host can start' };
    if (!this.checkAllReady(game)) return { error: 'Not all players ready' };

    game.status = GAME_STATUS.INNINGS_1;
    game.currentInnings = 1;

    // Create matches — Team 0 bats in innings 1
    const matches = this.createMatches(game, 1);
    game.matches = matches;

    // Set player statuses
    matches.forEach((m) => {
      game.players[m.battingPlayerId].status = PLAYER_STATUS.BATTING;
      game.players[m.bowlingPlayerId].status = PLAYER_STATUS.BOWLING;
    });

    return { game, matches };
  }

  createMatches(game, innings) {
    const battingTeamIndex = innings === 1 ? 0 : 1;
    const bowlingTeamIndex = innings === 1 ? 1 : 0;
    const battingTeam = game.teams[battingTeamIndex];
    const bowlingTeam = game.teams[bowlingTeamIndex];

    const matches = [];
    for (let i = 0; i < game.playersPerTeam; i++) {
      const battingPlayerId = battingTeam.players[i];
      const bowlingPlayerId = bowlingTeam.players[i];
      matches.push({
        matchId: uuidv4(),
        gameCode: game.gameCode,
        innings,
        battingTeamId: battingTeam.teamId,
        bowlingTeamId: bowlingTeam.teamId,
        battingPlayerId,
        bowlingPlayerId,
        status: 'ACTIVE',
        ballHistory: [],
        pendingBat: null,
        pendingBowl: null,
      });
    }
    return matches;
  }

  // ─── Ball Submission ──────────────────────────────────────────────────────

  submitBall({ playerId, number }) {
    const gameCode = this.playerToGame.get(playerId);
    const game = this.games.get(gameCode);
    if (!game) return { error: 'Game not found' };

    const player = game.players[playerId];
    if (!player) return { error: 'Player not found' };

    // Find the active match for this player
    const match = game.matches.find(
      (m) =>
        m.status === 'ACTIVE' &&
        (m.battingPlayerId === playerId || m.bowlingPlayerId === playerId),
    );
    if (!match) return { error: 'No active match found' };

    const isBatting = match.battingPlayerId === playerId;

    // Prevent duplicate submissions
    if (isBatting && match.pendingBat !== null) return { error: 'Already submitted' };
    if (!isBatting && match.pendingBowl !== null) return { error: 'Already submitted' };

    if (isBatting) {
      match.pendingBat = number;
    } else {
      match.pendingBowl = number;
    }

    // If both submitted, resolve
    if (match.pendingBat !== null && match.pendingBowl !== null) {
      return this.resolveBall(game, match);
    }

    return { waiting: true, match };
  }

  resolveBall(game, match) {
    const { resolveBall: resolve } = require('./GameRules');
    const result = resolve(match.pendingBat, match.pendingBowl);

    const ball = {
      batNumber: match.pendingBat,
      bowlNumber: match.pendingBowl,
      runs: result.runs,
      isOut: result.isOut,
      timestamp: Date.now(),
    };

    match.ballHistory.push(ball);
    match.pendingBat = null;
    match.pendingBowl = null;

    const battingPlayer = game.players[match.battingPlayerId];

    if (result.isOut) {
      battingPlayer.status = PLAYER_STATUS.SPECTATING;
      battingPlayer.score = battingPlayer.score; // stays same
      match.status = 'FINISHED';

      // Update team score
      this.recalcTeamScores(game);

      // Check if innings is over
      const inningsOver = this.checkInningsOver(game);
      if (inningsOver) {
        return this.handleInningsEnd(game, match, ball, result);
      }

      return { ball, result, match, game, matchFinished: true, inningsOver: false };
    } else {
      battingPlayer.score += result.runs;
      this.recalcTeamScores(game);

      // Check if chasing team has already won
      if (game.currentInnings === 2 && game.target !== null) {
        const battingTeam = game.teams.find((t) => t.teamId === match.battingTeamId);
        if (battingTeam && battingTeam.totalScore >= game.target) {
          return this.handleGameOver(game, match, ball, result, battingTeam.teamId);
        }
      }

      return { ball, result, match, game, matchFinished: false };
    }
  }

  recalcTeamScores(game) {
    game.teams.forEach((team) => {
      team.totalScore = team.players.reduce((sum, pid) => {
        return sum + (game.players[pid]?.score || 0);
      }, 0);
    });
  }

  checkInningsOver(game) {
    return game.matches
      .filter((m) => m.innings === game.currentInnings)
      .every((m) => m.status === 'FINISHED');
  }

  handleInningsEnd(game, match, ball, result) {
    if (game.currentInnings === 1) {
      const battingTeam = game.teams[0]; // team that batted in innings 1
      game.target = battingTeam.totalScore + 1;
      game.status = GAME_STATUS.INNINGS_BREAK;
      game.inningsResult = { innings: 1, score: battingTeam.totalScore, target: game.target };
      return { ball, result, match, game, matchFinished: true, inningsOver: true, inningsBreak: true };
    } else {
      // Game over — determine winner
      const team0 = game.teams[0];
      const team1 = game.teams[1];
      let winnerId = null;
      if (team1.totalScore >= game.target) {
        winnerId = team1.teamId;
      } else {
        winnerId = team0.teamId;
      }
      return this.handleGameOver(game, match, ball, result, winnerId);
    }
  }

  startSecondInnings(hostId) {
    const gameCode = this.playerToGame.get(hostId);
    const game = this.games.get(gameCode);
    if (!game) return { error: 'Game not found' };

    game.status = GAME_STATUS.INNINGS_2;
    game.currentInnings = 2;

    // Reset player scores for innings 2 tracking? No — accumulate.
    // Create new matches with swapped roles
    const newMatches = this.createMatches(game, 2);
    game.matches.push(...newMatches);

    newMatches.forEach((m) => {
      game.players[m.battingPlayerId].status = PLAYER_STATUS.BATTING;
      game.players[m.bowlingPlayerId].status = PLAYER_STATUS.BOWLING;
    });

    return { game, matches: newMatches };
  }

  handleGameOver(game, match, ball, result, winnerTeamId) {
    game.status = GAME_STATUS.FINISHED;
    game.winnerTeamId = winnerTeamId;
    const winnerTeam = game.teams.find((t) => t.teamId === winnerTeamId);
    return {
      ball, result, match, game,
      matchFinished: true, inningsOver: true, gameOver: true,
      winnerTeamId, winnerTeamName: winnerTeam?.name,
    };
  }

  // ─── Disconnect / Reconnect ───────────────────────────────────────────────

  disconnectPlayer(playerId) {
    const gameCode = this.playerToGame.get(playerId);
    const game = this.games.get(gameCode);
    if (!game) return null;

    const player = game.players[playerId];
    if (!player) return null;

    player.isConnected = false;
    player.disconnectedAt = Date.now();

    // Transfer host if needed
    let newHostId = null;
    if (player.isHost) {
      newHostId = this.transferHost(game, playerId);
    }

    // Set reconnect window
    const timer = setTimeout(() => {
      this.handleReconnectTimeout(playerId, gameCode);
    }, 30000); // 30 second window
    this.reconnectTimers.set(playerId, timer);

    return { game, player, newHostId };
  }

  reconnectPlayer(game, playerId) {
    const player = game.players[playerId];
    if (!player) return { error: 'Player not found in game' };

    // Cancel the reconnect timer
    const timer = this.reconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(playerId);
    }

    player.isConnected = true;
    player.disconnectedAt = null;

    return { game, player, reconnected: true };
  }

  handleReconnectTimeout(playerId, gameCode) {
    const game = this.games.get(gameCode);
    if (!game) return;

    const player = game.players[playerId];
    if (!player || player.isConnected) return;

    player.status = PLAYER_STATUS.DISCONNECTED;

    // If player was in active match, finish the match
    const match = game.matches.find(
      (m) =>
        m.status === 'ACTIVE' &&
        (m.battingPlayerId === playerId || m.bowlingPlayerId === playerId),
    );
    if (match) {
      match.status = 'ABANDONED';
    }
  }

  transferHost(game, leavingHostId) {
    const connected = Object.values(game.players).filter(
      (p) => p.isConnected && p.playerId !== leavingHostId,
    );
    if (connected.length === 0) return null;

    const newHost = connected[0];
    newHost.isHost = true;
    game.hostId = newHost.playerId;

    game.players[leavingHostId].isHost = false;
    return newHost.playerId;
  }

  // ─── Spectator helpers ────────────────────────────────────────────────────

  getSpectatorView(gameCode) {
    const game = this.games.get(gameCode);
    if (!game) return null;
    return {
      game,
      activeMatches: game.matches.filter((m) => m.status === 'ACTIVE'),
      teams: game.teams,
    };
  }

  getGameByPlayer(playerId) {
    const gameCode = this.playerToGame.get(playerId);
    return gameCode ? this.games.get(gameCode) : null;
  }

  cleanupGame(gameCode) {
    const game = this.games.get(gameCode);
    if (!game) return;
    Object.keys(game.players).forEach((pid) => {
      this.playerToGame.delete(pid);
      const t = this.reconnectTimers.get(pid);
      if (t) { clearTimeout(t); this.reconnectTimers.delete(pid); }
    });
    this.games.delete(gameCode);
  }
}

module.exports = { GameManager, GAME_STATUS, PLAYER_STATUS };
