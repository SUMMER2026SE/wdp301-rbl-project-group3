"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_config_1 = require("./config/env.config");
const database_config_1 = require("./config/database.config");
const index_1 = __importDefault(require("./routes/index"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const maintenanceMode_middleware_1 = require("./middlewares/maintenanceMode.middleware");
const app = (0, express_1.default)();
// ─── Security Middlewares ──────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: env_config_1.env.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Refresh-Token', 'X-Device-Type'],
}));
// ─── Body Parsers ──────────────────────────────────────────
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// ─── Health Check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// ─── Maintenance Mode Guard ────────────────────────────────
app.use(maintenanceMode_middleware_1.maintenanceModeMiddleware);
// ─── API Routes ────────────────────────────────────────────
app.use('/api', index_1.default);
// ─── 404 Handler ───────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});
// ─── Global Error Handler ──────────────────────────────────
app.use(errorHandler_middleware_1.errorHandler);
// ─── Start Server ──────────────────────────────────────────
const start = async () => {
    await (0, database_config_1.connectDatabase)();
    app.listen(env_config_1.env.port, () => {
        console.log(`Server running on port ${env_config_1.env.port} [${env_config_1.env.nodeEnv}]`);
    });
};
start();
exports.default = app;
//# sourceMappingURL=app.js.map