"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeFreeVariableOnLeft = void 0;
const converge_utils_1 = require("./converge-utils");
/**
 * Converges a free variable with a concrete type to produce an `InferredType` annotation
 */
function convergeFreeVariableOnLeft(messageState, state, left, right) {
    // If the two variables are identical
    if (right.kind === 'FreeVariable' && right.name === left.name) {
        return [];
    }
    if (state.direction === 'either') {
        return [converge_utils_1.inferredType(state, left.name, right)];
    }
    return converge_utils_1.mismatchResult(messageState, state, left, right);
}
exports.convergeFreeVariableOnLeft = convergeFreeVariableOnLeft;
//# sourceMappingURL=converge-free-variable-on-left.js.map