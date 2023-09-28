"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeValues = void 0;
const converge_values_with_state_1 = require("./converge-values-with-state");
/**
 * Compares two types and attempts to reconcile them. Conflicts produce error messages. Free type variables produce
 * `InferredType` annotations when their type can be narrowed to one in the counterpart. `convergeValues` does not
 * guarantee that conflicting `InferredType`s will not be generated. It is the responsibility of the caller to compress
 * the inferred types which will reveal conflicts.
 */
function convergeValues(messageState, leftValue, leftExpression, rightValue, rightExpression, direction = 'either') {
    const state = {
        direction,
        leftExpression,
        rightExpression,
        leftEntireValue: leftValue,
        rightEntireValue: rightValue,
    };
    return converge_values_with_state_1.convergeValuesWithState(messageState, state, leftValue, rightValue);
}
exports.convergeValues = convergeValues;
//# sourceMappingURL=converge-values.js.map