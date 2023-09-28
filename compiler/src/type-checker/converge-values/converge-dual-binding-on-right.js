"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeDualBindingOnRight = void 0;
const converge_values_with_state_1 = require("./converge-values-with-state");
/**
 * Attempts to converge the left and right sides of the dual binding to the same value.
 */
function convergeDualBindingOnRight(messageState, state, left, right) {
    return [
        ...converge_values_with_state_1.convergeValuesWithState(messageState, state, left, right.left),
        ...converge_values_with_state_1.convergeValuesWithState(messageState, state, left, right.right),
    ];
}
exports.convergeDualBindingOnRight = convergeDualBindingOnRight;
//# sourceMappingURL=converge-dual-binding-on-right.js.map