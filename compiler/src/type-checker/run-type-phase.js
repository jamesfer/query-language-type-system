"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTypePhaseWithoutRename = exports.runTypePhase = void 0;
const constructors_1 = require("./constructors");
const monad_utils_1 = require("./monad-utils");
const rename_free_variables_1 = require("./rename-free-variables");
const resolve_implicits_1 = require("./resolve-implicits");
const type_check_1 = require("./type-check");
const utils_1 = require("./utils");
function runTypePhase(expression) {
    const makeUniqueId = utils_1.uniqueIdStream();
    const typedNodeTypeResult = exports.runTypePhaseWithoutRename(makeUniqueId)(constructors_1.scope())(rename_free_variables_1.renameFreeVariables(expression));
    const { state: [messages], value: node } = typedNodeTypeResult;
    return [messages, node];
}
exports.runTypePhase = runTypePhase;
exports.runTypePhaseWithoutRename = (makeUniqueId) => (scope) => (expression) => {
    const state = new monad_utils_1.TypeWriter(scope);
    const node = state.run(type_check_1.typeExpression(makeUniqueId))(expression);
    const [resolvingMessages, resolvedNode] = resolve_implicits_1.resolveImplicitParameters(node);
    state.logAll(resolvingMessages);
    return state.wrap(resolvedNode);
};
//# sourceMappingURL=run-type-phase.js.map