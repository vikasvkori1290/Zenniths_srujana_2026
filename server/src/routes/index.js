import { Router } from 'express';
import healthRoutes from './health.routes.js';
import itemRoutes from './item.routes.js';

const router = Router();

// API Metadata and root discovery
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the MERN API root',
    version: '1.0.0',
    documentation: {
      health: '/api/v1/health',
      items: '/api/v1/items',
    },
  });
});

router.use('/health', healthRoutes);
router.use('/items', itemRoutes);

export default router;
