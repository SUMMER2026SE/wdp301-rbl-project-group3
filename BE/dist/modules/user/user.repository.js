"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const user_model_1 = require("../../models/user.model");
class UserRepository {
    async findById(id) {
        return user_model_1.User.findById(id).exec();
    }
    async updateById(id, data) {
        return user_model_1.User.findByIdAndUpdate(id, data, { new: true }).exec();
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map