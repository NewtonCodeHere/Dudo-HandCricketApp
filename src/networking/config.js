/**
 * Server configuration.
 * Supports dynamic configuration via SettingsScreen or custom server hosting.
 */

import { Platform } from 'react-native';

const DEFAULT_LAN_IP = '10.158.104.23';
let runtimeServerUrl = null;

export function setCustomServerUrl(url) {
  if (url && typeof url === 'string') {
    let cleaned = url.trim();
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = `http://${cleaned}`;
    }
    runtimeServerUrl = cleaned;
  } else {
    runtimeServerUrl = null;
  }
}

export function getServerUrl() {
  if (runtimeServerUrl) return runtimeServerUrl;
  return Platform.OS === 'web'
    ? 'http://localhost:3001'
    : `http://${DEFAULT_LAN_IP}:3001`;
}

export const SERVER_URL = getServerUrl();

export const SOCKET_EVENTS = {
  // Outbound (client → server)
  CREATE_GAME: 'CREATE_GAME',
  JOIN_GAME: 'JOIN_GAME',
  JOIN_TEAM: 'JOIN_TEAM',
  RENAME_TEAM: 'RENAME_TEAM',
  SET_READY: 'SET_READY',
  START_GAME: 'START_GAME',
  SUBMIT_BALL: 'SUBMIT_BALL',
  START_SECOND_INNINGS: 'START_SECOND_INNINGS',
  GET_SPECTATOR_VIEW: 'GET_SPECTATOR_VIEW',

  // Inbound (server → client)
  GAME_CREATED: 'GAME_CREATED',
  GAME_JOINED: 'GAME_JOINED',
  TEAM_JOINED: 'TEAM_JOINED',
  LOBBY_UPDATED: 'LOBBY_UPDATED',
  GAME_STARTED: 'GAME_STARTED',
  BALL_SUBMITTED: 'BALL_SUBMITTED',
  OPPONENT_SUBMITTED: 'OPPONENT_SUBMITTED',
  BALL_RESOLVED: 'BALL_RESOLVED',
  MATCH_FINISHED: 'MATCH_FINISHED',
  INNINGS_BREAK: 'INNINGS_BREAK',
  SECOND_INNINGS_STARTED: 'SECOND_INNINGS_STARTED',
  GAME_OVER: 'GAME_OVER',
  SPECTATOR_VIEW: 'SPECTATOR_VIEW',
  PLAYER_DISCONNECTED: 'PLAYER_DISCONNECTED',
  PLAYER_RECONNECTED: 'PLAYER_RECONNECTED',
  RECONNECTED: 'RECONNECTED',
  YOU_ARE_HOST: 'YOU_ARE_HOST',
  ERROR: 'ERROR',
};
