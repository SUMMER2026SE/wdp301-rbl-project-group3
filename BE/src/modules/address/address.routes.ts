import { Router } from 'express';
import { addressController } from './address.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { authorize } from '../../middlewares/role.middleware';
import {
    validate,
    addAddressSchema,
    updateAddressSchema,
    addressIdParamSchema,
} from './address.validation';

const router = Router();

router.use(authenticate, authorize('customer'));

router.get('/', addressController.getAddresses);
router.post('/', validate(addAddressSchema), addressController.addAddress);
router.patch('/:addressId', validate(updateAddressSchema), addressController.updateAddress);
router.delete('/:addressId', validate(addressIdParamSchema), addressController.deleteAddress);
router.patch('/:addressId/default', validate(addressIdParamSchema), addressController.setDefault);

export default router;
