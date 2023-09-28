"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findMatchingImplementations = void 0;
const converge_values_1 = require("../converge-values");
const state_recorder_1 = require("../state-recorder/state-recorder");
const visitor_utils_1 = require("../visitor-utils");
function filterBindingsBy(scope, f) {
    const accumulator = [];
    for (const name in scope.bindings) {
        if (f(scope.bindings[name], name)) {
            accumulator.push([name, scope.bindings[name]]);
        }
    }
    return accumulator;
}
function findBinding(scope, name) {
    return scope.bindings[name];
}
/**
 * Used to determine if a value has a built in implementation such as for Integers and Strings.
 */
function hasBuiltInImplementation(scope, value) {
    // Strip meaningless wrappers from the value
    const innerValue = visitor_utils_1.visitAndTransformValue((value) => {
        switch (value.kind) {
            case 'DualBinding':
                if (value.left.kind === 'FreeVariable' && findBinding(scope, value.left.name) === undefined) {
                    return value.right;
                }
                if (value.right.kind === 'FreeVariable' && findBinding(scope, value.right.name) === undefined) {
                    return value.left;
                }
                return value;
            default:
                return value;
        }
    })(value);
    if (innerValue.kind === 'DataValue'
        && innerValue.name.kind === 'SymbolLiteral'
        && innerValue.parameters.length === 1
        && (innerValue.name.name === 'Integer'
            && innerValue.parameters[0].kind === 'NumberLiteral'
            && Number.isInteger(innerValue.parameters[0].value)
            || innerValue.name.name === 'Float'
                && innerValue.parameters[0].kind === 'NumberLiteral'
            || innerValue.name.name === 'String'
                && innerValue.parameters[0].kind === 'StringLiteral')) {
        return innerValue;
    }
    if (innerValue.kind === 'ApplicationValue'
        && innerValue.callee.kind === 'FreeVariable'
        && (innerValue.parameter.kind === 'StringLiteral'
            || innerValue.parameter.kind === 'NumberLiteral')) {
        const name = innerValue.parameter.kind === 'StringLiteral' ? 'String'
            : Number.isInteger(innerValue.parameter.value) ? 'Integer' : 'Float';
        return {
            kind: 'DataValue',
            name: { name, kind: 'SymbolLiteral' },
            parameters: [innerValue.parameter],
        };
    }
    return undefined;
}
const canSatisfyShape = (shape) => (child) => {
    // TODO fix converge expression requirements types
    const messageState = new state_recorder_1.StateRecorder();
    converge_values_1.convergeValues(messageState, shape, null, child, null, 'leftSpecific');
    return messageState.values.length === 0;
};
function findMatchingImplementations(scope, value) {
    const builtInImplementation = hasBuiltInImplementation(scope, value);
    if (builtInImplementation) {
        return [['BUILT_IN', builtInImplementation]];
    }
    return filterBindingsBy(scope, canSatisfyShape(value));
}
exports.findMatchingImplementations = findMatchingImplementations;
//# sourceMappingURL=find-matching-implementation.js.map