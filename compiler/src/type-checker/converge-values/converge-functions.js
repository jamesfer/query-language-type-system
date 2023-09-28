"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeFunctions = void 0;
const converge_utils_1 = require("./converge-utils");
const converge_values_with_state_1 = require("./converge-values-with-state");
function convergeFunctions(messageState, state, functionValue, other) {
    if (other.kind !== 'FunctionLiteral') {
        return converge_utils_1.mismatchResult(messageState, state, functionValue, other);
    }
    return [
        ...converge_values_with_state_1.convergeValuesWithState(messageState, state, functionValue.parameter, other.parameter),
        ...converge_values_with_state_1.convergeValuesWithState(messageState, state, functionValue.body, other.body),
    ];
}
exports.convergeFunctions = convergeFunctions;
//# sourceMappingURL=converge-functions.js.map