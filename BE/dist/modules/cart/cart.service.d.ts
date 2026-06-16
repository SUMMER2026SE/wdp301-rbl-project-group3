interface CartItemResponse {
    itemId: string;
    product: {
        id: string;
        name: string;
        price: number;
        unit?: string;
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
    addToCart(userId: string, productId: string, quantity: number): Promise<CartResponse>;
    getCart(userId: string): Promise<CartResponse>;
    updateItemQuantity(userId: string, itemId: string, quantity: number): Promise<CartResponse>;
    removeItem(userId: string, itemId: string): Promise<CartResponse>;
    clearCart(userId: string): Promise<void>;
}
export declare const cartService: CartService;
export {};
//# sourceMappingURL=cart.service.d.ts.map