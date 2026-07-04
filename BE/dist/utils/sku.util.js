"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueSku = void 0;
const product_repository_1 = require("../modules/product/product.repository");
const generateUniqueSku = async (prefix = 'PM') => {
    let isUnique = false;
    let attempts = 0;
    let sku = '';
    while (!isUnique && attempts < 10) {
        const stamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        sku = `${prefix}${stamp}${random}`;
        const existing = await product_repository_1.productRepository.findBySku(sku);
        if (!existing) {
            isUnique = true;
        }
        attempts++;
    }
    if (!isUnique) {
        throw new Error('Could not generate a unique SKU after multiple attempts.');
    }
    return sku;
};
exports.generateUniqueSku = generateUniqueSku;
//# sourceMappingURL=sku.util.js.map