export type UserRole = 'superadmin' | 'admin' | 'manager' | 'staff' | 'customer';
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
}

export interface DeviceInfo {
  deviceType: DeviceType;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
}