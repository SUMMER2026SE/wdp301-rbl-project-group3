import { Router } from 'express';
import { promotionController } from './promotion.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
  validate,
  createPromotionSchema,
  updatePromotionSchema,
  promotionIdParamSchema,
  listPromotionsSchema,
  listActivePromotionsSchema,
  generateVouchersSchema,
  listVouchersSchema,
  voucherIdParamSchema,
  lookupVoucherSchema,
  applyVoucherSchema,
  claimVoucherSchema,
} from './promotion.validation';

const router = Router();

// ─── Public / Authenticated ─────────────────────────────────────────────────────
router.get('/active', authenticate, validate(listActivePromotionsSchema), promotionController.listActivePromotions);
router.get('/vouchers/lookup', validate(lookupVoucherSchema), promotionController.lookupVoucher);
router.post('/vouchers/apply', authenticate, validate(applyVoucherSchema), promotionController.applyVoucher);
router.post('/vouchers/claim', authenticate, validate(claimVoucherSchema), promotionController.claimVoucher);

// ─── Admin & Branch Manager ───────────────────────────────────────────────────
router.get('/', authenticate, authorize('admin', 'branch_manager'), validate(listPromotionsSchema), promotionController.listPromotions);
router.post('/', authenticate, authorize('admin', 'branch_manager'), validate(createPromotionSchema), promotionController.createPromotion);
router.get('/:id', authenticate, authorize('admin', 'branch_manager'), validate(promotionIdParamSchema), promotionController.getPromotion);
router.patch('/:id', authenticate, authorize('admin', 'branch_manager'), validate(updatePromotionSchema), promotionController.updatePromotion);
router.delete('/:id', authenticate, authorize('admin', 'branch_manager'), validate(promotionIdParamSchema), promotionController.deletePromotion);
router.patch('/:id/activate', authenticate, authorize('admin', 'branch_manager'), validate(promotionIdParamSchema), promotionController.activatePromotion);
router.patch('/:id/deactivate', authenticate, authorize('admin', 'branch_manager'), validate(promotionIdParamSchema), promotionController.deactivatePromotion);

// ─── Vouchers ─────────────────────────────────────────────────────────────────
router.post('/:id/vouchers/generate', authenticate, authorize('admin', 'branch_manager'), validate(generateVouchersSchema), promotionController.generateVouchers);
router.get('/:id/vouchers', authenticate, authorize('admin', 'branch_manager'), validate(listVouchersSchema), promotionController.listVouchers);
router.patch('/vouchers/:voucherId/disable', authenticate, authorize('admin', 'branch_manager'), validate(voucherIdParamSchema), promotionController.disableVoucher);

export default router;