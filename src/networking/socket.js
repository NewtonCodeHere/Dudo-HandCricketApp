import { io } from 'socket.io-client';
import { SERVER_URL } from './config';

let socket = null;
let listeners = new Map(); // event -> Set of callbacks

/**
 * Connect to the server.
 */
export function connect() {
  if (socket && socket.connected) return socket;

  socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id);
    emit('_internal_connected', { id: socket.id });
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
    emit('_internal_disconnected', { reason });
  });

  socket.on('connect_error', (err) => {
    console.log('[Socket] Connection error:', err.message);
    emit('_internal_error', { message: err.message });
  });

  // Forward all server events to local listeners
  const serverEvents = [
    'GAME_CREATED', 'GAME_JOINED', 'TEAM_JOINED', 'LOBBY_UPDATED',
    'GAME_STARTED', 'BALL_SUBMITTED', 'OPPONENT_SUBMITTED', 'BALL_RESOLVED',
    'MATCH_FINISHED', 'INNINGS_BREAK', 'SECOND_INNINGS_STARTED', 'GAME_OVER',
    'SPECTATOR_VIEW', 'PLAYER_DISCONNECTED', 'PLAYER_RECONNECTED', 'RECONNECTED',
    'YOU_ARE_HOST', 'ERROR',
  ];

  serverEvents.forEach((event) => {
    socket.on(event, (data) => {
      emit(event, data);
    });
  });

  return socket;
}

/**
 * Disconnect and clean up.
 */
export function disconnect() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  listeners.clear();
}

/**
 * Send event to server.
 */
export function send(event, data) {
  if (!socket || !socket.connected) {
    console.warn('[Socket] Not connected, cannot send:', event);
    return false;
  }
  socket.emit(event, data);
  return true;
}

/**
 * Subscribe to an event.
 * @returns unsubscribe function
 */
export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);
  return () => off(event, callback);
}

/**
 * Unsubscribe from an event.
 */
export function off(event, callback) {
  if (listeners.has(event)) {
    listeners.get(event).delete(callback);
  }
}

/**
 * Internal emit to local listeners.
 */
function emit(event, data) {
  if (listeners.has(event)) {
    listeners.get(event).forEach((cb) => {
      try { cb(data); } catch (e) { console.error('[Socket] Listener error:', e); }
    });
  }
}

export function getSocketId() {
  return socket?.id || null;
}

export function isConnected() {
  return socket?.connected || false;
}
