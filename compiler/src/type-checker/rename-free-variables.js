"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
function findNameInScopes(scopes, name) {
    if (scopes.length === 0) {
        return undefined;
    }
    const [currentScope, ...remainingScopes] = scopes;
    return currentScope[name] || findNameInScopes(remainingScopes, name);
}
function newUniqueName(name) {
    return lodash_1.uniqueId(`${name}$rename$`);
}
function addToScope(scopes, from, to) {
    const [currentScope, ...otherScopes] = scopes;
    return [Object.assign(Object.assign({}, currentScope), { [from]: to }), ...otherScopes];
}
function withNewScope(scopes, f) {
    const childScopes = [{}, ...scopes];
    const [[, ...newScopes], value] = f(childScopes);
    return [newScopes, value];
}
/**
 * Iterates over an expression and renames all the free variables to globally unique values. The
 * scopes are generally implied from function expressions.
 */
function renameFreeVariablesInScope(scopes, expression) {
    switch (expression.kind) {
        case 'SymbolExpression':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'NativeExpression':
            return [scopes, expression];
        case 'Identifier': {
            const newName = findNameInScopes(scopes, expression.name);
            if (newName) {
                return [scopes, Object.assign(Object.assign({}, expression), { name: newName })];
            }
            const uniqueName = newUniqueName(expression.name);
            const newScopes = addToScope(scopes, expression.name, uniqueName);
            return [newScopes, Object.assign(Object.assign({}, expression), { name: uniqueName })];
        }
        case 'RecordExpression': {
            const [newScopes, properties] = utils_1.mapValuesWithState(expression.properties, scopes, renameFreeVariablesInScope);
            return [newScopes, Object.assign(Object.assign({}, expression), { properties })];
        }
        case 'Application': {
            const [newScopes, [callee, parameter]] = utils_1.mapWithState([expression.callee, expression.parameter], scopes, renameFreeVariablesInScope);
            return [newScopes, Object.assign(Object.assign({}, expression), { callee, parameter })];
        }
        case 'FunctionExpression': {
            const [newScopes, [parameter, body]] = withNewScope(scopes, childScopes => utils_1.mapWithState([expression.parameter, expression.body], childScopes, renameFreeVariablesInScope));
            return [newScopes, Object.assign(Object.assign({}, expression), { body, parameter })];
        }
        case 'DataInstantiation': {
            const [afterCalleeScopes, callee] = renameFreeVariablesInScope(scopes, expression.callee);
            const [newScopes, parameters] = utils_1.mapWithState(expression.parameters, afterCalleeScopes, renameFreeVariablesInScope);
            return [newScopes, Object.assign(Object.assign({}, expression), { parameters, callee })];
        }
        case 'BindingExpression': {
            // Rename the binding expression first
            // const bindingName = newUniqueName(expression.callee);
            const [newScopes, value] = withNewScope(addToScope(scopes, expression.name, expression.name), childScopes => renameFreeVariablesInScope(childScopes, expression.value));
            const [bodyScope, body] = renameFreeVariablesInScope(newScopes, expression.body);
            return [bodyScope, Object.assign(Object.assign({}, expression), { value, body })];
        }
        case 'DualExpression': {
            const [newScopes, [left, right]] = utils_1.mapWithState([expression.left, expression.right], scopes, renameFreeVariablesInScope);
            return [newScopes, Object.assign(Object.assign({}, expression), { left, right })];
        }
        case 'ReadRecordPropertyExpression': {
            const [newScopes, record] = renameFreeVariablesInScope(scopes, expression.record);
            return [newScopes, Object.assign(Object.assign({}, expression), { record })];
        }
        case 'ReadDataPropertyExpression': {
            const [newScopes, dataValue] = renameFreeVariablesInScope(scopes, expression.dataValue);
            return [newScopes, Object.assign(Object.assign({}, expression), { dataValue })];
        }
        case 'PatternMatchExpression': {
            const [newScopes, value] = renameFreeVariablesInScope(scopes, expression.value);
            const patterns = [];
            const newScopes2 = expression.patterns.reduce((newScopes, { test, value }) => {
                const [resultScopes, [newTest, newValue]] = withNewScope(newScopes, childScopes => utils_1.mapWithState([test, value], childScopes, renameFreeVariablesInScope));
                patterns.push({ test: newTest, value: newValue });
                return resultScopes;
            }, newScopes);
            return [newScopes2, Object.assign(Object.assign({}, expression), { value, patterns })];
        }
        default:
            return utils_1.assertNever(expression);
    }
}
function renameFreeVariables(expression) {
    const [, result] = renameFreeVariablesInScope([], expression);
    return result;
}
exports.renameFreeVariables = renameFreeVariables;
//# sourceMappingURL=rename-free-variables.js.map