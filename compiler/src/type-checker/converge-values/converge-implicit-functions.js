"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeImplicitFunctions = void 0;
const converge_utils_1 = require("./converge-utils");
const converge_values_with_state_1 = require("./converge-values-with-state");
function convergeImplicitFunctions(messageState, state, implicitFunction, other) {
    if (other.kind !== 'ImplicitFunctionLiteral') {
        return converge_utils_1.mismatchResult(messageState, state, implicitFunction, other);
    }
    return [
        ...converge_values_with_state_1.convergeValuesWithState(messageState, Object.assign(Object.assign({}, state), { direction: 'leftSpecific' }), implicitFunction.parameter, other.parameter),
        ...converge_values_with_state_1.convergeValuesWithState(messageState, state, implicitFunction.body, other.body),
    ];
}
exports.convergeImplicitFunctions = convergeImplicitFunctions;
//# sourceMappingURL=converge-implicit-functions.js.map