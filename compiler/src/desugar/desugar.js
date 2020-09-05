"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripCoreNode = exports.desugar = void 0;
const desugar_destructuring_1 = require("./desugar-destructuring");
const desugar_dual_bindings_1 = require("./desugar-dual-bindings");
const desugar_pattern_match_1 = require("./desugar-pattern-match");
function desugar(node) {
    return desugar_pattern_match_1.desugarPatternMatch(desugar_dual_bindings_1.desugarDualBindings(desugar_destructuring_1.desugarDestructuring(node)));
}
exports.desugar = desugar;
function stripCoreNode(node) {
    return desugar_pattern_match_1.stripDesugaredNodeWithoutPatternMatch(node);
}
exports.stripCoreNode = stripCoreNode;
//# sourceMappingURL=desugar.js.map