import { IOrder, OrderStatus } from '../../models/order.model';
import { IDeliveryTracking, TrackingStatus } from '../../models/deliveryTracking.model';
export declare class OrderRepository {
    findAll(filters: {
        branchId?: string;
        status?: string;
    }): Promise<IOrder[]>;
    findById(id: string): Promise<IOrder | null>;
    updateStatus(id: string, data: {
        status: OrderStatus;
        confirmedBy?: string;
        confirmedAt?: Date;
    }): Promise<IOrder | null>;
    updateStatusIfCurrent(id: string, currentStatus: OrderStatus, data: {
        status: OrderStatus;
        confirmedBy?: string;
        confirmedAt?: Date;
    }): Promise<IOrder | null>;
    findByCustomerId(customerId: string, page: number, limit: number, status?: OrderStatus): Promise<{
        orders: IOrder[];
        total: number;
    }>;
    findByIdAndCustomerId(orderId: string, customerId: string): Promise<IOrder | null>;
    cancelByCustomer(orderId: string, customerId: string): Promise<IOrder | null>;
    findTrackingByOrderId(orderId: string): Promise<IDeliveryTracking[]>;
    addTrackingEvent(orderId: string, status: TrackingStatus, changedBy?: string, note?: string, location?: string): Promise<IDeliveryTracking>;
    findRawById(id: string): Promise<IOrder | null>;
}
export declare const orderRepository: OrderRepository;
//# sourceMappingURL=order.repository.d.ts.map