import { Types } from 'mongoose';
import { IReturnRequest, RefundMethod, ReturnItemCondition } from '../../models/returnRequest.model';
import { BackOfficeActor } from '../../utils/backOfficeAccess.util';
type ReturnItemInput = {
    productId: string;
    quantity: number;
    condition: ReturnItemCondition;
};
export declare class ReturnService {
    listReturns(filters: {
        page: number;
        limit: number;
        branchId?: string;
        orderId?: string;
        customerId?: string;
        status?: string;
    }, actor: BackOfficeActor): Promise<{
        returns: (import("mongoose").Document<unknown, {}, IReturnRequest, {}, import("mongoose").DefaultSchemaOptions> & IReturnRequest & Required<{
            _id: Types.ObjectId;
        }> & {
            __v: number;
        } & {
            id: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getReturn(id: string, actor: BackOfficeActor): Promise<IReturnRequest>;
    createReturn(data: {
        orderId: string;
        reason: string;
        items: ReturnItemInput[];
    }, actor: BackOfficeActor): Promise<IReturnRequest>;
    updateReturn(id: string, data: {
        reason?: string;
        items?: ReturnItemInput[];
    }, actor: BackOfficeActor): Promise<IReturnRequest>;
    cancelReturn(id: string, reason: string, actor: BackOfficeActor): Promise<IReturnRequest>;
    approveReturn(id: string, note: string | undefined, actor: BackOfficeActor): Promise<IReturnRequest>;
    rejectReturn(id: string, note: string | undefined, actor: BackOfficeActor): Promise<IReturnRequest>;
    completeReturn(id: string, refund: {
        refundMethod: RefundMethod;
        refundReference?: string;
    }, actor: BackOfficeActor): Promise<IReturnRequest>;
    private getRawAccessibleReturn;
    private getDeliveredOrder;
    private acquireOrderLock;
    private assertOrderLockOwned;
    private prepareItems;
    private ensureReturnQuantitiesAvailable;
    private ensureRestockInventoryExists;
    private rollbackRestock;
    private totalRefund;
    private generateCode;
    private objectId;
}
export declare const returnService: ReturnService;
export {};
//# sourceMappingURL=return.service.d.ts.map