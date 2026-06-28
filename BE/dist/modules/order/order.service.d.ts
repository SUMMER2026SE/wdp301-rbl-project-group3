import { IOrder, OrderStatus } from '../../models/order.model';
import { TrackingStatus } from '../../models/deliveryTracking.model';
import { BackOfficeActor } from '../../utils/backOfficeAccess.util';
export declare class OrderService {
    getOrders(filters: {
        branchId?: string;
        status?: string;
    }, actor: BackOfficeActor): Promise<IOrder[]>;
    getOrderById(id: string, actor?: BackOfficeActor): Promise<IOrder>;
    confirmOrder(id: string, actor: BackOfficeActor): Promise<IOrder>;
    updateStatus(id: string, status: OrderStatus, actor: BackOfficeActor): Promise<IOrder>;
    private decreaseOrderStock;
    private increaseOrderStock;
    private reconcileOrderStock;
    private aggregateOrderItems;
    private getObjectIdString;
    private recordTrackingEvent;
    private ensureNoIssuedInvoice;
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
            phoneNumber: string | null;
            paymentMethod: import("../../models/order.model").PaymentMethod;
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
            phoneNumber: string | null;
            paymentMethod: import("../../models/order.model").PaymentMethod;
            note: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        tracking: {
            trackingId: string;
            status: TrackingStatus;
            changedBy: {
                userId: string;
                fullName: string | null;
                email: string | null;
                role: string | null;
            } | {
                userId: string;
                fullName?: undefined;
                email?: undefined;
                role?: undefined;
            } | null;
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
        phoneNumber: string | null;
        paymentMethod: import("../../models/order.model").PaymentMethod;
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
        phoneNumber: string | null;
        paymentMethod: import("../../models/order.model").PaymentMethod;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private generateOrderCode;
    placeOrder(customerId: string, data: {
        branchId: string;
        shippingAddress: string;
        phoneNumber: string;
        note?: string;
        paymentMethod: 'COD' | 'banking' | 'momo' | 'vnpay';
        voucherCode?: string;
    }): Promise<any>;
    private buildTrackingActor;
    private restoreFlashSaleQuantities;
}
export declare const orderService: OrderService;
//# sourceMappingURL=order.service.d.ts.map