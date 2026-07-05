import { CompetitorProduct } from '../../models/competitor-product.model';
import { Product } from '../../models/product.model';
import { generateUniqueSku } from '../../utils/sku.util';
import { normalizeString } from '../../utils/string.util';

export class CompetitorProductService {
  async getCompetitorProducts(query: {
    page?: number;
    limit?: number;
    keyword?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.keyword) {
      const searchRegex = new RegExp(query.keyword, 'i');
      filter.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { sku: searchRegex }
      ];
    }

    const items = await CompetitorProduct.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CompetitorProduct.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async importToCatalog(ids: string[]): Promise<{ importedCount: number }> {
    const cpList = await CompetitorProduct.find({ _id: { $in: ids } });
    let importedCount = 0;

    for (const cp of cpList) {
      // Check if product with this normalized combination already exists in Product to prevent duplicates
      const normalizedName = cp.normalizedName || normalizeString(cp.name);
      const normalizedBrand = cp.normalizedBrand || (cp.brand ? normalizeString(cp.brand) : undefined);
      const normalizedUnit = cp.normalizedUnit || normalizeString(cp.unit || 'item');

      const existingProduct = await Product.findOne({
        normalizedName,
        normalizedBrand,
        normalizedUnit
      });

      if (existingProduct) {
        // If it exists, skip importing to prevent duplication
        continue;
      }

      // Auto-generate system SKU (e.g. PM123456)
      const sku = await generateUniqueSku();

      // Create new Product
      await Product.create({
        name: cp.name,
        brand: cp.brand,
        sku,
        costPrice: 0,
        salePrice: 0,
        unit: cp.unit || 'item',
        description: cp.description,
        imageUrl: cp.imageUrl,
        status: 'active',
        normalizedName,
        normalizedBrand,
        normalizedUnit,
      });

      importedCount++;
    }

    return { importedCount };
  }
}

export const competitorProductService = new CompetitorProductService();
