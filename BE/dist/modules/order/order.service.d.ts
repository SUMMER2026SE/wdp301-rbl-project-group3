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
}
export declare const orderService: OrderService;
//# sourceMappingURL=order.service.d.ts.map