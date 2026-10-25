import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow all in development for easy testing
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing middlewares (support audio payloads for Whisper speech-to-text)
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Root health & welcome check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'MERN Stack Backend API is operational',
    endpoints: {
      health: '/api/v1/health',
      items: '/api/v1/items',
    },
  });
});

// Mount API Routes
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes); // Alias for convenience

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
