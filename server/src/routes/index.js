import { Router } from 'express';
import healthRoutes from './health.routes.js';
import itemRoutes from './item.routes.js';
import groqRoutes from './groq.routes.js';

const router = Router();

// API Metadata and root discovery
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the MERN API root',
    version: '1.0.0',
    documentation: {
      health: '/api/v1/health',
      items: '/api/v1/items',
      groq: '/api/v1/groq/parse-voice',
    },
  });
});

router.use('/health', healthRoutes);
router.use('/items', itemRoutes);
router.use('/groq', groqRoutes);

export default router;
