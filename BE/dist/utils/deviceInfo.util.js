"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractDeviceInfo = void 0;
const extractDeviceInfo = (req) => {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        '';
    const deviceHeader = req.headers['x-device-type'];
    let deviceType = 'unknown';
    if (deviceHeader === 'mobile') {
        deviceType = 'mobile';
    }
    else if (deviceHeader === 'web') {
        deviceType = 'web';
    }
    else if (/mobile|android|iphone|ipad/i.test(userAgent)) {
        deviceType = 'mobile';
    }
    else if (userAgent) {
        deviceType = 'web';
    }
    let deviceName = 'Unknown Device';
    if (/iPhone/i.test(userAgent))
        deviceName = 'iPhone';
    else if (/iPad/i.test(userAgent))
        deviceName = 'iPad';
    else if (/Android/i.test(userAgent))
        deviceName = 'Android Device';
    else if (/Windows/i.test(userAgent))
        deviceName = 'Windows PC';
    else if (/Macintosh/i.test(userAgent))
        deviceName = 'Mac';
    else if (/Linux/i.test(userAgent))
        deviceName = 'Linux';
    return { deviceType, deviceName, ipAddress, userAgent };
};
exports.extractDeviceInfo = extractDeviceInfo;
//# sourceMappingURL=deviceInfo.util.js.map