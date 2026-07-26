import { Request } from 'express';
import { DeviceInfo, DeviceType } from '../types/common.types';

/**
 * Normalizes client request headers into session-device metadata.
 * The implementation is shared to keep this cross-cutting behavior consistent.
 */
export const extractDeviceInfo = (req: Request): DeviceInfo => {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    '';

  const deviceHeader = req.headers['x-device-type'] as string | undefined;
  let deviceType: DeviceType = 'unknown';

  if (deviceHeader === 'mobile') {
    deviceType = 'mobile';
  } else if (deviceHeader === 'web') {
    deviceType = 'web';
  } else if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    deviceType = 'mobile';
  } else if (userAgent) {
    deviceType = 'web';
  }

  let deviceName = 'Unknown Device';
  if (/iPhone/i.test(userAgent)) deviceName = 'iPhone';
  else if (/iPad/i.test(userAgent)) deviceName = 'iPad';
  else if (/Android/i.test(userAgent)) deviceName = 'Android Device';
  else if (/Windows/i.test(userAgent)) deviceName = 'Windows PC';
  else if (/Macintosh/i.test(userAgent)) deviceName = 'Mac';
  else if (/Linux/i.test(userAgent)) deviceName = 'Linux';

  return { deviceType, deviceName, ipAddress, userAgent };
};
/**
 * Shared backend utility that keeps this concern consistent across feature modules.
 * This file is intentionally kept focused so callers depend on one clear responsibility.
 */
