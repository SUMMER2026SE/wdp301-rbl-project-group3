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
export declare class CartService {
    addToCart(userId: string, productId: string, quantity: number, branchId?: string): Promise<CartResponse>;
    getCart(userId: string, branchId?: string): Promise<CartResponse>;
    updateItemQuantity(userId: string, itemId: string, quantity: number, branchId?: string): Promise<CartResponse>;
    removeItem(userId: string, itemId: string, branchId?: string): Promise<CartResponse>;
    clearCart(userId: string): Promise<void>;
}
export declare const cartService: CartService;
export {};
//# sourceMappingURL=cart.service.d.ts.map