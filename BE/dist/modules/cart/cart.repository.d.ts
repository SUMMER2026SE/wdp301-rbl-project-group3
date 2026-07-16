import { ICart } from '../../models/cart.model';
export declare class CartRepository {
    /** Lấy cart của user (có populate product) */
    findByUserId(userId: string): Promise<ICart | null>;
    /** Lấy cart thô (không populate) — dùng cho các thao tác write */
    findRawByUserId(userId: string): Promise<ICart | null>;
    /** Tạo cart mới cho user */
    createCart(userId: string): Promise<ICart>;
    /** Upsert: tìm hoặc tạo cart cho user */
    findOrCreateCart(userId: string): Promise<ICart>;
    /**
     * Thêm sản phẩm vào giỏ hoặc tăng số lượng nếu đã có.
     * Trả về cart sau khi đã populated.
     */
    upsertItem(userId: string, productId: string, quantity: number): Promise<ICart>;
    /**
     * Cập nhật số lượng của một item.
     * Nếu quantity = 0 → xóa item khỏi giỏ.
     */
    updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<ICart | null>;
    /** Xóa một item khỏi giỏ */
    removeItem(userId: string, itemId: string): Promise<ICart | null>;
    /** Xóa toàn bộ items trong giỏ (dùng sau khi đặt hàng thành công) */
    clearCart(userId: string): Promise<void>;
    /** Xóa các item đã được chọn thanh toán */
    removeItems(userId: string, itemIds: string[]): Promise<void>;
}
export declare const cartRepository: CartRepository;
//# sourceMappingURL=cart.repository.d.ts.map