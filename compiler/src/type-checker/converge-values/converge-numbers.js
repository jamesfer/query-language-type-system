"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeNumbers = void 0;
const converge_utils_1 = require("./converge-utils");
function convergeNumbers(messageState, state, number, other) {
    return other.kind === 'NumberLiteral' && other.value === number.value
        ? []
        : converge_utils_1.mismatchResult(messageState, state, number, other);
}
exports.convergeNumbers = convergeNumbers;
//# sourceMappingURL=converge-numbers.js.map