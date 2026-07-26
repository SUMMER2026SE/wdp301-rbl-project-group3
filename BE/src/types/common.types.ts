export type UserRole = 'admin' | 'branch_manager' | 'staff' | 'customer';
export type UserStatus = 'active' | 'inactive' | 'banned';
export type AuthProvider = 'local' | 'google';
export type DeviceType = 'web' | 'mobile' | 'unknown';

export interface JwtAccessPayload {
  userId: string;
  email: string;
  role: UserRole;
  tokenVersion: number;
}

export interface JwtRefreshPayload {
  userId: string;
  tokenId: string;
  tokenVersion: number;
}

export interface DeviceInfo {
  deviceType: DeviceType;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
}
/**
 * Supports backend composition, shared contracts, scheduled work, or operational data maintenance.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
