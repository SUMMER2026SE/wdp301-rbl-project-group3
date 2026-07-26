import { Request, Response } from 'express';
import { competitorProductService } from './competitor-product.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

/**
 * HTTP adapter that validates request context and delegates business work.
 * Feature boundary: CompetitorProduct.
 */
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
}

export const competitorProductController = new CompetitorProductController();
/**
 * Translates validated HTTP requests into service calls and standardized API responses.
 * Feature boundary: competitor-product.
 */
