"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = void 0;
const tslib_1 = require("tslib");
const desugar_1 = require("./desugar/desugar");
const remove_unused_bindings_1 = require("./optimisations/remove-unused-bindings/remove-unused-bindings");
const parse_1 = tslib_1.__importDefault(require("./parser/parse"));
const attach_prelude_1 = require("./prelude/attach-prelude");
const type_checker_1 = require("./type-checker");
const unique_id_generator_1 = require("./utils/unique-id-generator");
function compile(code, options) {
    var _a, _b;
    const prelude = (_a = options === null || options === void 0 ? void 0 : options.prelude) !== null && _a !== void 0 ? _a : true;
    const removeUnused = (_b = options === null || options === void 0 ? void 0 : options.removeUnused) !== null && _b !== void 0 ? _b : true;
    const { value: expression } = parse_1.default(code);
    if (!expression) {
        return { messages: ['Failed to parse code'] };
    }
    const makeUniqueId = unique_id_generator_1.uniqueIdStream();
    const expressionWithPrelude = prelude ? attach_prelude_1.attachPrelude(expression) : expression;
    const [typeMessages, typedNode] = type_checker_1.checkTypes(makeUniqueId, expressionWithPrelude);
    const desugaredNode = desugar_1.desugar(makeUniqueId, typedNode);
    const optimizedNode = removeUnused ? remove_unused_bindings_1.removeUnusedBindings(desugaredNode) : desugaredNode;
    return {
        expression: desugar_1.stripCoreNode(optimizedNode),
        node: optimizedNode,
        messages: typeMessages,
    };
}
exports.compile = compile;
//# sourceMappingURL=api.js.map