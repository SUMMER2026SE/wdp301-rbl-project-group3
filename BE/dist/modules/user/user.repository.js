"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const user_model_1 = require("../../models/user.model");
class UserRepository {
    async findById(id) {
        return user_model_1.User.findById(id).exec();
    }
    async updateProfileById(id, data) {
        // Chỉ pick các field được phép — tránh mass-assignment dù service có bug
        const safeData = {};
        if (data.fullName !== undefined)
            safeData.fullName = data.fullName;
        if (data.phone !== undefined)
            safeData.phone = data.phone;
        if (data.address !== undefined)
            safeData.address = data.address;
        return user_model_1.User.findByIdAndUpdate(id, { $set: safeData }, { new: true, runValidators: true }).exec();
    }
    async updateAvatarById(id, avatarUrl) {
        return user_model_1.User.findByIdAndUpdate(id, { $set: { avatarUrl } }, { new: true }).exec();
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
//# sourceMappingURL=user.repository.js.map