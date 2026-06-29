import { UserRole } from './common.types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: UserRole;
        tokenVersion: number;
        branchId?: string;
      };
    }
  }
}