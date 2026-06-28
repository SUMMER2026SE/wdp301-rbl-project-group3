import { Request, Response, NextFunction } from 'express';
import { systemSettingRepository } from '../modules/system-setting/system-setting.repository';
import { verifyAccessToken } from '../utils/token.util';

// Cache the maintenance mode value for 30 seconds to avoid hitting DB on every request
let cachedMaintenanceMode: boolean = false;
let cacheExpiresAt: number = 0;

const CACHE_TTL_MS = 30_000; // 30 seconds

async function getMaintenanceMode(): Promise<boolean> {
  const now = Date.now();
  if (now < cacheExpiresAt) return cachedMaintenanceMode;

  try {
    const setting = await systemSettingRepository.findByKey('maintenance_mode');
    cachedMaintenanceMode = setting?.value === true;
    cacheExpiresAt = now + CACHE_TTL_MS;
  } catch {
    // If DB is unreachable, don't block traffic
    cachedMaintenanceMode = false;
  }

  return cachedMaintenanceMode;
}

// Call this to immediately invalidate the cache (used when admin toggles the setting)
export function invalidateMaintenanceCache(): void {
  cacheExpiresAt = 0;
}

// Routes that are always accessible even during maintenance
const MAINTENANCE_WHITELIST = [
  '/api/auth/login',
  '/api/auth/google-login',
  '/api/auth/refresh-token',
  '/api/auth/logout',
  '/api/settings/public',
  '/health',
];

function isWhitelisted(path: string): boolean {
  return MAINTENANCE_WHITELIST.some((p) => path.startsWith(p));
}

function isAdminOrStaff(req: Request): boolean {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return false;
    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    return ['admin', 'branch_manager', 'staff'].includes(payload.role);
  } catch {
    return false;
  }
}

export const maintenanceModeMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Always allow whitelisted paths
    if (isWhitelisted(req.path)) {
      next();
      return;
    }

    const isMaintenance = await getMaintenanceMode();

    if (!isMaintenance) {
      next();
      return;
    }

    // Admin/staff can bypass maintenance mode
    if (isAdminOrStaff(req)) {
      next();
      return;
    }

    res.status(503).json({
      success: false,
      code: 'MAINTENANCE_MODE',
      message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
      retryAfter: 30,
    });
  } catch {
    next();
  }
};
