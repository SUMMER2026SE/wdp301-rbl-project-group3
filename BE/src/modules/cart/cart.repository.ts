import { Types } from 'mongoose';
import { Cart, ICart } from '../../models/cart.model';

export class CartRepository {
    /** Lấy cart của user (có populate product) */
    async findByUserId(userId: string): Promise<ICart | null> {
        return Cart.findOne({ userId })
            .populate({
                path: 'items.productId',
                select: 'productName price unit status',
            })
            .exec();
    }

    /** Lấy cart thô (không populate) — dùng cho các thao tác write */
    async findRawByUserId(userId: string): Promise<ICart | null> {
        return Cart.findOne({ userId }).exec();
    }

    /** Tạo cart mới cho user */
    async createCart(userId: string): Promise<ICart> {
        const cart = new Cart({ userId, items: [] });
        return cart.save();
    }

    /** Upsert: tìm hoặc tạo cart cho user */
    async findOrCreateCart(userId: string): Promise<ICart> {
        let cart = await this.findRawByUserId(userId);
        if (!cart) {
            cart = await this.createCart(userId);
        }
        return cart;
    }

    /**
     * Thêm sản phẩm vào giỏ hoặc tăng số lượng nếu đã có.
     * Trả về cart sau khi đã populated.
     */
    async upsertItem(
        userId: string,
        productId: string,
        quantity: number
    ): Promise<ICart> {
        const productObjId = new Types.ObjectId(productId);

        // Tìm cart, nếu chưa có thì tạo mới
        const cart = await this.findOrCreateCart(userId);
        const existingItem = cart.items.find(
            (item) => item.productId.toString() === productId
        );

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                _id: new Types.ObjectId(),
                productId: productObjId,
                quantity,
                addedAt: new Date(),
            });
        }

        await cart.save();

        // Trả về cart đã populated
        return (await this.findByUserId(userId)) as ICart;
    }

    /**
     * Cập nhật số lượng của một item.
     * Nếu quantity = 0 → xóa item khỏi giỏ.
     */
    async updateItemQuantity(
        userId: string,
        itemId: string,
        quantity: number
    ): Promise<ICart | null> {
        if (quantity <= 0) {
            // Xóa item
            await Cart.findOneAndUpdate(
                { userId },
                { $pull: { items: { _id: new Types.ObjectId(itemId) } } }
            ).exec();
        } else {
            await Cart.findOneAndUpdate(
                { userId, 'items._id': new Types.ObjectId(itemId) },
                { $set: { 'items.$.quantity': quantity } }
            ).exec();
        }

        return this.findByUserId(userId);
    }

    /** Xóa một item khỏi giỏ */
    async removeItem(userId: string, itemId: string): Promise<ICart | null> {
        await Cart.findOneAndUpdate(
            { userId },
            { $pull: { items: { _id: new Types.ObjectId(itemId) } } }
        ).exec();
        return this.findByUserId(userId);
    }

    /** Xóa toàn bộ items trong giỏ (dùng sau khi đặt hàng thành công) */
    async clearCart(userId: string): Promise<void> {
        await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } }).exec();
    }

    /** Xóa các item đã được chọn thanh toán */
    async removeItems(userId: string, itemIds: string[]): Promise<void> {
        const objectIds = itemIds.map((id) => new Types.ObjectId(id));
        await Cart.findOneAndUpdate(
            { userId },
            { $pull: { items: { _id: { $in: objectIds } } } }
        ).exec();
    }
}

export const cartRepository = new CartRepository();
