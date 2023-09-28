"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkTypes = void 0;
const attach_shapes_1 = require("./attach-shapes");
const build_scoped_node_1 = require("./build-scoped-node");
const recursively_apply_inferred_types_1 = require("./compress-inferred-types/recursively-apply-inferred-types");
const reduce_inferred_types_1 = require("./compress-inferred-types/reduce-inferred-types");
const rename_free_variables_1 = require("./rename-free-variables");
const resolve_implicits_1 = require("./resolve-implicits");
const state_recorder_1 = require("./state-recorder/state-recorder");
const simplify_collapsed_types_1 = require("./simplify-collapsed-types/simplify-collapsed-types");
function checkTypes(makeUniqueId, expression) {
    const messageState = new state_recorder_1.StateRecorder();
    // Rename all free variables to prevent conflicts
    const renamedExpression = rename_free_variables_1.renameFreeVariables(makeUniqueId, expression);
    // Attach a partial type and a name to every node
    const [inferredTypes, namedNode] = attach_shapes_1.attachShapes(makeUniqueId, renamedExpression);
    // Compress all inferred types and detect issues where variables were inferred to different types
    // const collapsedInferredTypes = collapseInferredTypes(messageState, inferredTypes);
    const collapsedInferredTypes = reduce_inferred_types_1.reduceInferredTypes(messageState, inferredTypes);
    const simplifiedInferredTypes = simplify_collapsed_types_1.simplifyCollapsedTypes(collapsedInferredTypes);
    // Reapplies all the inferred types discovered in the previous step.
    // Type information can propagate to all expressions
    const shapedNode = recursively_apply_inferred_types_1.recursivelyApplyInferredTypes(simplifiedInferredTypes)(namedNode);
    // Builds and attaches a scope to each node
    const scopedNode = build_scoped_node_1.buildScopedNode(shapedNode);
    // Find replacements for all implicit parameters and strip them
    const [resolvedMessages, resolvedNode] = resolve_implicits_1.resolveImplicits(scopedNode);
    messageState.pushAll(resolvedMessages);
    return [messageState.values, resolvedNode];
}
exports.checkTypes = checkTypes;
//# sourceMappingURL=index.js.map