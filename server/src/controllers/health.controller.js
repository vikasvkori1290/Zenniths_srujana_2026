import { isDbConnected } from '../config/db.js';

export const getHealth = (req, res) => {
  const uptimeSeconds = process.uptime();
  const dbConnected = isDbConnected();

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      service: 'MERN Backend API',
      version: '1.0.0',
      uptime: `${Math.floor(uptimeSeconds)}s`,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        connected: dbConnected,
        status: dbConnected ? 'connected' : 'disconnected (mock mode active)',
      },
      memory: {
        rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      },
    },
  });
};
