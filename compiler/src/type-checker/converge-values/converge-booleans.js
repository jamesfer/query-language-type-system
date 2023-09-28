"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeBooleans = void 0;
const converge_utils_1 = require("./converge-utils");
function convergeBooleans(messageState, state, boolean, other) {
    return other.kind === 'BooleanLiteral' && other.value === boolean.value
        ? []
        : converge_utils_1.mismatchResult(messageState, state, boolean, other);
}
exports.convergeBooleans = convergeBooleans;
//# sourceMappingURL=converge-booleans.js.map