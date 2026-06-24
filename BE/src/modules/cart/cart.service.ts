import { cartRepository } from './cart.repository';
import { AppError } from '../../middlewares/errorHandler.middleware';
import { Product } from '../../models/product.model';

// ─── Response shape ───────────────────────────────────────────────────────────
interface CartItemResponse {
    itemId: string;
    product: {
        id: string;
        name: string;
        price: number;
        unit?: string;
        imageUrl?: string;
    };
    quantity: number;
    subtotal: number;
    addedAt: Date;
}

interface CartResponse {
    cartId: string;
    items: CartItemResponse[];
    totalItems: number;
    totalAmount: number;
}

function buildCartResponse(cart: any): CartResponse {
    const items: CartItemResponse[] = cart.items
        .filter((item: any) => item.productId && item.productId.status !== 'inactive')
        .map((item: any) => {
            const product = item.productId;
            const price = product?.salePrice ?? 0;
            return {
                itemId: item._id.toString(),
                product: {
                    id: product?._id?.toString() ?? '',
                    name: product?.name ?? 'Unknown',
                    price,
                    unit: product?.unit,
                    imageUrl: product?.imageUrl,
                },
                quantity: item.quantity,
                subtotal: price * item.quantity,
                addedAt: item.addedAt,
            };
        });

    const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

    return {
        cartId: cart._id.toString(),
        items,
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
        totalAmount,
    };
}

export class CartService {
    // ─── UC07: Thêm vào giỏ hàng ─────────────────────────────────────────────
    async addToCart(
        userId: string,
        productId: string,
        quantity: number
    ): Promise<CartResponse> {
        if (quantity < 1) {
            throw new AppError('Quantity must be at least 1', 400);
        }
        if (quantity > 100) {
            throw new AppError('Quantity cannot exceed 100 per request', 400);
        }

        // Kiểm tra sản phẩm tồn tại và đang bán
        const product = await Product.findById(productId).exec();
        if (!product) throw new AppError('Product not found', 404);
        if (!product.status) throw new AppError('Product is not available', 400);

        // Kiểm tra số lượng item trong giỏ không vượt quá giới hạn
        const rawCart = await cartRepository.findRawByUserId(userId);
        if (rawCart) {
            const existing = rawCart.items.find(
                (i) => i.productId.toString() === productId
            );
            const newQty = (existing?.quantity ?? 0) + quantity;
            if (newQty > 999) {
                throw new AppError('Cannot add more than 999 of the same product to cart', 400);
            }
        }

        const cart = await cartRepository.upsertItem(userId, productId, quantity);
        return buildCartResponse(cart);
    }

    // ─── UC08: Xem giỏ hàng ──────────────────────────────────────────────────
    async getCart(userId: string): Promise<CartResponse> {
        const cart = await cartRepository.findByUserId(userId);
        if (!cart) {
            // Trả về giỏ rỗng thay vì lỗi 404
            return { cartId: '', items: [], totalItems: 0, totalAmount: 0 };
        }
        return buildCartResponse(cart);
    }

    // ─── UC08: Cập nhật số lượng ──────────────────────────────────────────────
    async updateItemQuantity(
        userId: string,
        itemId: string,
        quantity: number
    ): Promise<CartResponse> {
        if (quantity < 0) {
            throw new AppError('Quantity must be non-negative', 400);
        }
        if (quantity > 999) {
            throw new AppError('Quantity cannot exceed 999', 400);
        }

        // Kiểm tra item thuộc về cart của user
        const rawCart = await cartRepository.findRawByUserId(userId);
        if (!rawCart) throw new AppError('Cart not found', 404);

        const itemExists = rawCart.items.some(
            (i) => i._id.toString() === itemId
        );
        if (!itemExists) throw new AppError('Cart item not found', 404);

        const cart = await cartRepository.updateItemQuantity(userId, itemId, quantity);
        if (!cart) throw new AppError('Failed to update cart', 500);

        return buildCartResponse(cart);
    }

    // ─── UC08: Xóa một item ───────────────────────────────────────────────────
    async removeItem(userId: string, itemId: string): Promise<CartResponse> {
        const rawCart = await cartRepository.findRawByUserId(userId);
        if (!rawCart) throw new AppError('Cart not found', 404);

        const itemExists = rawCart.items.some(
            (i) => i._id.toString() === itemId
        );
        if (!itemExists) throw new AppError('Cart item not found', 404);

        const cart = await cartRepository.removeItem(userId, itemId);
        if (!cart) throw new AppError('Failed to remove item', 500);

        return buildCartResponse(cart);
    }

    // ─── UC08: Xóa toàn bộ giỏ ───────────────────────────────────────────────
    async clearCart(userId: string): Promise<void> {
        await cartRepository.clearCart(userId);
    }
}

export const cartService = new CartService();
