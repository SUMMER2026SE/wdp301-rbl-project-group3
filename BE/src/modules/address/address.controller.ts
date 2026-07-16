import { Request, Response } from 'express';
import { addressService } from './address.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

export class AddressController {
    getAddresses = asyncHandler(async (req: Request, res: Response) => {
        const addresses = await addressService.getAddresses(req.user!.userId);
        sendSuccess(res, { addresses }, 'Addresses retrieved');
    });

    addAddress = asyncHandler(async (req: Request, res: Response) => {
        const { receiverName, phoneNumber, addressDetail, isDefault } = req.body;
        const address = await addressService.addAddress(req.user!.userId, {
            receiverName, phoneNumber, addressDetail, isDefault,
        });
        sendSuccess(res, { address }, 'Address added', 201);
    });

    updateAddress = asyncHandler(async (req: Request, res: Response) => {
        const addressId = req.params['addressId'] as string;
        const { receiverName, phoneNumber, addressDetail } = req.body;
        const address = await addressService.updateAddress(
            req.user!.userId, addressId, { receiverName, phoneNumber, addressDetail }
        );
        sendSuccess(res, { address }, 'Address updated');
    });

    deleteAddress = asyncHandler(async (req: Request, res: Response) => {
        const addressId = req.params['addressId'] as string;
        await addressService.deleteAddress(req.user!.userId, addressId);
        sendSuccess(res, null, 'Address deleted');
    });

    setDefault = asyncHandler(async (req: Request, res: Response) => {
        const addressId = req.params['addressId'] as string;
        const address = await addressService.setDefaultAddress(req.user!.userId, addressId);
        sendSuccess(res, { address }, 'Default address updated');
    });
}

export const addressController = new AddressController();
