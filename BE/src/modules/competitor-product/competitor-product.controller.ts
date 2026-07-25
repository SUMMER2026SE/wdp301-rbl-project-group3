import { Request, Response } from 'express';
import { competitorProductService } from './competitor-product.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { AppError } from '../../middlewares/errorHandler.middleware';

export class CompetitorProductController {
  getCompetitorProducts = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, keyword } = req.query;
    
    const result = await competitorProductService.getCompetitorProducts({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      keyword: keyword ? String(keyword) : undefined,
    });

    sendSuccess(res, result, 'Competitor products retrieved successfully', 200);
  });

  importToCatalog = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('Please provide an array of competitor product IDs');
    }

    const result = await competitorProductService.importToCatalog(ids);
    sendSuccess(res, result, `Successfully imported ${result.importedCount} products to catalog`, 200);
  });

  deleteCompetitorProducts = asyncHandler(async (req: Request, res: Response) => {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Please provide an array of competitor product IDs', 400);
    }

    const result = await competitorProductService.deleteCompetitorProducts(ids);
    sendSuccess(res, result, `Successfully deleted ${result.deletedCount} products`, 200);
  });
}

export const competitorProductController = new CompetitorProductController();
