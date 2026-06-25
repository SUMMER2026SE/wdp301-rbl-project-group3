import { IInvoice } from '../../models/invoice.model';
import { IOrder } from '../../models/order.model';
import { IUser } from '../../models/user.model';
export declare class InvoiceRepository {
    findOrderForInvoice(orderId: string): Promise<IOrder | null>;
    reserveOrderForInvoice(orderId: string, invoiceId: string): Promise<IOrder | null>;
    releaseOrderInvoiceReservation(orderId: string, invoiceId: string): Promise<void>;
    releaseStaleOrderInvoiceReservation(orderId: string): Promise<void>;
    renewOrderInvoiceReservation(orderId: string, invoiceId: string): Promise<boolean>;
    repairOrderInvoiceReference(orderId: string, invoiceId: string, issuedAt: Date): Promise<void>;
    finalizeOrderInvoice(orderId: string, invoiceId: string, issuedAt: Date): Promise<boolean>;
    findById(id: string): Promise<IInvoice | null>;
    findByOrderId(orderId: string): Promise<IInvoice | null>;
    findIssuer(userId: string): Promise<IUser | null>;
    create(data: Partial<IInvoice>): Promise<IInvoice>;
    deleteById(id: string): Promise<void>;
    recordPrint(id: string): Promise<IInvoice | null>;
}
export declare const invoiceRepository: InvoiceRepository;
//# sourceMappingURL=invoice.repository.d.ts.map