import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Initialize Database connection and start server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚀 MERN Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`📡 URL: http://0.0.0.0:${PORT} (Local: http://localhost:${PORT})`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/v1/health`);
    console.log(`📦 Items endpoint: http://localhost:${PORT}/api/v1/items`);
    console.log(`===============================================`);
  });

  // Handle port-in-use error gracefully instead of crashing
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use. Retrying in 2 seconds...`);
      setTimeout(() => {
        server.close();
        server.listen(PORT);
      }, 2000);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  // Graceful shutdown handling
  const shutdown = (signal) => {
    console.log(`\n[${signal}] Received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
