"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exactPair = exports.evaluatedPair = void 0;
function evaluatedPair(left, right) {
    return { kind: 'Evaluated', left, right };
}
exports.evaluatedPair = evaluatedPair;
function exactPair(left, right) {
    return { kind: 'Exact', left, right };
}
exports.exactPair = exactPair;
//# sourceMappingURL=value-pair.js.map