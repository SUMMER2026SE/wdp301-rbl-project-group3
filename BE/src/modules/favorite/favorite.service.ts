import { Favorite } from '../../models/favorite.model';
import { Product } from '../../models/product.model';
import { AppError } from '../../middlewares/errorHandler.middleware';

export class FavoriteService {
    async getFavorites(userId: string) {
        const list = await Favorite.find({ userId })
            .populate('productId')
            .sort({ createdAt: -1 })
            .exec();
        
        // Filter out any populated product that doesn't exist or is inactive
        const activeFavorites = list
            .filter(f => f.productId && (f.productId as any).status === 'active')
            .map(f => f.productId);
            
        return activeFavorites;
    }

    async addToFavorites(userId: string, productId: string) {
        // Verify product exists and is active
        const product = await Product.findById(productId).exec();
        if (!product) {
            throw new AppError('Product not found', 404);
        }
        if (product.status !== 'active') {
            throw new AppError('Product is not active', 400);
        }

        // Check if already in favorites
        const existing = await Favorite.findOne({ userId, productId }).exec();
        if (existing) {
            return existing;
        }

        const favorite = new Favorite({ userId, productId });
        return await favorite.save();
    }

    async removeFromFavorites(userId: string, productId: string) {
        await Favorite.deleteOne({ userId, productId }).exec();
    }
}

export const favoriteService = new FavoriteService();
