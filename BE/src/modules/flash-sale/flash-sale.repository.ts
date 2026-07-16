import { Types } from 'mongoose';
import { FlashSale, IFlashSale } from '../../models/flash-sale.model';

export interface FlashSaleFilter {
  status?: 'draft' | 'active' | 'inactive' | 'expired';
  scope?: 'global' | 'branch';
  branchId?: string;
  page?: number;
  limit?: number;
}

export class FlashSaleRepository {
  async createFlashSale(data: Partial<IFlashSale>): Promise<IFlashSale> {
    const flashSale = new FlashSale(data);
    return flashSale.save();
  }

  async findFlashSaleById(id: string): Promise<IFlashSale | null> {
    return FlashSale.findById(id).populate('products.productId').exec();
  }

  async findFlashSales(
    filter: FlashSaleFilter
  ): Promise<{ data: IFlashSale[]; total: number }> {
    const { status, scope, branchId, page = 1, limit = 20 } = filter;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (scope) query.scope = scope;
    if (branchId) query.branchId = new Types.ObjectId(branchId);

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      FlashSale.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('products.productId')
        .populate('branchId', 'name code')
        .exec(),
      FlashSale.countDocuments(query).exec(),
    ]);

    return { data, total };
  }

  async updateFlashSale(id: string, data: Partial<IFlashSale>): Promise<IFlashSale | null> {
    return FlashSale.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('products.productId')
      .exec();
  }

  async deleteFlashSale(id: string): Promise<IFlashSale | null> {
    return FlashSale.findByIdAndDelete(id).exec();
  }

  /**
   * Finds the currently active flash sale for a branch (or falls back to global).
   */
  async findActiveFlashSale(branchId?: string): Promise<IFlashSale | null> {
    const now = new Date();

    if (branchId) {
      // 1. Try to find a branch-specific active flash sale
      const branchSale = await FlashSale.findOne({
        status: 'active',
        scope: 'branch',
        branchId: new Types.ObjectId(branchId),
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .populate('products.productId')
        .exec();

      if (branchSale) return branchSale;
    }

    // 2. Fallback: Find a global active flash sale
    return FlashSale.findOne({
      status: 'active',
      scope: 'global',
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('products.productId')
      .exec();
  }

  /**
   * Increments the sold quantity of a product in a flash sale campaign.
   */
  async incrementProductSoldQuantity(
    flashSaleId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    await FlashSale.updateOne(
      {
        _id: new Types.ObjectId(flashSaleId),
        'products.productId': new Types.ObjectId(productId),
      },
      {
        $inc: { 'products.$.soldQuantity': quantity },
      }
    ).exec();
  }

  /**
   * Decrements the sold quantity of a product in a flash sale campaign.
   */
  async decrementProductSoldQuantity(
    flashSaleId: string,
    productId: string,
    quantity: number
  ): Promise<void> {
    await FlashSale.updateOne(
      {
        _id: new Types.ObjectId(flashSaleId),
        'products.productId': new Types.ObjectId(productId),
      },
      {
        $inc: { 'products.$.soldQuantity': -quantity },
      }
    ).exec();
  }

  /**
   * Finds a flash sale campaign matching an order date, branch, and product.
   */
  async findFlashSaleByOrderProduct(
    orderDate: Date,
    branchId: string,
    productId: string
  ): Promise<IFlashSale | null> {
    return FlashSale.findOne({
      startDate: { $lte: orderDate },
      endDate: { $gte: orderDate },
      'products.productId': new Types.ObjectId(productId),
      $or: [
        { scope: 'global' },
        { scope: 'branch', branchId: new Types.ObjectId(branchId) },
      ],
    }).exec();
  }
}

export const flashSaleRepository = new FlashSaleRepository();
