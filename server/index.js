const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { registerSocketHandlers } = require('./socket/socketHandlers');

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  pingTimeout: 10000,
  pingInterval: 5000,
});

// Register all Socket.IO handlers
registerSocketHandlers(io);

// ─── Root status page ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const { gameManager } = require('./socket/socketHandlers');
  const activeGames = gameManager ? gameManager.games.size : 0;
  const activePlayers = gameManager ? gameManager.playerToGame.size : 0;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🏏 Hand Cricket Server</title>
      <meta http-equiv="refresh" content="5">
      <style>
        body { font-family: -apple-system, sans-serif; background: #0A0A1A; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column; }
        .card { background: #12122A; border: 1px solid rgba(108,99,255,0.4); border-radius: 20px; padding: 48px 64px; text-align: center; }
        h1 { font-size: 2.5rem; margin-bottom: 8px; }
        .sub { color: #A8A8C8; margin-bottom: 32px; font-size: 1rem; }
        .badge { background: rgba(78,205,196,0.15); border: 1px solid #4ECDC4; color: #4ECDC4; border-radius: 9999px; padding: 8px 20px; display: inline-block; font-weight: bold; font-size: 0.9rem; margin-bottom: 32px; }
        .stats { display: flex; gap: 32px; justify-content: center; }
        .stat { background: rgba(108,99,255,0.1); border: 1px solid rgba(108,99,255,0.3); border-radius: 12px; padding: 20px 32px; }
        .stat-num { font-size: 2rem; font-weight: 900; color: #6C63FF; }
        .stat-label { color: #A8A8C8; font-size: 0.8rem; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
        .footer { color: #5A5A7A; margin-top: 32px; font-size: 0.8rem; }
        a { color: #6C63FF; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🏏 Hand Cricket</h1>
        <p class="sub">Real-time multiplayer game server</p>
        <div class="badge">● SERVER ONLINE</div>
        <div class="stats">
          <div class="stat">
            <div class="stat-num">${activeGames}</div>
            <div class="stat-label">Active Games</div>
          </div>
          <div class="stat">
            <div class="stat-num">${activePlayers}</div>
            <div class="stat-label">Players Online</div>
          </div>
        </div>
        <p class="footer">Socket.IO endpoint: <a href="/health">http://localhost:3001</a> &nbsp;|&nbsp; Auto-refreshes every 5s</p>
      </div>
    </body>
    </html>
  `);
});

// Health check JSON
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏏 Hand Cricket Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled rejection:', err);
});
