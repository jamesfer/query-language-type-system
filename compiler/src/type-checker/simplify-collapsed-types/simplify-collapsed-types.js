"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyCollapsedTypes = void 0;
const lodash_1 = require("lodash");
const visitor_utils_1 = require("../visitor-utils");
const count_map_1 = require("../../utils/count-map");
const utils_1 = require("../utils");
const shallow_strip_implicits_1 = require("../utils/shallow-strip-implicits");
function cacheValues(f) {
    const cache = {};
    return (value) => {
        if (value.kind === 'FreeVariable' && value.name in cache) {
            return cache[value.name];
        }
        const result = f(value);
        if (value.kind === 'FreeVariable') {
            cache[value.name] = result;
        }
        return result;
    };
}
function protectAgainstRecursiveTypes(f) {
    const visitedVariables = new count_map_1.CountMap();
    return (value) => {
        if (value.kind !== 'FreeVariable') {
            return f(value);
        }
        if (visitedVariables.has(value.name)) {
            return value;
        }
        visitedVariables.increment(value.name);
        const result = f(value);
        visitedVariables.decrement(value.name);
        return result;
    };
}
function simplifyValue(collapsedTypes, recursivelySimplifyValue) {
    return visitor_utils_1.visitAndTransformValue((value) => {
        if (value.kind !== 'FreeVariable' || !(value.name in collapsedTypes)) {
            return value;
        }
        // If the type is recursive, skip it
        // if (visitedVariables.has(value.name)) {
        //   return value;
        // }
        // visitedVariables.increment(value.name);
        const result = recursivelySimplifyValue(collapsedTypes[value.name].to);
        // visitedVariables.decrement(value.name);
        return result;
    });
}
function simplifyCollapsedTypes(collapsedTypes) {
    return lodash_1.mapValues(collapsedTypes, (collapsedType) => {
        // This pipe utility is in the reverse order
        const simplifyValueRecursively = utils_1.pipe(cacheValues, protectAgainstRecursiveTypes, simplifyValue(collapsedTypes, value => simplifyValueRecursively(value)));
        const simplifiedValue = simplifyValueRecursively(collapsedType.to);
        const strippedValue = collapsedType.operator === 'EvaluatedFrom'
            ? shallow_strip_implicits_1.shallowStripImplicits(simplifiedValue)
            : simplifiedValue;
        return {
            from: collapsedType.from,
            to: strippedValue,
        };
    });
}
exports.simplifyCollapsedTypes = simplifyCollapsedTypes;
//# sourceMappingURL=simplify-collapsed-types.js.map