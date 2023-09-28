"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeApplications = void 0;
const converge_utils_1 = require("./converge-utils");
const converge_values_with_state_1 = require("./converge-values-with-state");
function convergeApplications(messageState, state, application, other) {
    switch (other.kind) {
        case 'ApplicationValue':
            return [
                ...converge_values_with_state_1.convergeValuesWithState(messageState, state, application.callee, other.callee),
                ...converge_values_with_state_1.convergeValuesWithState(messageState, state, application.parameter, other.parameter),
            ];
        case 'DataValue':
            if (other.parameters.length === 0) {
                return converge_utils_1.mismatchResult(messageState, state, application, other);
            }
            return [
                ...converge_values_with_state_1.convergeValuesWithState(messageState, state, application.callee, Object.assign(Object.assign({}, other), { parameters: other.parameters.slice(0, -1) })),
                ...converge_values_with_state_1.convergeValuesWithState(messageState, state, application.parameter, other.parameters[other.parameters.length - 1]),
            ];
        default:
            return converge_utils_1.mismatchResult(messageState, state, application, other);
    }
}
exports.convergeApplications = convergeApplications;
//# sourceMappingURL=converge-applications.js.map