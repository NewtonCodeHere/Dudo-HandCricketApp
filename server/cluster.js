/**
 * DUDO Hand Cricket - Production Cluster Manager
 * Scales the server across multiple CPU cores to handle heavy online traffic.
 * In production with a Redis adapter, multiple workers share the port and coordinate rooms seamlessly.
 */

const cluster = require('cluster');
const os = require('os');
const path = require('path');

const numCPUs = os.cpus().length;
const workersCount = process.env.WEB_CONCURRENCY ? parseInt(process.env.WEB_CONCURRENCY, 10) : Math.max(1, Math.min(numCPUs, 4));

if (cluster.isPrimary || cluster.isMaster) {
  console.log('====================================================');
  console.log(`🏏 DUDO Hand Cricket Production Cluster`);
  console.log(`⚡ Detected ${numCPUs} CPU cores. Spawning ${workersCount} worker processes.`);
  console.log(`🔒 Process ID: ${process.pid}`);
  console.log('====================================================\n');

  for (let i = 0; i < workersCount; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`[Cluster] Worker ${worker.id} (PID ${worker.process.pid}) is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.warn(`[Cluster] Worker ${worker.id} died (code: ${code}, signal: ${signal}). Spawning replacement...`);
    cluster.fork();
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Cluster] Graceful shutdown initiated. Terminating workers...');
    for (const id in cluster.workers) {
      if (cluster.workers[id]) {
        cluster.workers[id].process.kill('SIGTERM');
      }
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
} else {
  // Worker process runs the server instance
  require('./index.js');
}
