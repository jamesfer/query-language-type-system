"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeDualBindingOnLeft = void 0;
const converge_values_with_state_1 = require("./converge-values-with-state");
/**
 * Attempts to converge the left and right sides of the dual binding to the same value.
 */
function convergeDualBindingOnLeft(messagesState, state, left, right) {
    return [
        ...converge_values_with_state_1.convergeValuesWithState(messagesState, state, left.left, right),
        ...converge_values_with_state_1.convergeValuesWithState(messagesState, state, left.right, right),
    ];
}
exports.convergeDualBindingOnLeft = convergeDualBindingOnLeft;
//# sourceMappingURL=converge-dual-binding-on-left.js.map