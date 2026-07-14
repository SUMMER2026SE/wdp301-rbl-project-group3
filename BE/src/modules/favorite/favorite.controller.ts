import { Request, Response } from 'express';
import { favoriteService } from './favorite.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

export class FavoriteController {
    getFavorites = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const favorites = await favoriteService.getFavorites(userId);
        sendSuccess(res, favorites, 'Favorites retrieved successfully');
    });

    addToFavorites = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const { productId } = req.body;
        const favorite = await favoriteService.addToFavorites(userId, productId);
        sendSuccess(res, favorite, 'Added to favorites', 201);
    });

    removeFromFavorites = asyncHandler(async (req: Request, res: Response) => {
        const userId = req.user!.userId;
        const productId = req.params['productId'] as string;
        await favoriteService.removeFromFavorites(userId, productId);
        sendSuccess(res, null, 'Removed from favorites');
    });
}

export const favoriteController = new FavoriteController();
