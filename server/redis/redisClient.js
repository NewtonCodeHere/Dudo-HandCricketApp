const config = require('../config');
const { createAdapter } = require('@socket.io/redis-adapter');

let Redis = null;
try {
  Redis = require('ioredis');
} catch (e) {
  // ioredis optional fallback
}

let pubClient = null;
let subClient = null;
let dataClient = null;
let isConnected = false;

// In-memory fallback cache if Redis is not connected
const memoryCache = new Map();

function initRedis() {
  if (!config.redisUrl || !Redis) {
    console.log('[Redis] No REDIS_URL provided — running with high-performance In-Memory state & events');
    return null;
  }

  try {
    const redisOptions = {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) {
          console.warn('[Redis] Connection retry limit reached. Falling back to in-memory mode.');
          return null;
        }
        return Math.min(times * 100, 2000);
      },
    };

    pubClient = new Redis(config.redisUrl, redisOptions);
    subClient = pubClient.duplicate();
    dataClient = pubClient.duplicate();

    pubClient.on('connect', () => {
      isConnected = true;
      console.log('[Redis] Connected successfully. Multi-node Socket.IO scaling active.');
    });

    pubClient.on('error', (err) => {
      isConnected = false;
      console.warn('[Redis] Pub client error:', err.message);
    });

    return { pubClient, subClient, dataClient };
  } catch (err) {
    console.warn('[Redis] Failed to initialize Redis:', err.message);
    return null;
  }
}

function getSocketAdapter() {
  if (pubClient && subClient && isConnected) {
    return createAdapter(pubClient, subClient);
  }
  return null;
}

// ─── Distributed Cache Helper ──────────────────────────────────────────────────

async function setCached(key, value, ttlSeconds = 3600) {
  const serialized = JSON.stringify(value);
  if (dataClient && isConnected) {
    try {
      if (ttlSeconds > 0) {
        await dataClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await dataClient.set(key, serialized);
      }
      return true;
    } catch (e) {
      console.warn('[Redis Cache] Set error:', e.message);
    }
  }

  // Memory fallback
  memoryCache.set(key, {
    val: serialized,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null,
  });
  return true;
}

async function getCached(key) {
  if (dataClient && isConnected) {
    try {
      const data = await dataClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('[Redis Cache] Get error:', e.message);
    }
  }

  // Memory fallback
  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expiresAt && Date.now() > item.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  return JSON.parse(item.val);
}

async function delCached(key) {
  if (dataClient && isConnected) {
    try {
      await dataClient.del(key);
      return true;
    } catch (e) {
      console.warn('[Redis Cache] Del error:', e.message);
    }
  }
  memoryCache.delete(key);
  return true;
}

module.exports = {
  initRedis,
  getSocketAdapter,
  isRedisAvailable: () => isConnected,
  setCached,
  getCached,
  delCached,
};
