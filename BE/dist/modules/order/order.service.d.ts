import { IOrder, OrderStatus } from '../../models/order.model';
export declare class OrderService {
    getOrders(filters: {
        branchId?: string;
        status?: string;
    }): Promise<IOrder[]>;
    getOrderById(id: string): Promise<IOrder>;
    confirmOrder(id: string, staffId: string): Promise<IOrder>;
    updateStatus(id: string, status: OrderStatus, staffId: string): Promise<IOrder>;
    private ensureStockAvailable;
    private decreaseOrderStock;
    private restoreDecreasedStock;
    private increaseOrderStock;
    private rollbackStockChange;
    private getObjectIdString;
    private buildCustomerOrderResponse;
    getOrderHistory(customerId: string, page: number, limit: number, status?: OrderStatus): Promise<{
        orders: {
            orderId: string;
            code: string;
            status: OrderStatus;
            branch: {
                branchId: any;
                name: any;
                code: any;
                address: any;
                phone: any;
            } | {
                branchId: string;
                name?: undefined;
                code?: undefined;
                address?: undefined;
                phone?: undefined;
            };
            items: {
                productId: any;
                productName: any;
                sku: any;
                unit: any;
                imageUrl: any;
                quantity: any;
                unitPrice: any;
                subtotal: any;
            }[];
            totalAmount: number;
            deliveryAddress: string | null;
            note: string | null;
            createdAt: Date;
            updatedAt: Date;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNextPage: boolean;
            hasPrevPage: boolean;
        };
    }>;
    trackOrder(orderId: string, customerId: string): Promise<{
        order: {
            orderId: string;
            code: string;
            status: OrderStatus;
            branch: {
                branchId: any;
                name: any;
                code: any;
                address: any;
                phone: any;
            } | {
                branchId: string;
                name?: undefined;
                code?: undefined;
                address?: undefined;
                phone?: undefined;
            };
            items: {
                productId: any;
                productName: any;
                sku: any;
                unit: any;
                imageUrl: any;
                quantity: any;
                unitPrice: any;
                subtotal: any;
            }[];
            totalAmount: number;
            deliveryAddress: string | null;
            note: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        tracking: {
            trackingId: string;
            status: import("../../models/deliveryTracking.model").TrackingStatus;
            location: string | null;
            note: string | null;
            timestamp: Date;
        }[];
        currentStatus: OrderStatus;
    }>;
    getCustomerOrderById(orderId: string, customerId: string): Promise<{
        orderId: string;
        code: string;
        status: OrderStatus;
        branch: {
            branchId: any;
            name: any;
            code: any;
            address: any;
            phone: any;
        } | {
            branchId: string;
            name?: undefined;
            code?: undefined;
            address?: undefined;
            phone?: undefined;
        };
        items: {
            productId: any;
            productName: any;
            sku: any;
            unit: any;
            imageUrl: any;
            quantity: any;
            unitPrice: any;
            subtotal: any;
        }[];
        totalAmount: number;
        deliveryAddress: string | null;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    cancelCustomerOrder(orderId: string, customerId: string, reason?: string): Promise<{
        orderId: string;
        code: string;
        status: OrderStatus;
        branch: {
            branchId: any;
            name: any;
            code: any;
            address: any;
            phone: any;
        } | {
            branchId: string;
            name?: undefined;
            code?: undefined;
            address?: undefined;
            phone?: undefined;
        };
        items: {
            productId: any;
            productName: any;
            sku: any;
            unit: any;
            imageUrl: any;
            quantity: any;
            unitPrice: any;
            subtotal: any;
        }[];
        totalAmount: number;
        deliveryAddress: string | null;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
export declare const orderService: OrderService;
//# sourceMappingURL=order.service.d.ts.map