import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS Configuration: dynamically allow requesting origin (Netlify, Vercel, localhost, mobile)
app.use(
  cors({
    origin: (origin, callback) => {
      // Reflect origin so credentials: true works seamlessly across Netlify & mobile
      callback(null, origin || true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder'],
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing middlewares (support audio payloads for Whisper speech-to-text)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Mount API Routes
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes); // Alias for convenience

// Serve static frontend assets from client/dist
app.use(express.static(clientDistPath));

// SPA catch-all: serve index.html for non-API client routes, or return API status when running standalone
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      return res.status(200).json({
        success: true,
        service: 'FinSafe Backend API',
        status: 'online',
        message: 'Backend is running on Vercel & connected to MongoDB Atlas',
        health: '/api/v1/health',
        timestamp: new Date().toISOString(),
      });
    }
  });
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
