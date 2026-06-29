"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.returnController = exports.ReturnController = void 0;
const asyncHandler_1 = require("../../utils/asyncHandler");
const response_util_1 = require("../../utils/response.util");
const return_validation_1 = require("./return.validation");
const return_service_1 = require("./return.service");
function actorFrom(req) {
    return { userId: req.user.userId, role: req.user.role };
}
class ReturnController {
    constructor() {
        this.list = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { query } = return_validation_1.listReturnsSchema.parse({ query: req.query });
            const result = await return_service_1.returnService.listReturns(query, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, result, 'Return requests retrieved');
        });
        this.getById = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const request = await return_service_1.returnService.getReturn(String(req.params.id), actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { returnRequest: request }, 'Return request retrieved');
        });
        this.create = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { body } = return_validation_1.createReturnSchema.parse({ body: req.body });
            const request = await return_service_1.returnService.createReturn(body, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { returnRequest: request }, 'Return request created', 201);
        });
        this.update = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { params, body } = return_validation_1.updateReturnSchema.parse({
                params: req.params,
                body: req.body,
            });
            const request = await return_service_1.returnService.updateReturn(params.id, body, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { returnRequest: request }, 'Return request updated');
        });
        this.cancel = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { params, body } = return_validation_1.cancelReturnSchema.parse({
                params: req.params,
                body: req.body,
            });
            const request = await return_service_1.returnService.cancelReturn(params.id, body.reason, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { returnRequest: request }, 'Return request cancelled');
        });
        this.approve = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { params, body } = return_validation_1.resolveReturnSchema.parse({
                params: req.params,
                body: req.body,
            });
            const request = await return_service_1.returnService.approveReturn(params.id, body.note, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { returnRequest: request }, 'Return request approved');
        });
        this.reject = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { params, body } = return_validation_1.rejectReturnSchema.parse({
                params: req.params,
                body: req.body,
            });
            const request = await return_service_1.returnService.rejectReturn(params.id, body.note, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { returnRequest: request }, 'Return request rejected');
        });
        this.complete = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
            const { params, body } = return_validation_1.completeReturnSchema.parse({
                params: req.params,
                body: req.body,
            });
            const request = await return_service_1.returnService.completeReturn(params.id, body, actorFrom(req));
            (0, response_util_1.sendSuccess)(res, { returnRequest: request }, 'Return request completed');
        });
    }
}
exports.ReturnController = ReturnController;
exports.returnController = new ReturnController();
//# sourceMappingURL=return.controller.js.map