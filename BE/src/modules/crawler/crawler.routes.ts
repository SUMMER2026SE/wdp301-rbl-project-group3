import { Router } from 'express';
import { crawlerController } from './crawler.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';

const router = Router();

// Chỉ admin mới được quyền trigger cào dữ liệu thủ công
router.post('/start', authenticate, authorize('admin'), crawlerController.startManualCrawl);
router.post('/stop', authenticate, authorize('admin'), crawlerController.stopManualCrawl);
router.get('/status', authenticate, authorize('admin'), crawlerController.getCrawlerStatus);

export default router;
