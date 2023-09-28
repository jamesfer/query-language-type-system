"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convergeFreeVariableOnRight = void 0;
const converge_utils_1 = require("./converge-utils");
function convergeFreeVariableOnRight(state, left, right) {
    // If the two variables are identical
    if (left.kind === 'FreeVariable' && left.name === right.name) {
        return [];
    }
    // Infer the free variable as the right
    return [converge_utils_1.inferredType(state, right.name, left)];
}
exports.convergeFreeVariableOnRight = convergeFreeVariableOnRight;
//# sourceMappingURL=converge-free-variable-on-right.js.map