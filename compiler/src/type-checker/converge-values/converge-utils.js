"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inferredType = exports.mismatchResult = exports.mismatchMessage = void 0;
const value_to_string_1 = require("../utils/value-to-string");
function mismatchMessage(state, leftValue, rightValue) {
    const leftValueString = value_to_string_1.valueToString(leftValue);
    const leftEntireValueString = value_to_string_1.valueToString(state.leftEntireValue);
    const rightValueString = value_to_string_1.valueToString(rightValue);
    const rightEntireValueString = value_to_string_1.valueToString(state.rightEntireValue);
    return `Type mismatch between ${leftValueString} and ${rightValueString} in context ${leftEntireValueString} and ${rightEntireValueString}`;
}
exports.mismatchMessage = mismatchMessage;
function mismatchResult(messageState, state, leftValue, rightValue) {
    messageState.push(mismatchMessage(state, leftValue, rightValue));
    return [];
}
exports.mismatchResult = mismatchResult;
function inferredType(state, from, to) {
    return {
        from,
        to,
        originatingExpression: state.leftExpression,
        inferringExpression: state.rightExpression,
    };
}
exports.inferredType = inferredType;
//# sourceMappingURL=converge-utils.js.map