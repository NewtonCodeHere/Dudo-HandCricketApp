import { useEffect, useCallback } from 'react';
import * as SocketClient from './socket';
import { SOCKET_EVENTS } from './config';

/**
 * React hook for using the Socket.IO connection.
 * Automatically connects on mount, cleans up on unmount.
 */
export function useSocket() {
  useEffect(() => {
    SocketClient.connect();
    return () => {
      // Don't disconnect on unmount — socket lives for the session
    };
  }, []);

  const subscribe = useCallback((event, callback) => {
    return SocketClient.on(event, callback);
  }, []);

  const send = useCallback((event, data) => {
    return SocketClient.send(event, data);
  }, []);

  return { subscribe, send, isConnected: SocketClient.isConnected, getSocketId: SocketClient.getSocketId };
}

/**
 * Hook for lobby operations.
 */
export function useLobby() {
  const { subscribe, send } = useSocket();

  const createGame = useCallback((playerName, maxPlayers, teamCount) => {
    send(SOCKET_EVENTS.CREATE_GAME, { playerName, maxPlayers, teamCount });
  }, [send]);

  const joinGame = useCallback((gameCode, playerName) => {
    send(SOCKET_EVENTS.JOIN_GAME, { gameCode, playerName });
  }, [send]);

  const joinTeam = useCallback((teamId) => {
    send(SOCKET_EVENTS.JOIN_TEAM, { teamId });
  }, [send]);

  const setReady = useCallback((isReady) => {
    send(SOCKET_EVENTS.SET_READY, { isReady });
  }, [send]);

  const startGame = useCallback(() => {
    send(SOCKET_EVENTS.START_GAME);
  }, [send]);

  return { createGame, joinGame, joinTeam, setReady, startGame, subscribe };
}

/**
 * Hook for gameplay operations.
 */
export function useGameplay() {
  const { subscribe, send } = useSocket();

  const submitBall = useCallback((number) => {
    send(SOCKET_EVENTS.SUBMIT_BALL, { number });
  }, [send]);

  const startSecondInnings = useCallback(() => {
    send(SOCKET_EVENTS.START_SECOND_INNINGS);
  }, [send]);

  const getSpectatorView = useCallback(() => {
    send(SOCKET_EVENTS.GET_SPECTATOR_VIEW);
  }, [send]);

  return { submitBall, startSecondInnings, getSpectatorView, subscribe };
}
