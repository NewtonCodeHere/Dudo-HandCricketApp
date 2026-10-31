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

// ─── Mobile Device Simulator (IDE Side-by-Side Preview) ───────────────────
app.get('/device', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>📱 DUDO Mobile Simulator</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #0d1117;
          color: #c9d1d9;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        /* Top Toolbar inside IDE preview */
        .toolbar {
          position: fixed;
          top: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(22, 27, 34, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(240, 246, 252, 0.1);
          padding: 6px 16px;
          border-radius: 999px;
          z-index: 1000;
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }
        .toolbar-title {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 1px;
          color: #FF5A5F;
        }
        .tool-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: #f0f6fc;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tool-btn:hover {
          background: rgba(255, 90, 95, 0.2);
          border-color: #FF5A5F;
          color: #FF5A5F;
        }

        /* Phone Simulator Container */
        .simulator-stage {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          padding: 50px 10px 10px;
        }

        /* Metallic Smartphone Bezel */
        .phone-frame {
          position: relative;
          width: 390px;
          height: 800px;
          max-height: calc(100vh - 70px);
          background: #111419;
          border-radius: 50px;
          padding: 12px;
          box-shadow:
            0 0 0 2px #474e5d,
            0 0 0 5px #1f242d,
            0 0 0 7px #3a4150,
            0 25px 60px rgba(0,0,0,0.85),
            0 10px 25px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: transform 0.3s ease;
        }

        /* Phone buttons on side */
        .phone-frame::before {
          content: "";
          position: absolute;
          left: -9px;
          top: 115px;
          width: 4px;
          height: 48px;
          background: #474e5d;
          border-radius: 3px 0 0 3px;
        }
        .phone-frame::after {
          content: "";
          position: absolute;
          right: -9px;
          top: 150px;
          width: 4px;
          height: 68px;
          background: #474e5d;
          border-radius: 0 3px 3px 0;
        }

        /* Dynamic Island / Notch */
        .dynamic-island {
          position: absolute;
          top: 19px;
          left: 50%;
          transform: translateX(-50%);
          width: 110px;
          height: 28px;
          background: #000000;
          border-radius: 20px;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          pointer-events: none;
        }
        .camera-lens {
          width: 10px;
          height: 10px;
          border-radius: 5px;
          background: #0d1a2d;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .sensor {
          width: 6px;
          height: 6px;
          border-radius: 3px;
          background: #151515;
        }

        /* Phone Screen (Iframe Container) */
        .phone-screen {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 40px;
          overflow: hidden;
          background: #000000;
        }

        .phone-screen iframe {
          width: 100%;
          height: 100%;
          border: none;
          background: #121216;
        }

        /* Home Indicator Bar */
        .home-indicator {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          width: 130px;
          height: 4px;
          background: rgba(255,255,255,0.6);
          border-radius: 2px;
          z-index: 50;
          pointer-events: none;
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <span class="toolbar-title">📱 DUDO SIMULATOR</span>
        <button class="tool-btn" onclick="reloadFrame()">🔄 Reload</button>
        <button class="tool-btn" onclick="zoom(0.85)">85%</button>
        <button class="tool-btn" onclick="zoom(1)">100%</button>
      </div>

      <div class="simulator-stage">
        <div class="phone-frame" id="phone">
          <div class="dynamic-island">
            <div class="camera-lens"></div>
            <div class="sensor"></div>
          </div>
          <div class="phone-screen">
            <iframe id="appFrame" src="http://localhost:8081" allow="autoplay; accelerometer; gyroscope"></iframe>
          </div>
          <div class="home-indicator"></div>
        </div>
      </div>

      <script>
        function reloadFrame() {
          const frame = document.getElementById('appFrame');
          frame.src = frame.src;
        }
        function zoom(scale) {
          document.getElementById('phone').style.transform = 'scale(' + scale + ')';
        }
      </script>
    </body>
    </html>
  `);
});

// ─── Root status page ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const { gameManager } = require('./socket/socketHandlers');
  const activeGames = gameManager ? gameManager.games.size : 0;
  const activePlayers = gameManager ? gameManager.playerToGame.size : 0;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🏏 DUDO Hand Cricket Server</title>
      <meta http-equiv="refresh" content="5">
      <style>
        body { font-family: -apple-system, sans-serif; background: #0A0A1A; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column; }
        .card { background: #12122A; border: 1px solid rgba(255,90,95,0.4); border-radius: 20px; padding: 48px 64px; text-align: center; }
        h1 { font-size: 2.5rem; margin-bottom: 8px; color: #FF5A5F; }
        .sub { color: #A8A8C8; margin-bottom: 24px; font-size: 1rem; }
        .badge { background: rgba(78,205,196,0.15); border: 1px solid #4ECDC4; color: #4ECDC4; border-radius: 9999px; padding: 8px 20px; display: inline-block; font-weight: bold; font-size: 0.9rem; margin-bottom: 24px; }
        .sim-btn { display: inline-block; background: #FF5A5F; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 999px; font-weight: bold; margin-bottom: 32px; font-size: 1rem; }
        .stats { display: flex; gap: 32px; justify-content: center; }
        .stat { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px 32px; }
        .stat-num { font-size: 2rem; font-weight: 900; color: #FF5A5F; }
        .stat-label { color: #A8A8C8; font-size: 0.8rem; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>🏏 DUDO Hand Cricket</h1>
        <p class="sub">Real-time multiplayer game server</p>
        <div class="badge">● SERVER ONLINE</div><br/>
        <a href="/device" class="sim-btn">📱 Open IDE Mobile Device Simulator</a>
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
  console.log(`   Simulator: http://localhost:${PORT}/device`);
  console.log(`   Health: http://localhost:${PORT}/health\n`);
});

process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled rejection:', err);
});
