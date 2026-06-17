import { Request, Response } from 'express';
import { categoryService } from './category.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

export class CategoryController {
  create = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.createCategory(req.body);
    sendSuccess(res, { category }, 'Category created', 201);
  });

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const categories = await categoryService.getCategories({
      status: req.query.status as string | undefined,
      keyword: req.query.keyword as string | undefined,
    });
    sendSuccess(res, { categories }, 'Categories retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.getCategoryById(String(req.params.id));
    sendSuccess(res, { category }, 'Category retrieved');
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.updateCategory(String(req.params.id), req.body);
    sendSuccess(res, { category }, 'Category updated');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const category = await categoryService.deleteCategory(String(req.params.id));
    sendSuccess(res, { category }, 'Category deleted');
  });
}

export const categoryController = new CategoryController();
