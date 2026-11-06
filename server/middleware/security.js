const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const eventBus = require('../events/eventBus');

// ─── 1. HTTP Security Headers (Helmet) ─────────────────────────────────────────

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'ws:', 'wss:', '*'],
      frameAncestors: ["'self'", '*'], // Allow iframe preview inside developer simulator
    },
  },
  crossOriginEmbedderPolicy: false,
});

// ─── 2. Express HTTP Rate Limiter ─────────────────────────────────────────────

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests from this IP. Please try again later.',
  },
});

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 auth requests per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please slow down.',
  },
});

// ─── 3. Socket-Level Sliding Window Rate Limiter ──────────────────────────────

// Map socket.id -> array of timestamps
const socketTimestamps = new Map();

function checkSocketRateLimit(socket, eventName) {
  const now = Date.now();
  const windowMs = 1000; // 1 second
  const maxEventsPerSec = config.rateLimit.socketMaxEventsPerSec;

  let timestamps = socketTimestamps.get(socket.id);
  if (!timestamps) {
    timestamps = [];
    socketTimestamps.set(socket.id, timestamps);
  }

  // Filter out timestamps older than window
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);
  validTimestamps.push(now);
  socketTimestamps.set(socket.id, validTimestamps);

  if (validTimestamps.length > maxEventsPerSec) {
    eventBus.publish('SECURITY_ALERT', {
      type: 'SOCKET_RATE_LIMIT_EXCEEDED',
      identifier: socket.id,
      reason: `Client exceeded ${maxEventsPerSec} events/sec during ${eventName}`,
    });
    return false; // Rate limit exceeded
  }

  return true;
}

function cleanupSocketRateLimit(socketId) {
  socketTimestamps.delete(socketId);
}

// ─── 4. Input Sanitizer & Validations ─────────────────────────────────────────

function sanitizeText(input, maxLength = 30) {
  if (typeof input !== 'string') return '';
  return input
    .trim()
    .replace(/[<>'"&;/\\`]/g, '') // Strip potentially malicious HTML/SQL characters
    .slice(0, maxLength);
}

function isValidBall(n) {
  const num = parseInt(n, 10);
  return Number.isInteger(num) && num >= 1 && num <= 10;
}

function sanitizeGameCode(code) {
  if (typeof code !== 'string') return '';
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

module.exports = {
  helmetMiddleware,
  apiLimiter,
  authLimiter,
  checkSocketRateLimit,
  cleanupSocketRateLimit,
  sanitizeText,
  isValidBall,
  sanitizeGameCode,
};
