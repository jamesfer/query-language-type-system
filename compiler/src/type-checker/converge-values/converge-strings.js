"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeStrings = void 0;
const converge_utils_1 = require("./converge-utils");
function convergeStrings(messageState, state, string, other) {
    return other.kind === 'StringLiteral' && other.value === string.value
        ? []
        : converge_utils_1.mismatchResult(messageState, state, string, other);
}
exports.convergeStrings = convergeStrings;
//# sourceMappingURL=converge-strings.js.map