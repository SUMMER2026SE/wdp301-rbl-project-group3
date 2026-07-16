import { Types } from 'mongoose';
import { IOrder } from '../../models/order.model';
import { IReturnItem, IReturnRequest, ReturnStatus } from '../../models/returnRequest.model';
export declare class ReturnRepository {
    findOrder(orderId: string): Promise<IOrder | null>;
    acquireOrderLock(orderId: string, lockId: string): Promise<IOrder | null>;
    releaseOrderLock(orderId: string, lockId: string): Promise<void>;
    findPaginated(filters: {
        branchId?: string;
        orderId?: string;
        customerId?: string;
        status?: string;
    }, page: number, limit: number): Promise<{
        returns: (import("mongoose").Document<unknown, {}, IReturnRequest, {}, import("mongoose").DefaultSchemaOptions> & IReturnRequest & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: string): Promise<IReturnRequest | null>;
    findRawById(id: string): Promise<IReturnRequest | null>;
    getReservedSummary(orderId: string, excludeReturnId?: string): Promise<Map<string, {
        quantity: number;
        refundAmount: number;
    }>>;
    create(data: {
        code: string;
        orderId: string;
        orderCode: string;
        customerId: string;
        customerName: string;
        customerEmail?: string;
        customerPhone?: string;
        branchId: string;
        branchName: string;
        branchAddress: string;
        items: IReturnItem[];
        reason: string;
        totalRefund: number;
        createdBy: string;
    }): Promise<IReturnRequest>;
    updatePending(id: string, data: {
        reason: string;
        items: IReturnItem[];
        totalRefund: number;
    }): Promise<IReturnRequest | null>;
    updateStatus(id: string, expectedStatus: ReturnStatus | ReturnStatus[], data: Record<string, unknown>): Promise<IReturnRequest | null>;
    acquireForCompletion(id: string, lockId: string): Promise<IReturnRequest | null>;
    renewCompletionLock(id: string, lockId: string): Promise<boolean>;
    renewOrderLock(orderId: string, lockId: string): Promise<boolean>;
    completeWithLock(id: string, lockId: string, data: Record<string, unknown>): Promise<IReturnRequest | null>;
    releaseCompletion(id: string, lockId: string): Promise<void>;
}
export declare const returnRepository: ReturnRepository;
//# sourceMappingURL=return.repository.d.ts.map