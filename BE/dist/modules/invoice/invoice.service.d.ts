import { IInvoice } from '../../models/invoice.model';
import { BackOfficeActor } from '../../utils/backOfficeAccess.util';
export declare class InvoiceService {
    issueInvoice(orderId: string, actor: BackOfficeActor): Promise<IInvoice>;
    getById(id: string, actor: BackOfficeActor): Promise<IInvoice>;
    getByOrderId(orderId: string, actor: BackOfficeActor): Promise<IInvoice>;
    createPdf(id: string, actor: BackOfficeActor): Promise<{
        invoice: IInvoice;
        pdf: Buffer<ArrayBufferLike>;
    }>;
    private objectId;
}
export declare const invoiceService: InvoiceService;
//# sourceMappingURL=invoice.service.d.ts.map