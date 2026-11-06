require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'dudo_hand_cricket_prod_secret_key_98234710',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',

  // Redis configuration for Socket.IO scaling & caching
  redisUrl: process.env.REDIS_URL || null,

  // Kafka configuration for high-throughput event streaming
  kafkaBrokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : null,
  kafkaClientId: process.env.KAFKA_CLIENT_ID || 'dudo-cricket-server',

  // Google Play / OAuth Client IDs for verification
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleAndroidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID || '',

  // CORS Allowed Origins
  corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : '*',

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // max 100 HTTP requests per window
    socketMaxEventsPerSec: 10, // max 10 socket messages per second per client
  },
};
