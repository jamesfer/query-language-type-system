"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const remove_unused_bindings_1 = require("./optimisations/remove-unused-bindings/remove-unused-bindings");
const parse_1 = tslib_1.__importDefault(require("./parser/parse"));
const attach_prelude_1 = require("./prelude/attach-prelude");
const constructors_1 = require("./type-checker/constructors");
const evaluate_1 = require("./type-checker/evaluate");
const run_type_phase_1 = require("./type-checker/run-type-phase");
const strip_nodes_1 = require("./type-checker/strip-nodes");
function compile(code, options) {
    var _a, _b;
    const prelude = (_a = options === null || options === void 0 ? void 0 : options.prelude) !== null && _a !== void 0 ? _a : true;
    const removeUnused = (_b = options === null || options === void 0 ? void 0 : options.removeUnused) !== null && _b !== void 0 ? _b : true;
    const { value: expression } = parse_1.default(code);
    if (!expression) {
        return { messages: ['Failed to parse code'] };
    }
    const [typeMessages, typedNode] = run_type_phase_1.runTypePhase(prelude ? attach_prelude_1.attachPrelude(expression) : expression);
    const optimizedNode = removeUnused ? remove_unused_bindings_1.removeUnusedBindings(typedNode) : typedNode;
    return {
        expression: strip_nodes_1.stripNode(optimizedNode),
        node: optimizedNode,
        messages: typeMessages,
    };
}
exports.compile = compile;
function evaluate(code) {
    const { expression } = compile(code);
    if (expression) {
        return evaluate_1.evaluateExpression(constructors_1.evaluationScope())(expression);
    }
    return undefined;
}
exports.evaluate = evaluate;
//# sourceMappingURL=api.js.map