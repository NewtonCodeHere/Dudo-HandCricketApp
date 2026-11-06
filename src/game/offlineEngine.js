/**
 * Offline game state engine.
 * Manages a complete offline game between a player and bot.
 */

import { resolveBall, getBotNumber, calculateTarget, hasChaserWon } from './gameRules';

export const GAME_PHASE = {
  SETUP: 'SETUP',
  TOSS: 'TOSS',
  BATTING: 'BATTING',
  BOWLING: 'BOWLING',
  INNINGS_BREAK: 'INNINGS_BREAK',
  CHASING: 'CHASING',
  GAME_OVER: 'GAME_OVER',
};

export const BALL_STATE = {
  WAITING: 'WAITING',
  PLAYER_SELECTED: 'PLAYER_SELECTED',
  RESOLVING: 'RESOLVING',
  RESOLVED: 'RESOLVED',
};

/**
 * Create initial game state.
 */
export function createOfflineGame({ difficulty = 'medium', playerBatsFirst = true, overs = 1 } = {}) {
  const parsedOvers = (overs && !isNaN(overs) && overs > 0) ? parseInt(overs, 10) : null;
  const maxBalls = parsedOvers ? parsedOvers * 6 : null;

  return {
    difficulty,
    phase: GAME_PHASE.BATTING,
    playerBatsFirst,
    overs: parsedOvers,
    maxBalls,
    // Scores
    playerScore: 0,
    botScore: 0,
    playerInnings1: 0,
    botInnings1: 0,
    // Innings tracking
    currentInnings: 1,
    playerIsOut: false,
    botIsOut: false,
    oversCompleted: false,
    // Ball state
    ballState: BALL_STATE.WAITING,
    lastBall: null,
    ballHistory: [],
    // Bot history for AI
    playerHistory: [],
    // Chasing
    target: null,
    // Result
    winner: null,
    winMessage: '',
  };
}

/**
 * Process a ball given the player's choice.
 * Returns the new game state.
 */
export function processBall(state, playerNumber) {
  if (state.ballState !== BALL_STATE.WAITING) return state;
  if (state.phase === GAME_PHASE.GAME_OVER) return state;

  const isPlayerBatting =
    (state.currentInnings === 1 && state.playerBatsFirst) ||
    (state.currentInnings === 2 && !state.playerBatsFirst);

  const botNumber = getBotNumber(state.difficulty, state.botScore, state.playerHistory);

  let batNumber, bowlNumber;
  if (isPlayerBatting) {
    batNumber = playerNumber;
    bowlNumber = botNumber;
  } else {
    batNumber = botNumber;
    bowlNumber = playerNumber;
  }

  const result = resolveBall(batNumber, bowlNumber);

  const newPlayerHistory = isPlayerBatting
    ? [...state.playerHistory, playerNumber]
    : state.playerHistory;

  const ball = {
    batNumber,
    bowlNumber,
    isPlayerBatting,
    runs: result.runs,
    isOut: result.isOut,
    playerChoice: playerNumber,
    botChoice: botNumber,
  };

  let newState = {
    ...state,
    ballState: BALL_STATE.RESOLVED,
    lastBall: ball,
    ballHistory: [...state.ballHistory, ball],
    playerHistory: newPlayerHistory,
  };

  if (isPlayerBatting) {
    newState.playerScore = state.playerScore + result.runs;
  } else {
    newState.botScore = state.botScore + result.runs;
  }

  if (result.isOut) {
    newState = handleOut(newState, isPlayerBatting);
  } else if (state.target !== null && hasChaserWon(isPlayerBatting ? newState.playerScore : newState.botScore, state.target)) {
    // Chasing team has reached the target!
    newState = endGame(newState, isPlayerBatting ? 'player' : 'bot');
  } else if (state.maxBalls && newState.ballHistory.length >= state.maxBalls) {
    // Overs limit reached for this innings!
    newState = handleOversComplete(newState, isPlayerBatting);
  }

  return newState;
}

function handleOversComplete(state, wasPlayerBatting) {
  if (state.currentInnings === 1) {
    const inningsScore = wasPlayerBatting ? state.playerScore : state.botScore;
    const target = calculateTarget(inningsScore);

    return {
      ...state,
      phase: GAME_PHASE.INNINGS_BREAK,
      currentInnings: 2,
      playerInnings1: wasPlayerBatting ? state.playerScore : 0,
      botInnings1: !wasPlayerBatting ? state.botScore : 0,
      target,
      oversCompleted: true,
      ballHistory: [],
      playerHistory: [],
    };
  } else {
    // Second innings overs complete
    const chaserScore = wasPlayerBatting ? state.playerScore : state.botScore;
    const target = state.target;
    const chaserWon = hasChaserWon(chaserScore, target);
    const winner = chaserWon
      ? (wasPlayerBatting ? 'player' : 'bot')
      : (chaserScore === target - 1 ? 'tie' : (wasPlayerBatting ? 'bot' : 'player'));
    return endGame(state, winner);
  }
}

function handleOut(state, wasPlayerBatting) {
  if (state.currentInnings === 1) {
    // First innings over — switch
    const inningsScore = wasPlayerBatting ? state.playerScore : state.botScore;
    const target = calculateTarget(inningsScore);

    if (wasPlayerBatting) {
      return {
        ...state,
        phase: GAME_PHASE.INNINGS_BREAK,
        currentInnings: 2,
        playerInnings1: state.playerScore,
        botInnings1: 0,
        target,
        playerIsOut: true,
        ballHistory: [],
        playerHistory: [],
      };
    } else {
      return {
        ...state,
        phase: GAME_PHASE.INNINGS_BREAK,
        currentInnings: 2,
        botInnings1: state.botScore,
        playerInnings1: 0,
        target,
        botIsOut: true,
        ballHistory: [],
        playerHistory: [],
      };
    }
  } else {
    // Second innings — check who wins
    const chaserScore = wasPlayerBatting ? state.playerScore : state.botScore;
    const target = state.target;
    const chaserWon = hasChaserWon(chaserScore, target);
    return endGame(state, chaserWon ? (wasPlayerBatting ? 'player' : 'bot') : (wasPlayerBatting ? 'bot' : 'player'));
  }
}

function endGame(state, winner) {
  let winMessage = '';
  if (winner === 'player') {
    winMessage = '🏆 You Win!';
  } else if (winner === 'bot') {
    winMessage = '🤖 Bot Wins!';
  } else {
    winMessage = "🤝 It's a Tie!";
  }
  return {
    ...state,
    phase: GAME_PHASE.GAME_OVER,
    winner,
    winMessage,
  };
}

/**
 * Advance to second innings (called after player acknowledges innings break).
 */
export function startSecondInnings(state) {
  return {
    ...state,
    phase: GAME_PHASE.CHASING,
    ballState: BALL_STATE.WAITING,
  };
}

/**
 * Reset ball state for next ball.
 */
export function readyForNextBall(state) {
  return {
    ...state,
    ballState: BALL_STATE.WAITING,
    lastBall: null,
  };
}

export function isPlayerBatting(state) {
  return (
    (state.currentInnings === 1 && state.playerBatsFirst) ||
    (state.currentInnings === 2 && !state.playerBatsFirst)
  );
}
