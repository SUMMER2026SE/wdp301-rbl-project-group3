import { Request, Response } from 'express';
import { productService } from './product.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

export class ProductController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.createProduct(req.body);
    sendSuccess(res, { product }, 'Product created', 201);
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const products = await productService.getProducts({
      status: req.query.status as string | undefined,
      keyword: req.query.keyword as string | undefined,
    });
    sendSuccess(res, { products }, 'Products retrieved');
  });
}

export const productController = new ProductController();
