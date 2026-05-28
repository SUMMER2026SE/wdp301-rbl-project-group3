"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dns_1 = __importDefault(require("dns"));
const env_config_1 = require("./env.config");
// Apply DNS guard for Windows/local environments
try {
    const dnsServers = dns_1.default.getServers();
    if (!dnsServers || dnsServers.length === 0 || (dnsServers.length === 1 && dnsServers[0] === '127.0.0.1')) {
        dns_1.default.setServers(['8.8.8.8', '1.1.1.1']);
        console.log('DNS servers configured for database connection.');
    }
}
catch (dnsErr) {
    console.warn('Failed to configure DNS servers:', dnsErr);
}
const connectDatabase = async () => {
    try {
        await mongoose_1.default.connect(env_config_1.env.mongodbUri);
        console.log('MongoDB connected');
    }
    catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
//# sourceMappingURL=database.config.js.map