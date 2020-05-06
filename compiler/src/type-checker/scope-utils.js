"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const constructors_1 = require("./constructors");
const evaluate_1 = require("./evaluate");
const type_utils_1 = require("./type-utils");
const visitor_utils_1 = require("./visitor-utils");
/**
 * Used to determine if a value has a built in implementation such as for Integers.
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
    return undefined;
}
function findMatchingImplementations(scope, value) {
    const builtInImplementation = hasBuiltInImplementation(scope, value);
    if (builtInImplementation) {
        return [{
                scope,
                kind: 'ScopeBinding',
                type: builtInImplementation,
                name: 'BUILT_IN',
            }];
    }
    const evaluateWithScope = evaluate_1.evaluateExpression(scopeToEScope(scope));
    return scope.bindings.filter(binding => {
        const bindingValue = binding.expression ? evaluateWithScope(binding.expression) : binding.type;
        return bindingValue && type_utils_1.canSatisfyShape(scope, value, bindingValue);
        // return (
        //   binding.callee === callee
        //   && binding.parameters.length === parameters.length
        //   && checkedZip(binding.parameters, parameters)
        //     .everyIs(([implementationParameter, parameter]) => (
        //       typesAreEqual(implementationParameter, parameter)
        //     ))
        // );
    });
}
exports.findMatchingImplementations = findMatchingImplementations;
// export function implementationExistsInScope(scope: Scope, callee: string, parameters: Value[]): boolean {
//   return findMatchingImplementations(scope, callee, parameters).length > 0;
// }
function scopeToEScope(scope) {
    return {
        bindings: lodash_1.flatMap(scope.bindings, ({ name, type, expression }) => (expression ? constructors_1.eScopeBinding(name, expression) : constructors_1.eScopeShapeBinding(name, type))),
    };
}
exports.scopeToEScope = scopeToEScope;
function expandScopeWithReplacements(scope, replacements) {
    return {
        bindings: [
            ...scope.bindings,
            ...replacements.map(({ from, to }) => constructors_1.eScopeShapeBinding(from, to))
        ],
    };
}
exports.expandScopeWithReplacements = expandScopeWithReplacements;
function addReplacementsToScope(scope, replacements) {
    return constructors_1.expandScope(scope, {
        bindings: replacements.map(({ from, to }) => constructors_1.scopeBinding(from, scope, to)),
    });
}
exports.addReplacementsToScope = addReplacementsToScope;
function findBinding(scope, name) {
    return lodash_1.find(scope.bindings, { name });
}
exports.findBinding = findBinding;
//# sourceMappingURL=scope-utils.js.map