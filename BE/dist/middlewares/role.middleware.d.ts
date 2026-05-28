import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/common.types';
export declare const authorize: (...roles: UserRole[]) => (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=role.middleware.d.ts.map