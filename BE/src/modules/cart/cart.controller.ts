import { Request, Response } from 'express';
import { cartService } from './cart.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

export class CartController {
    // UC07 — POST /api/cart/items
    addToCart = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { productId, quantity } = req.body;

        const cart = await cartService.addToCart(userId, productId, quantity);
        sendSuccess(res, cart, 'Item added to cart', 201);
    });

    // UC08 — GET /api/cart
    getCart = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const cart = await cartService.getCart(userId);
        sendSuccess(res, cart, 'Cart retrieved successfully');
    });

    // UC08 — PATCH /api/cart/items/:itemId
    updateItem = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const itemId = req.params['itemId'] as string;
        const { quantity } = req.body;

        const cart = await cartService.updateItemQuantity(userId, itemId, quantity);
        sendSuccess(res, cart, 'Cart item updated');
    });

    // UC08 — DELETE /api/cart/items/:itemId
    removeItem = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const itemId = req.params['itemId'] as string;

        const cart = await cartService.removeItem(userId, itemId);
        sendSuccess(res, cart, 'Item removed from cart');
    });

    // UC08 — DELETE /api/cart
    clearCart = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        await cartService.clearCart(userId);
        sendSuccess(res, null, 'Cart cleared');
    });
}

export const cartController = new CartController();
