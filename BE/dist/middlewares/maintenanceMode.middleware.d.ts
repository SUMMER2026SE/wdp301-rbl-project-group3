import { Request, Response, NextFunction } from 'express';
export declare function invalidateMaintenanceCache(): void;
export declare const maintenanceModeMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=maintenanceMode.middleware.d.ts.map