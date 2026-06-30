import { productRepository } from '../modules/product/product.repository';

export const generateUniqueSku = async (prefix: string = 'PM'): Promise<string> => {
  let isUnique = false;
  let attempts = 0;
  let sku = '';
  
  while (!isUnique && attempts < 10) {
    const stamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    sku = `${prefix}${stamp}${random}`;
    
    const existing = await productRepository.findBySku(sku);
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
