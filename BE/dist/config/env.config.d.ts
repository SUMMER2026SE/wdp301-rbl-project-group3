export declare const env: {
    port: number;
    nodeEnv: string;
    isProduction: boolean;
    mongodbUri: string;
    jwt: {
        accessSecret: string;
        refreshSecret: string;
        accessExpiresIn: string;
        refreshExpiresIn: string;
        refreshExpiresInMs: number;
    };
    email: {
        host: string;
        port: number;
        user: string;
        pass: string;
        from: string;
    };
    clientUrl: string;
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    google: {
        clientId: string;
    };
};
//# sourceMappingURL=env.config.d.ts.map