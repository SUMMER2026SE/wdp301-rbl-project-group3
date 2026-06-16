import { IOrder, OrderStatus } from '../../models/order.model';
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
}
export declare const orderRepository: OrderRepository;
//# sourceMappingURL=order.repository.d.ts.map