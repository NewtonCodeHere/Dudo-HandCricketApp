import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Animated, Share, TextInput, Alert, Clipboard,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';
import { useLobby } from '../networking/hooks';
import { SOCKET_EVENTS } from '../networking/config';
import SocketClient from '../networking/socket';

export default function LobbyScreen({ route, navigation }) {
  const { game: initialGame, player: initialPlayer, isHost: initialIsHost } = route.params;
  const Colors = useColors();
  const { isDark } = useTheme();
  const [game, setGame] = useState(initialGame);
  const [myPlayer, setMyPlayer] = useState(initialPlayer);
  const [isHost, setIsHost] = useState(initialIsHost);
  const [codeCopied, setCodeCopied] = useState(false);

  const [editingTeamId, setEditingTeamId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { joinTeam, setReady, startGame, subscribe } = useLobby();

  const teamColorsList = [Colors.teamA, Colors.teamB, Colors.accentGreen, Colors.accentGold];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const unsubLobby = subscribe(SOCKET_EVENTS.LOBBY_UPDATED, ({ game: g }) => {
      setGame(g);
      if (g.players[myPlayer.playerId]) setMyPlayer(g.players[myPlayer.playerId]);
    });
    const unsubStarted = subscribe(SOCKET_EVENTS.GAME_STARTED, ({ game: g, matches }) => {
      navigation.replace('OnlineGame', { game: g, matches, myPlayerId: myPlayer.playerId, isHost });
    });
    const unsubYouHost = subscribe(SOCKET_EVENTS.YOU_ARE_HOST, () => {
      setIsHost(true);
      setMyPlayer((p) => ({ ...p, isHost: true }));
    });
    return () => { unsubLobby(); unsubStarted(); unsubYouHost(); };
  }, [navigation, subscribe, myPlayer.playerId, isHost]);

  const handleCopyCode = useCallback(async () => {
    Clipboard.setString(game.gameCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [game.gameCode]);

  const handleShare = useCallback(async () => {
    await Share.share({ message: `Join my DUDO Hand Cricket match! Room Code: ${game.gameCode}` });
  }, [game.gameCode]);

  const handleJoinTeam = useCallback((teamId) => {
    joinTeam(teamId);
  }, [joinTeam]);

  const handleReady = useCallback(() => {
    setReady(!myPlayer.isReady);
  }, [myPlayer.isReady, setReady]);

  const handleStartGame = useCallback(() => {
    const totalPlayers = Object.keys(game.players).length;
    if (totalPlayers < game.maxPlayers) {
      Alert.alert('Waiting for players', `Need ${game.maxPlayers} players to begin match. Currently ${totalPlayers}.`);
      return;
    }
    startGame();
  }, [game, startGame]);

  const handleStartRename = (team) => {
    setEditingTeamId(team.teamId);
    setRenameValue(team.name);
  };

  const handleConfirmRename = () => {
    if (!renameValue.trim()) { setEditingTeamId(null); return; }
    SocketClient.emit(SOCKET_EVENTS.RENAME_TEAM, { teamId: editingTeamId, newName: renameValue.trim() });
    setEditingTeamId(null);
  };

  const handleCancelRename = () => setEditingTeamId(null);

  const allPlayers = Object.values(game.players || {});
  const totalJoined = allPlayers.length;
  const totalReady = allPlayers.filter((p) => p.isReady).length;
  const allReady = totalJoined >= game.maxPlayers && totalReady === totalJoined;

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} backgroundColor={Colors.background} />
      <LinearGradient colors={Colors.gradientBg} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: Colors.danger }]}>✕ Leave</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>MATCH LOBBY</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Game code card */}
        <View style={[styles.codeCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.borderGlow, shadowColor: Colors.shadow }]}>
          <Text style={[styles.codeLabel, { color: Colors.textMuted }]}>ROOM CODE</Text>
          <Text style={[styles.codeText, { color: Colors.primary }]}>{game.gameCode}</Text>
          <View style={styles.codeActions}>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={[styles.codeBtn, { backgroundColor: Colors.primaryTint, borderColor: Colors.borderLight }]}
            >
              <Text style={[styles.codeBtnText, { color: Colors.primary }]}>
                {codeCopied ? '✓ Copied' : '📋 Copy Code'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.codeBtn, { backgroundColor: Colors.primaryTint, borderColor: Colors.borderLight }]}
            >
              <Text style={[styles.codeBtnText, { color: Colors.primary }]}>📤 Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.playerCount, { color: Colors.textMuted }]}>
            {totalJoined}/{game.maxPlayers} players assembled
          </Text>
        </View>

        {/* Teams */}
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>TEAMS</Text>

        {game.teams.map((team, ti) => {
          const teamColor = teamColorsList[ti % teamColorsList.length];
          const isMyTeam = myPlayer?.teamId === team.teamId;
          const isFull = team.players.length >= game.playersPerTeam;
          const isEditing = editingTeamId === team.teamId;

          return (
            <View
              key={team.teamId}
              style={[
                styles.teamCard,
                {
                  backgroundColor: Colors.backgroundCard,
                  borderColor: isMyTeam ? teamColor : Colors.border,
                  borderWidth: isMyTeam ? 2 : 1,
                  shadowColor: Colors.shadow,
                },
              ]}
            >
              {/* Team header */}
              <View style={[styles.teamHeader, { backgroundColor: teamColor + (isDark ? '20' : '15') }]}>
                <View style={[styles.teamDot, { backgroundColor: teamColor }]} />

                {isEditing ? (
                  <View style={styles.renameRow}>
                    <TextInput
                      value={renameValue}
                      onChangeText={setRenameValue}
                      maxLength={20}
                      autoFocus
                      style={[
                        styles.renameInput,
                        {
                          color: teamColor,
                          borderBottomColor: teamColor,
                          backgroundColor: Colors.backgroundCard,
                        },
                      ]}
                      onSubmitEditing={handleConfirmRename}
                    />
                    <TouchableOpacity onPress={handleConfirmRename} style={styles.renameConfirmBtn}>
                      <Text style={{ color: Colors.success, fontWeight: '700' }}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCancelRename} style={styles.renameConfirmBtn}>
                      <Text style={{ color: Colors.danger, fontWeight: '700' }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.teamNameRow}>
                    <Text style={[styles.teamName, { color: teamColor }]}>{team.name}</Text>
                    {isHost && (
                      <TouchableOpacity onPress={() => handleStartRename(team)} style={styles.editNameBtn}>
                        <Text style={{ color: Colors.textMuted, fontSize: 12 }}>✏️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[styles.teamCount, { color: teamColor }]}>
                    {team.players.length}/{game.playersPerTeam}
                  </Text>
                  {isMyTeam && (
                    <View style={[styles.youBadge, { backgroundColor: teamColor }]}>
                      <Text style={styles.youBadgeText}>YOU</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Player list */}
              {team.players.map((pid) => {
                const p = game.players[pid];
                if (!p) return null;
                const isMe = pid === myPlayer.playerId;
                return (
                  <View
                    key={pid}
                    style={[
                      styles.playerRow,
                      { borderBottomColor: Colors.border },
                      isMe && { backgroundColor: teamColor + '10' },
                    ]}
                  >
                    <Text style={[styles.playerAvatar, { color: teamColor }]}>👤</Text>
                    <Text style={[styles.playerName, { color: Colors.textPrimary }]}>
                      {p.name}{isMe ? ' (You)' : ''}
                    </Text>
                    {p.isHost && (
                      <View style={[styles.hostBadge, { borderColor: Colors.accentGold }]}>
                        <Text style={[styles.hostBadgeText, { color: Colors.accentGold }]}>👑 HOST</Text>
                      </View>
                    )}
                    <Text style={{ marginLeft: 'auto', color: p.isReady ? Colors.success : Colors.textMuted, fontWeight: '700' }}>
                      {p.isReady ? '✓' : '○'}
                    </Text>
                  </View>
                );
              })}

              {/* Join button */}
              {!isMyTeam && !isFull && (
                <TouchableOpacity
                  onPress={() => handleJoinTeam(team.teamId)}
                  style={[styles.joinBtn, { borderColor: teamColor }]}
                >
                  <Text style={[styles.joinBtnText, { color: teamColor }]}>+ Join {team.name}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Ready button */}
        <TouchableOpacity
          onPress={handleReady}
          style={[
            styles.readyBtn,
            {
              backgroundColor: myPlayer?.isReady ? Colors.primary : Colors.backgroundCard,
              borderColor: myPlayer?.isReady ? Colors.primary : Colors.border,
              shadowColor: Colors.shadow,
            },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.readyBtnText, { color: myPlayer?.isReady ? '#FFFFFF' : Colors.textSecondary }]}>
            {myPlayer?.isReady ? '✓ READY TO PLAY' : 'READY UP'}
          </Text>
        </TouchableOpacity>

        {/* Start game (host only) */}
        {isHost && (
          <TouchableOpacity onPress={handleStartGame} activeOpacity={0.85} style={[styles.startBtnWrapper, { shadowColor: Colors.shadow }]}>
            <LinearGradient
              colors={allReady ? Colors.primaryGradient : [Colors.backgroundElevated, Colors.backgroundElevated]}
              style={styles.startBtn}
            >
              <Text style={[styles.startBtnText, { color: allReady ? '#FFFFFF' : Colors.textMuted }]}>
                START MATCH ›
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Status */}
        <Animated.View style={[styles.statusRow, { opacity: pulseAnim }]}>
          <Text style={[styles.statusText, { color: Colors.textMuted }]}>
            ⏳ Waiting for players... ({totalJoined}/{game.maxPlayers})
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 52, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xl, borderBottomWidth: 1,
  },
  backBtn: { width: 60 },
  backText: { fontSize: Typography.base, fontWeight: '600' },
  headerTitle: { fontSize: Typography.md, fontWeight: '900', letterSpacing: 3 },
  scroll: { padding: Spacing.xl, paddingBottom: 60 },

  codeCard: {
    borderRadius: BorderRadius['2xl'], borderWidth: 1.5,
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  codeLabel: { fontSize: Typography.xs, fontWeight: '700', letterSpacing: 2, marginBottom: Spacing.xs },
  codeText: { fontSize: 38, fontWeight: '900', letterSpacing: 6, marginBottom: Spacing.md },
  codeActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
  },
  codeBtnText: { fontSize: Typography.sm, fontWeight: '700' },
  playerCount: { fontSize: Typography.xs, fontWeight: '600' },

  sectionTitle: { fontSize: Typography.xs, fontWeight: '700', letterSpacing: 2, marginBottom: Spacing.md },
  teamCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  teamHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  teamDot: { width: 10, height: 10, borderRadius: 5 },
  teamNameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  teamName: { fontSize: Typography.md, fontWeight: '700' },
  editNameBtn: { padding: 4 },
  renameRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  renameInput: {
    flex: 1, fontSize: Typography.md, fontWeight: '700',
    borderBottomWidth: 2, paddingVertical: 2, paddingHorizontal: 4,
  },
  renameConfirmBtn: { padding: Spacing.sm },
  teamCount: { fontSize: Typography.sm, fontWeight: '700' },
  youBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  youBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, gap: Spacing.sm,
  },
  playerAvatar: { fontSize: 16 },
  playerName: { fontSize: Typography.base, flex: 1 },
  hostBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  hostBadgeText: { fontSize: 10, fontWeight: '700' },
  joinBtn: { margin: Spacing.lg, borderWidth: 1.5, borderRadius: BorderRadius.full, padding: Spacing.md, alignItems: 'center', borderStyle: 'dashed' },
  joinBtnText: { fontSize: Typography.sm, fontWeight: '700' },
  readyBtn: {
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  readyBtnText: { fontSize: Typography.base, fontWeight: '900', letterSpacing: 1.5 },
  startBtnWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  startBtn: { padding: Spacing.lg, alignItems: 'center' },
  startBtnText: { fontSize: Typography.base, fontWeight: '900', letterSpacing: 1 },
  statusRow: { alignItems: 'center', marginTop: Spacing.lg },
  statusText: { fontSize: Typography.sm },
});
