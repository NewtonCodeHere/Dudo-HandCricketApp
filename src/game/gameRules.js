/**
 * Core Hand Cricket game rules — shared between offline and online modes.
 * Pure functions, no UI dependencies.
 */

export const FINGER_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export const FINGER_EMOJIS = {
  1: '☝️',
  2: '✌️',
  3: '🤟',
  4: '🖖',
  5: '🖐️',
  6: '🤙',
  7: '🤙✌️',
  8: '🤙🤟',
  9: '🤙🖖',
  10: '🙌',
};

/**
 * Resolve a single ball.
 * @param {number} batNumber - Number chosen by batsman (1-10)
 * @param {number} bowlNumber - Number chosen by bowler (1-10)
 * @returns {{ runs: number, isOut: boolean }}
 */
export function resolveBall(batNumber, bowlNumber) {
  if (batNumber === bowlNumber) {
    return { runs: 0, isOut: true };
  }
  return { runs: batNumber, isOut: false };
}

/**
 * Generate a random bot number (1-10).
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @param {number} currentBatScore - current batsman score (for adaptive bot)
 * @param {number[]} history - history of batsman choices
 */
export function getBotNumber(difficulty = 'medium', currentBatScore = 0, history = []) {
  switch (difficulty) {
    case 'easy':
      // Bot picks randomly, low intelligence
      return Math.floor(Math.random() * 10) + 1;

    case 'medium': {
      // Bot sometimes tries to match the last batsman choice
      if (history.length > 0 && Math.random() < 0.25) {
        return history[history.length - 1];
      }
      return Math.floor(Math.random() * 10) + 1;
    }

    case 'hard': {
      // Bot is more adaptive — tracks frequency and tries to match
      if (history.length === 0) {
        return Math.floor(Math.random() * 10) + 1;
      }

      // Build frequency map
      const freq = {};
      history.forEach((n) => {
        freq[n] = (freq[n] || 0) + 1;
      });

      // Sort by frequency descending
      const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);

      // 40% chance to pick the most frequent number
      if (Math.random() < 0.4) {
        return parseInt(sorted[0][0]);
      }
      // 30% chance to pick the second most frequent
      if (sorted.length > 1 && Math.random() < 0.3) {
        return parseInt(sorted[1][0]);
      }
      return Math.floor(Math.random() * 10) + 1;
    }

    default:
      return Math.floor(Math.random() * 10) + 1;
  }
}

/**
 * Check if innings is complete.
 */
export function isInningsComplete(playerState) {
  return playerState.isOut;
}

/**
 * Determine match winner.
 * @param {number} team1Score
 * @param {number} team2Score
 * @returns {'team1' | 'team2' | 'tie'}
 */
export function determineWinner(team1Score, team2Score) {
  if (team1Score > team2Score) return 'team1';
  if (team2Score > team1Score) return 'team2';
  return 'tie';
}

/**
 * Check if chasing team has won.
 */
export function hasChaserWon(chaserScore, target) {
  return chaserScore >= target;
}

/**
 * Calculate target score.
 */
export function calculateTarget(firstInningsScore) {
  return firstInningsScore + 1;
}
