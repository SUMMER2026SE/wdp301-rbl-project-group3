import { Types } from 'mongoose';
import { flashSaleRepository, FlashSaleFilter } from './flash-sale.repository';
import { IFlashSale } from '../../models/flash-sale.model';
import { User } from '../../models/user.model';
import { AppError } from '../../middlewares/errorHandler.middleware';

export interface CallerContext {
  userId: string;
  role: 'customer' | 'admin' | 'branch_manager' | 'staff';
  branchId?: string;
}

export class FlashSaleService {
  async buildCallerContext(userId: string, role: string): Promise<CallerContext> {
    if (role === 'branch_manager') {
      const user = await User.findById(userId).select('branchId').exec();
      if (!user) throw new AppError('User not found', 404);
      return { userId, role, branchId: user.branchId?.toString() };
    }
    return { userId, role: role as any };
  }

  async createFlashSale(caller: CallerContext, data: any): Promise<IFlashSale> {
    if (caller.role === 'staff') {
      throw new AppError('Permission denied. Staff cannot create flash sales.', 403);
    }

    if (data.scope === 'global' && caller.role !== 'admin') {
      throw new AppError('Only admin can create global flash sales.', 403);
    }

    if (data.scope === 'branch') {
      if (caller.role === 'branch_manager') {
        if (!caller.branchId) {
          throw new AppError('Your account is not assigned to any branch.', 400);
        }
        if (data.branchId && data.branchId !== caller.branchId) {
          throw new AppError('You can only create flash sales for your own branch.', 403);
        }
        data.branchId = caller.branchId;
      } else if (caller.role === 'admin') {
        if (!data.branchId) {
          throw new AppError('branchId is required for branch-scoped flash sales.', 400);
        }
      }
    }

    const payload = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      branchId: data.branchId ? new Types.ObjectId(data.branchId) : undefined,
      products: data.products.map((p: any) => ({
        productId: new Types.ObjectId(p.productId),
        flashSalePrice: p.flashSalePrice,
        limitQuantity: p.limitQuantity,
        soldQuantity: 0,
      })),
      createdBy: new Types.ObjectId(caller.userId),
    };

    return flashSaleRepository.createFlashSale(payload);
  }

  async listFlashSales(caller: CallerContext, filterParams: any): Promise<{ data: IFlashSale[]; total: number }> {
    let filterBranchId = filterParams.branchId;
    if (caller.role === 'branch_manager') {
      filterBranchId = caller.branchId;
    }

    const filter: FlashSaleFilter = {
      status: filterParams.status,
      scope: filterParams.scope,
      branchId: filterBranchId,
      page: filterParams.page ? Number(filterParams.page) : undefined,
      limit: filterParams.limit ? Number(filterParams.limit) : undefined,
    };

    return flashSaleRepository.findFlashSales(filter);
  }

  async getFlashSaleById(caller: CallerContext, id: string): Promise<IFlashSale> {
    const flashSale = await flashSaleRepository.findFlashSaleById(id);
    if (!flashSale) {
      throw new AppError('Flash sale not found', 404);
    }

    // Branch manager permission check
    if (caller.role === 'branch_manager') {
      if (flashSale.scope === 'global' || flashSale.branchId?.toString() !== caller.branchId) {
        throw new AppError('You can only view flash sales of your own branch.', 403);
      }
    }

    return flashSale;
  }

  async updateFlashSale(caller: CallerContext, id: string, data: any): Promise<IFlashSale | null> {
    const flashSale = await flashSaleRepository.findFlashSaleById(id);
    if (!flashSale) {
      throw new AppError('Flash sale not found', 404);
    }

    if (caller.role === 'staff') {
      throw new AppError('Permission denied. Staff cannot modify flash sales.', 403);
    }

    // Branch manager permission check
    if (caller.role === 'branch_manager') {
      if (flashSale.scope === 'global' || flashSale.branchId?.toString() !== caller.branchId) {
        throw new AppError('You can only update flash sales of your own branch.', 403);
      }
      // Force payload branch parameters if present
      if (data.scope && data.scope !== 'branch') {
        throw new AppError('You cannot change scope to global.', 403);
      }
      if (data.branchId && data.branchId !== caller.branchId) {
        throw new AppError('You cannot set branch to another branch.', 403);
      }
      data.scope = 'branch';
      data.branchId = caller.branchId;
    }

    const payload: any = { ...data };
    if (data.startDate) payload.startDate = new Date(data.startDate);
    if (data.endDate) payload.endDate = new Date(data.endDate);
    if (data.branchId) payload.branchId = new Types.ObjectId(data.branchId);
    if (data.products) {
      payload.products = data.products.map((p: any) => ({
        productId: new Types.ObjectId(p.productId),
        flashSalePrice: p.flashSalePrice,
        limitQuantity: p.limitQuantity,
        soldQuantity: p.soldQuantity ?? 0,
      }));
    }
    payload.updatedBy = new Types.ObjectId(caller.userId);

    return flashSaleRepository.updateFlashSale(id, payload);
  }

  async deleteFlashSale(caller: CallerContext, id: string): Promise<void> {
    const flashSale = await flashSaleRepository.findFlashSaleById(id);
    if (!flashSale) {
      throw new AppError('Flash sale not found', 404);
    }

    if (caller.role === 'staff') {
      throw new AppError('Permission denied. Staff cannot delete flash sales.', 403);
    }

    // Branch manager permission check
    if (caller.role === 'branch_manager') {
      if (flashSale.scope === 'global' || flashSale.branchId?.toString() !== caller.branchId) {
        throw new AppError('You can only delete flash sales of your own branch.', 403);
      }
    }

    await flashSaleRepository.deleteFlashSale(id);
  }

  async getActiveFlashSale(branchId?: string): Promise<IFlashSale | null> {
    return flashSaleRepository.findActiveFlashSale(branchId);
  }
}

export const flashSaleService = new FlashSaleService();
