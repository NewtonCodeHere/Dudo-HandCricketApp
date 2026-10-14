# 🏏 Hand Cricket — Full Stack Mobile Game

## Quick Start

### 1. Start the Backend Server
```bash
cd server
npm start
# Server runs on http://localhost:3001
```

### 2. Start the Mobile App
```bash
# Web (browser)
npm run web

# Android (Expo Go)
npm run android

# iOS (Expo Go)  
npm run ios
```

> **For physical devices:** Edit `src/networking/config.js` and set `LAN_IP` to your computer's local IP address (e.g. `192.168.1.5`).

---

## Project Structure

```
HandCricketApp/
│
├── App.js                          ← Navigation root
│
├── src/
│   ├── game/
│   │   ├── gameRules.js            ← Core rules (shared logic)
│   │   └── offlineEngine.js        ← Offline game state machine
│   │
│   ├── networking/
│   │   ├── config.js               ← Server URL + event names
│   │   ├── socket.js               ← Socket.IO client wrapper
│   │   └── hooks.js                ← React hooks (useLobby, useGameplay)
│   │
│   ├── theme/
│   │   └── tokens.js               ← Colors, typography, spacing
│   │
│   ├── components/
│   │   ├── FingerButton.js         ← Animated 1-10 number buttons
│   │   ├── ScoreBoard.js           ← Live scoreboard
│   │   ├── BallResult.js           ← "+5 RUNS" / "OUT!" overlay
│   │   ├── BallHistory.js          ← Ball-by-ball history strip
│   │   └── Countdown.js            ← 3-2-1-CHOOSE countdown
│   │
│   └── screens/
│       ├── HomeScreen.js
│       ├── OfflineSetupScreen.js
│       ├── OfflineGameScreen.js
│       ├── OnlineSetupScreen.js
│       ├── CreateGameScreen.js
│       ├── JoinGameScreen.js
│       ├── LobbyScreen.js
│       ├── OnlineGameScreen.js
│       ├── OnlineGameOverScreen.js
│       ├── HowToPlayScreen.js
│       └── SettingsScreen.js
│
└── server/
    ├── index.js                    ← Express + Socket.IO server
    ├── game/
    │   ├── GameRules.js            ← Shared game rules
    │   └── GameManager.js          ← Full game lifecycle manager
    └── socket/
        └── socketHandlers.js       ← All Socket.IO event handlers
```

---

## Phases Completed

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Offline mode (vs Bot, 3 difficulties) | ✅ Done |
| 2 | Online lobby (create, join, team selection, ready) | ✅ Done |
| 3 | Single 1v1 online match via WebSocket | ✅ Done |
| 4 | Simultaneous multi-match system | ✅ Done |
| 5 | Team score accumulation + live scoreboard | ✅ Done |
| 6 | Spectator mode (watch when out, switch matches) | ✅ Done |
| 7 | Reconnect/disconnect handling + host transfer | ✅ Done |
| 8 | Full scorecard + animated game-over screen | ✅ Done |
| 9 | Animations, countdowns, spring physics | ✅ Done |

---

## Online Game Flow

```
HOST creates game → shares code (e.g. HC7K92)
   ↓
Players JOIN with code → select TEAM → mark READY
   ↓
HOST clicks START GAME
   ↓
Simultaneous 1v1 matches begin:
   Team A:  A1 ⚔️ B1    (Match 1)
   Team A:  A2 ⚔️ B2    (Match 2)
   Team A:  A3 ⚔️ B3    (Match 3)
   ↓
Each ball: both players submit → server resolves → broadcasts result
   ↓
When OUT → player becomes spectator (can watch other matches)
   ↓
All matches finish → Innings Break → 2nd Innings starts
   ↓
Team 2 chases target → GAME OVER → Winner announced
```

## Anti-Cheat
- Server never reveals opponent's choice until both submit
- Server calculates all scores (client sends number only)
- Duplicate submission prevention per ball
- Player membership validated on every event

## Socket Events Reference

### Client → Server
| Event | Payload |
|-------|---------|
| `CREATE_GAME` | `{ playerName, maxPlayers, teamCount }` |
| `JOIN_GAME` | `{ gameCode, playerName }` |
| `JOIN_TEAM` | `{ teamId }` |
| `SET_READY` | `{ isReady }` |
| `START_GAME` | — |
| `SUBMIT_BALL` | `{ number: 1-10 }` |
| `START_SECOND_INNINGS` | — |

### Server → Client
| Event | When fired |
|-------|-----------|
| `GAME_CREATED` | Host creates game |
| `LOBBY_UPDATED` | Any lobby change |
| `GAME_STARTED` | Host starts game |
| `OPPONENT_SUBMITTED` | Opponent chose (no number) |
| `BALL_RESOLVED` | Both submitted — result revealed |
| `INNINGS_BREAK` | All 1st innings matches done |
| `GAME_OVER` | Winner determined |
| `PLAYER_DISCONNECTED` | Player lost connection |
| `YOU_ARE_HOST` | Host transfer |
