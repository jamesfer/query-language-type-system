"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluatesToPartialType = exports.equalsPartialType = void 0;
function equalsPartialType(to) {
    return { to, operator: 'Equals' };
}
exports.equalsPartialType = equalsPartialType;
function evaluatesToPartialType(from, to) {
    return { from, to, operator: 'EvaluatesTo' };
}
exports.evaluatesToPartialType = evaluatesToPartialType;
//# sourceMappingURL=partial-type.js.map