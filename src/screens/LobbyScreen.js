import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, Animated, Share, Clipboard, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Typography, Spacing, BorderRadius } from '../theme/tokens';
import { useColors, useTheme } from '../theme/ThemeContext';
import { useLobby } from '../networking/hooks';
import { SOCKET_EVENTS } from '../networking/config';
import SocketClient from '../networking/socket';

const TEAM_COLOR_LIST = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFD700'];

export default function LobbyScreen({ route, navigation }) {
  const { game: initialGame, player: initialPlayer, isHost: initialIsHost } = route.params;
  const Colors = useColors();
  const { isDark } = useTheme();
  const [game, setGame] = useState(initialGame);
  const [myPlayer, setMyPlayer] = useState(initialPlayer);
  const [isHost, setIsHost] = useState(initialIsHost);
  const [codeCopied, setCodeCopied] = useState(false);

  // Team rename state — one per team
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const { joinTeam, setReady, startGame, subscribe } = useLobby();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyCode = useCallback(async () => {
    Clipboard.setString(game.gameCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }, [game.gameCode]);

  const handleShare = useCallback(async () => {
    await Share.share({ message: `Join my Hand Cricket game! Code: ${game.gameCode}` });
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
      Alert.alert('Not enough players', `Need ${game.maxPlayers} players to start. Currently ${totalPlayers}.`);
      return;
    }
    startGame();
  }, [game, startGame]);

  // ── Team rename handlers ──────────────────────────────────────────────────
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

  const bgColors = isDark ? ['#0A0A1A', '#12122A'] : ['#F4F4FF', '#EEEEFF'];

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle={Colors.statusBar} />
      <LinearGradient colors={bgColors} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: Colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: Colors.danger }]}>✕ Leave</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors.textPrimary }]}>LOBBY</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Game code card */}
        <View style={[styles.codeCard, { backgroundColor: Colors.backgroundCard, borderColor: Colors.primary + '44' }]}>
          <Text style={[styles.codeLabel, { color: Colors.textMuted }]}>GAME CODE</Text>
          <Text style={[styles.codeText, { color: Colors.primary }]}>{game.gameCode}</Text>
          <View style={styles.codeActions}>
            <TouchableOpacity
              onPress={handleCopyCode}
              style={[styles.codeBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}
            >
              <Text style={[styles.codeBtnText, { color: Colors.textSecondary }]}>
                {codeCopied ? '✓ Copied' : '📋 Copy'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.codeBtn, { backgroundColor: Colors.backgroundElevated, borderColor: Colors.border }]}
            >
              <Text style={[styles.codeBtnText, { color: Colors.textSecondary }]}>📤 Share</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.playerCount, { color: Colors.textMuted }]}>
            {totalJoined}/{game.maxPlayers} players joined
          </Text>
        </View>

        {/* Teams */}
        <Text style={[styles.sectionTitle, { color: Colors.textMuted }]}>TEAMS</Text>

        {game.teams.map((team, ti) => {
          const teamColor = TEAM_COLOR_LIST[ti % TEAM_COLOR_LIST.length];
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
                  borderColor: isMyTeam ? teamColor + '88' : Colors.border,
                  borderWidth: isMyTeam ? 2 : 1,
                },
              ]}
            >
              {/* Team header */}
              <View style={[styles.teamHeader, { backgroundColor: teamColor + (isDark ? '18' : '10') }]}>
                <View style={[styles.teamDot, { backgroundColor: teamColor }]} />

                {/* Editable team name */}
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
                          backgroundColor: Colors.inputBg,
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
            { backgroundColor: myPlayer?.isReady ? Colors.success + '22' : Colors.backgroundCard, borderColor: myPlayer?.isReady ? Colors.success : Colors.border },
          ]}
          activeOpacity={0.8}
        >
          <Text style={[styles.readyBtnText, { color: myPlayer?.isReady ? Colors.success : Colors.textSecondary }]}>
            {myPlayer?.isReady ? '✓ READY!' : 'TAP TO READY UP'}
          </Text>
        </TouchableOpacity>

        {/* Start game (host only) */}
        {isHost && (
          <TouchableOpacity onPress={handleStartGame} activeOpacity={0.85} style={styles.startBtnWrapper}>
            <LinearGradient
              colors={allReady ? [Colors.success, '#2AAF9F'] : [Colors.backgroundElevated, Colors.backgroundElevated]}
              style={styles.startBtn}
            >
              <Text style={[styles.startBtnText, { color: allReady ? '#fff' : Colors.textMuted }]}>
                🏏 START GAME
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
  headerTitle: { fontSize: Typography.lg, fontWeight: '900', letterSpacing: 3 },
  scroll: { padding: Spacing.xl, paddingBottom: 60 },

  // Code card
  codeCard: {
    borderRadius: BorderRadius.xl, borderWidth: 1.5,
    padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl,
  },
  codeLabel: { fontSize: Typography.xs, fontWeight: '700', letterSpacing: 2, marginBottom: Spacing.sm },
  codeText: { fontSize: 42, fontWeight: '900', letterSpacing: 8, marginBottom: Spacing.lg },
  codeActions: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  codeBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.lg, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, borderWidth: 1 },
  codeBtnText: { fontSize: Typography.sm, fontWeight: '600' },
  playerCount: { fontSize: Typography.sm },

  // Team
  sectionTitle: { fontSize: Typography.xs, fontWeight: '700', letterSpacing: 2, marginBottom: Spacing.md },
  teamCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.md },
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
  youBadgeText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  playerRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, gap: Spacing.sm,
  },
  playerAvatar: { fontSize: 16 },
  playerName: { fontSize: Typography.base, flex: 1 },
  hostBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  hostBadgeText: { fontSize: 10, fontWeight: '700' },
  joinBtn: { margin: Spacing.lg, borderWidth: 1.5, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderStyle: 'dashed' },
  joinBtnText: { fontSize: Typography.base, fontWeight: '700' },
  readyBtn: { borderRadius: BorderRadius.xl, borderWidth: 1.5, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.md },
  readyBtnText: { fontSize: Typography.lg, fontWeight: '900', letterSpacing: 2 },
  startBtnWrapper: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.lg },
  startBtn: { padding: Spacing.lg, alignItems: 'center' },
  startBtnText: { fontSize: Typography.lg, fontWeight: '900', letterSpacing: 1 },
  statusRow: { alignItems: 'center', marginTop: Spacing.lg },
  statusText: { fontSize: Typography.sm },
});
