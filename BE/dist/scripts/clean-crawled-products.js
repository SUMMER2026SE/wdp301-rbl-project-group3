"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("../config/env.config");
const product_model_1 = require("../models/product.model");
const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(env_config_1.env.mongodbUri);
        console.log('Connected to MongoDB');
        // Crawled products have numeric SKUs (e.g., 10141374)
        const result = await product_model_1.Product.deleteMany({
            sku: /^\d+$/
        });
        console.log(`Successfully deleted ${result.deletedCount} crawled products from Product collection.`);
    }
    catch (error) {
        console.error('Error during cleanup:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
};
run();
//# sourceMappingURL=clean-crawled-products.js.map