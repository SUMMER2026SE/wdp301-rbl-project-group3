import { UserRole } from '../../types/common.types';

export interface CallerContext {
  userId: string;
  role: UserRole;
  branchId?: string;
}
/**
 * Supports backend composition, shared contracts, scheduled work, or operational data maintenance.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
