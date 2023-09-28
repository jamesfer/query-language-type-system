"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recursivelyApplyInferredTypes = void 0;
const iterators_specific_1 = require("../../desugar/iterators-specific");
const constructors_1 = require("../constructors");
const visitor_utils_1 = require("../visitor-utils");
const count_map_1 = require("../../utils/count-map");
function applyCompressedInferredTypesRecursively(inferredTypes, value, visitedVariables) {
    return visitor_utils_1.visitAndTransformValue((value) => {
        if (value.kind !== 'FreeVariable' || !(value.name in inferredTypes)) {
            return value;
        }
        // If the type is recursive, skip it
        if (visitedVariables.has(value.name)) {
            return value;
        }
        visitedVariables.increment(value.name);
        const result = applyCompressedInferredTypesRecursively(inferredTypes, inferredTypes[value.name].to, visitedVariables);
        visitedVariables.decrement(value.name);
        return result;
    })(value);
}
function applyCompressedInferredTypes(inferredTypes, value) {
    return applyCompressedInferredTypesRecursively(inferredTypes, value, new count_map_1.CountMap());
}
const applyInferredTypesAttachedTypeNode = (inferredTypes) => (node) => {
    const shape = applyCompressedInferredTypes(inferredTypes, constructors_1.freeVariable(node.decoration.shapeName));
    const type = applyCompressedInferredTypes(inferredTypes, node.decoration.type);
    return Object.assign(Object.assign({}, node), { decoration: { shape, type } });
};
function recursivelyApplyInferredTypes(inferredTypes) {
    const applyTypes = applyInferredTypesAttachedTypeNode(inferredTypes);
    const internal = (node) => applyTypes(visitor_utils_1.mapNode(iterator, node));
    const iterator = iterators_specific_1.makeExpressionIterator(internal);
    return internal;
}
exports.recursivelyApplyInferredTypes = recursivelyApplyInferredTypes;
//# sourceMappingURL=recursively-apply-inferred-types.js.map