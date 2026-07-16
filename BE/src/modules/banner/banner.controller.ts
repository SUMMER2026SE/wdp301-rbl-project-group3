import { Request, Response } from 'express';
import { bannerService } from './banner.service';
import { listBannersSchema } from './banner.validation';
import { asyncHandler } from '../../utils/asyncHandler';
import { sendSuccess } from '../../utils/response.util';

export class BannerController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const { query } = listBannersSchema.parse({
      query: req.query,
      body: req.body,
      params: req.params,
    });

    const page = query.page || 1;
    const limit = query.limit || 20;

    const result = await bannerService.listBanners(
      { status: query.status },
      page,
      limit
    );

    sendSuccess(res, result, 'Banners retrieved');
  });

  getActive = asyncHandler(async (_req: Request, res: Response) => {
    const banners = await bannerService.getActiveBanners();
    sendSuccess(res, { banners }, 'Active banners retrieved');
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const banner = await bannerService.getBannerById(String(req.params.id));
    sendSuccess(res, { banner }, 'Banner retrieved');
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const fileData = req.file
      ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
      : undefined;

    const creatorId = req.user?.userId;

    const banner = await bannerService.createBanner(
      req.body,
      fileData,
      creatorId
    );

    sendSuccess(res, { banner }, 'Banner created', 201);
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const fileData = req.file
      ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
      : undefined;

    const banner = await bannerService.updateBanner(
      String(req.params.id),
      req.body,
      fileData
    );

    sendSuccess(res, { banner }, 'Banner updated');
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const banner = await bannerService.deleteBanner(String(req.params.id));
    sendSuccess(res, { banner }, 'Banner deleted');
  });
}

export const bannerController = new BannerController();
