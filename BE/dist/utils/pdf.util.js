"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoicePdf = createInvoicePdf;
function ascii(value) {
    return String(value ?? '')
        .replace(/\u0111/g, 'd')
        .replace(/\u0110/g, 'D')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\x20-\x7E]/g, '?');
}
function escapePdfText(value) {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
function money(value) {
    return `${Math.round(value).toLocaleString('en-US')} VND`;
}
function buildInvoiceLines(invoice) {
    const listedAmount = invoice.listedAmount ??
        invoice.items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = invoice.discountAmount ?? Math.max(0, listedAmount - invoice.totalAmount);
    const lines = [
        `HOA DON BAN HANG - ${invoice.invoiceNumber}`,
        `Don hang: ${invoice.orderCode}`,
        `Ngay xuat: ${invoice.issuedAt.toISOString()}`,
        '',
        `Chi nhanh: ${invoice.branchName}`,
        `Ma chi nhanh: ${invoice.branchCode}`,
        `Dia chi: ${invoice.branchAddress}`,
        `Dien thoai: ${invoice.branchPhone || '-'}`,
        '',
        `Khach hang: ${invoice.customerName}`,
        `Email: ${invoice.customerEmail || '-'}`,
        `Dien thoai: ${invoice.customerPhone || '-'}`,
        `Giao den: ${invoice.deliveryAddress || '-'}`,
        `Nguoi xuat: ${invoice.issuedByName} (${invoice.issuedByEmail || '-'})`,
        '',
        'STT  San pham                         SL   Don gia       Thanh tien',
        '------------------------------------------------------------------',
    ];
    invoice.items.forEach((item, index) => {
        const name = ascii(item.productName).slice(0, 30).padEnd(30);
        const quantity = String(item.quantity).padStart(4);
        const unitPrice = money(item.unitPrice).padStart(13);
        const subtotal = money(item.subtotal).padStart(15);
        lines.push(`${String(index + 1).padStart(3)}  ${name} ${quantity} ${unitPrice} ${subtotal}`);
    });
    lines.push('', `TAM TINH: ${money(listedAmount)}`, `GIAM GIA: ${money(discountAmount)}`, `TONG CONG: ${money(invoice.totalAmount)}`);
    return lines.map(ascii);
}
function createInvoicePdf(invoice) {
    const allLines = buildInvoiceLines(invoice);
    const pageSize = 42;
    const pages = [];
    for (let index = 0; index < allLines.length; index += pageSize) {
        pages.push(allLines.slice(index, index + pageSize));
    }
    const objects = [];
    const pageObjectIds = [];
    const fontObjectId = 3;
    let nextObjectId = 4;
    for (const lines of pages) {
        const pageObjectId = nextObjectId++;
        const contentObjectId = nextObjectId++;
        pageObjectIds.push(pageObjectId);
        const commands = [
            'BT',
            '/F1 10 Tf',
            '50 790 Td',
            ...lines.flatMap((line, index) => [
                index === 0 ? '' : '0 -17 Td',
                `(${escapePdfText(line)}) Tj`,
            ]).filter(Boolean),
            'ET',
        ].join('\n');
        objects[pageObjectId] =
            `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
                `/Resources << /Font << /F1 ${fontObjectId} 0 R >> >> ` +
                `/Contents ${contentObjectId} 0 R >>`;
        objects[contentObjectId] =
            `<< /Length ${Buffer.byteLength(commands, 'ascii')} >>\nstream\n${commands}\nendstream`;
    }
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] =
        `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] ` +
            `/Count ${pageObjectIds.length} >>`;
    objects[fontObjectId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (let id = 1; id < objects.length; id += 1) {
        offsets[id] = Buffer.byteLength(pdf, 'ascii');
        pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
    }
    const xrefOffset = Buffer.byteLength(pdf, 'ascii');
    pdf += `xref\n0 ${objects.length}\n`;
    pdf += '0000000000 65535 f \n';
    for (let id = 1; id < objects.length; id += 1) {
        pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    }
    pdf +=
        `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\n` +
            `startxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(pdf, 'ascii');
}
//# sourceMappingURL=pdf.util.js.map