import { Router } from 'express';
import healthRoutes from './health.routes.js';
import itemRoutes from './item.routes.js';
import groqRoutes from './groq.routes.js';
import authRoutes from './auth.routes.js';
import financeRoutes from './finance.routes.js';
import predictionRoutes from './prediction.routes.js';

const router = Router();

// API Metadata and root discovery
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the AurumFlow API root',
    version: '1.0.0',
    documentation: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      finance: '/api/v1/finance',
      prediction: '/api/v1/prediction/analyze',
      items: '/api/v1/items',
      groq: '/api/v1/groq/parse-voice',
    },
  });
});

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/finance', financeRoutes);
router.use('/prediction', predictionRoutes);
router.use('/items', itemRoutes);
router.use('/groq', groqRoutes);

export default router;

