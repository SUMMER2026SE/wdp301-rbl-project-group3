"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const env_config_1 = require("../config/env.config");
const product_model_1 = require("../models/product.model");
const string_util_1 = require("../utils/string.util");
const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose_1.default.connect(env_config_1.env.mongodbUri);
        console.log('Connected to MongoDB');
        const products = await product_model_1.Product.find({});
        console.log(`Found ${products.length} products. Starting normalization...`);
        let updatedCount = 0;
        for (const product of products) {
            const normalizedName = (0, string_util_1.normalizeString)(product.name);
            const normalizedBrand = product.brand ? (0, string_util_1.normalizeString)(product.brand) : undefined;
            const normalizedUnit = (0, string_util_1.normalizeString)(product.unit || 'item');
            product.normalizedName = normalizedName;
            product.normalizedBrand = normalizedBrand;
            product.normalizedUnit = normalizedUnit;
            await product.save();
            updatedCount++;
        }
        console.log(`Successfully normalized ${updatedCount} products.`);
    }
    catch (error) {
        console.error('Error during normalization:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
};
run();
//# sourceMappingURL=normalize-products.js.map