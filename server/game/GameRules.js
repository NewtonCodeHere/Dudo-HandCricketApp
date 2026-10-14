/**
 * Shared Hand Cricket game rules — identical logic on both server and client.
 * Pure functions only — no I/O, no state.
 */

function resolveBall(batNumber, bowlNumber) {
  if (batNumber === bowlNumber) {
    return { runs: 0, isOut: true };
  }
  return { runs: batNumber, isOut: false };
}

function generateGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'HC';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function calculateTarget(firstInningsScore) {
  return firstInningsScore + 1;
}

function isValidPlayerCount(totalPlayers, teamCount) {
  return totalPlayers >= 2 && teamCount >= 2 && totalPlayers % teamCount === 0;
}

module.exports = { resolveBall, generateGameCode, calculateTarget, isValidPlayerCount };
