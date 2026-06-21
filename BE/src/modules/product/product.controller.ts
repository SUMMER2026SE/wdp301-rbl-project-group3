import { Request, Response } from 'express';
import { productService } from './product.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';
import { listProductsSchema } from './product.validation';

export class ProductController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const { query } = listProductsSchema.parse({
      query: req.query,
      body: req.body,
      params: req.params,
    });

    const result = await productService.listProducts(query);
    sendSuccess(res, result, 'Products retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.getProductById(String(req.params.id));
    sendSuccess(res, { product }, 'Product retrieved');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.createProduct(
      req.body,
      req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : undefined
    );
    sendSuccess(res, { product }, 'Product created', 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.updateProduct(
      String(req.params.id),
      req.body,
      req.file ? { buffer: req.file.buffer, mimetype: req.file.mimetype } : undefined
    );
    sendSuccess(res, { product }, 'Product updated');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.deleteProduct(String(req.params.id));
    sendSuccess(res, { product }, 'Product deleted');
  });
}

export const productController = new ProductController();
