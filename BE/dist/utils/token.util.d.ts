import { JwtAccessPayload, JwtRefreshPayload, UserRole } from '../types/common.types';
export declare const generateAccessToken: (payload: JwtAccessPayload) => string;
export declare const generateRefreshToken: (payload: JwtRefreshPayload) => string;
export declare const verifyAccessToken: (token: string) => JwtAccessPayload;
export declare const verifyRefreshToken: (token: string) => JwtRefreshPayload;
export declare const generateTokenPair: (user: {
    _id: {
        toString(): string;
    };
    email: string;
    role: UserRole;
    refreshTokenVersion: number;
}, tokenId: string) => {
    accessToken: string;
    refreshToken: string;
};
//# sourceMappingURL=token.util.d.ts.map