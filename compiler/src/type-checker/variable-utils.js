"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFreeVariablesFromExpression = exports.applyParameter = exports.areValuesEqual = exports.substituteVariables = exports.usesVariable = exports.getBindingsFromPair = exports.getBindingsFromValue = exports.renameTakenVariables = exports.nextFreeName = exports.extractFreeVariableNamesFromValue = exports.recursivelyApplyReplacements = exports.recursivelyApplyReplacementsToNode = exports.applyReplacements = void 0;
const lodash_1 = require("lodash");
const constructors_1 = require("./constructors");
const implicit_utils_1 = require("./implicit-utils");
const utils_1 = require("./utils");
const visitor_utils_1 = require("./visitor-utils");
exports.applyReplacements = (replacements) => (replacements.length === 0
    ? lodash_1.identity
    : visitor_utils_1.visitValue({
        after(value) {
            if (value.kind === 'FreeVariable') {
                const [replacement, ...remainingReplacements] = replacements;
                return replacement.from === value.name
                    ? exports.applyReplacements(replacements)(replacement.to)
                    : exports.applyReplacements(remainingReplacements)(value);
            }
            return value;
        },
    }));
exports.recursivelyApplyReplacementsToNode = (replacements) => ({ expression, decoration }) => {
    return constructors_1.node(exports.recursivelyApplyReplacements(replacements)(expression), Object.assign(Object.assign({}, decoration), { implicitType: exports.applyReplacements(replacements)(decoration.implicitType), type: implicit_utils_1.stripImplicits(exports.applyReplacements(replacements)(decoration.type)) }));
};
exports.recursivelyApplyReplacements = (replacements) => (expression) => {
    const recurse = exports.recursivelyApplyReplacementsToNode(replacements);
    switch (expression.kind) {
        case 'SymbolExpression':
        case 'Identifier':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'FunctionExpression':
        case 'NativeExpression':
            return expression;
        case 'Application':
            return Object.assign(Object.assign({}, expression), { callee: recurse(expression.callee), parameter: recurse(expression.parameter) });
        case 'DataInstantiation':
            return Object.assign(Object.assign({}, expression), { parameters: expression.parameters.map(recurse) });
        case 'RecordExpression':
            return Object.assign(Object.assign({}, expression), { properties: lodash_1.mapValues(expression.properties, recurse) });
        case 'BindingExpression':
            return Object.assign(Object.assign({}, expression), { value: recurse(expression.value), body: recurse(expression.body) });
        case 'DualExpression':
            return Object.assign(Object.assign({}, expression), { left: recurse(expression.left), right: recurse(expression.right) });
        case 'ReadRecordPropertyExpression':
            return Object.assign(Object.assign({}, expression), { record: recurse(expression.record) });
        case 'ReadDataPropertyExpression':
            return Object.assign(Object.assign({}, expression), { dataValue: recurse(expression.dataValue) });
        case 'PatternMatchExpression':
            return Object.assign(Object.assign({}, expression), { value: recurse(expression.value), patterns: expression.patterns.map(({ test, value }) => ({
                    test: recurse(test),
                    value: recurse(value),
                })) });
        default:
            return utils_1.assertNever(expression);
    }
};
// export function extractFreeVariableNames(inputExpression: )
function extractFreeVariableNamesFromValue(inputValue) {
    const [getState, after] = utils_1.accumulateStates((value) => (value.kind === 'FreeVariable' ? [value.name] : []));
    visitor_utils_1.visitValue({ after })(inputValue);
    return getState();
}
exports.extractFreeVariableNamesFromValue = extractFreeVariableNamesFromValue;
function nextFreeName(taken, prefix = 'var') {
    const match = prefix.match(/(.*?)([0-9]*)/);
    const name = match ? match[0] : prefix;
    let number = match ? +match[1] : 0;
    let freeName;
    do {
        freeName = `${name}${number === 0 ? '' : number}`;
        number += 1;
    } while (taken.includes(freeName));
    return freeName;
}
exports.nextFreeName = nextFreeName;
function renameTakenVariables(takenVariables, replacements) {
    const allVariables = [...takenVariables];
    return replacements.map(({ from, to }) => {
        const remainingReplacements = extractFreeVariableNamesFromValue(to)
            .filter(name => allVariables.includes(name))
            .map((name) => {
            const newName = nextFreeName(allVariables, name);
            allVariables.push(newName);
            return { from: name, to: constructors_1.freeVariable(newName) };
        });
        return {
            from,
            to: exports.applyReplacements(remainingReplacements)(to),
        };
    });
}
exports.renameTakenVariables = renameTakenVariables;
function getBindingsFromValue(value) {
    switch (value.kind) {
        case 'SymbolLiteral':
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'StringLiteral':
        case 'FreeVariable':
            return [];
        case 'DualBinding':
            return getBindingsFromPair(value.left, value.right);
        case 'DataValue':
            return lodash_1.flatMap(value.parameters, getBindingsFromValue);
        case 'RecordLiteral':
            return lodash_1.flatMap(value.properties, getBindingsFromValue);
        case 'ReadDataValueProperty':
            return getBindingsFromValue(value.dataValue);
        case 'ReadRecordProperty':
            return getBindingsFromValue(value.record);
        case 'ApplicationValue':
        case 'FunctionLiteral':
        case 'ImplicitFunctionLiteral':
        case 'PatternMatchValue':
            return [];
        default:
            return utils_1.assertNever(value);
    }
}
exports.getBindingsFromValue = getBindingsFromValue;
function getBindingsFromPair(left, right) {
    if (left.kind === 'FreeVariable') {
        return [{ from: left.name, to: right }];
    }
    if (right.kind === 'FreeVariable') {
        return [{ from: right.name, to: left }];
    }
    if (left.kind === 'DualBinding') {
        return [...getBindingsFromPair(left.left, right), ...getBindingsFromPair(left.right, right)];
    }
    if (right.kind === 'DualBinding') {
        return [...getBindingsFromPair(left, right.left), ...getBindingsFromPair(left, right.right)];
    }
    switch (left.kind) {
        case 'SymbolLiteral':
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'StringLiteral':
            return [];
        case 'DataValue': {
            if (right.kind !== 'DataValue' || right.name !== left.name) {
                return [];
            }
            return lodash_1.flatMap(utils_1.checkedZip(left.parameters, right.parameters), utils_1.spreadApply(getBindingsFromPair));
        }
        case 'RecordLiteral': {
            if (right.kind !== 'RecordLiteral') {
                return [];
            }
            const intersectingKeys = lodash_1.intersection(Object.keys(left.properties), Object.keys(right.properties));
            return lodash_1.flatMap(intersectingKeys, key => getBindingsFromPair(left.properties[key], right.properties[key]));
        }
        case 'ApplicationValue':
        case 'FunctionLiteral':
        case 'ImplicitFunctionLiteral':
        case 'ReadDataValueProperty':
        case 'ReadRecordProperty':
        case 'PatternMatchValue':
            return [];
        default:
            return utils_1.assertNever(left);
    }
}
exports.getBindingsFromPair = getBindingsFromPair;
exports.usesVariable = (variables) => (incomingValue) => {
    const [getState, after] = utils_1.accumulateStatesUsingOr((value) => (value.kind === 'FreeVariable' ? variables.includes(value.name) : false));
    visitor_utils_1.visitValue({ after })(incomingValue);
    return getState();
};
exports.substituteVariables = (scope) => visitor_utils_1.visitValue({
    after(value) {
        if (value.kind === 'FreeVariable') {
            const binding = lodash_1.find(scope.bindings, { name: value.name });
            if (binding) {
                return exports.substituteVariables(scope)(binding.type);
            }
        }
        return value;
    },
});
function areValuesEqual(left, right) {
    if (left.kind !== right.kind) {
        return false;
    }
    switch (left.kind) {
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'StringLiteral':
            return true;
        case 'SymbolLiteral':
            return right.name === left.name;
        case 'FreeVariable':
            return right.name === left.name;
        case 'DualBinding': {
            const rightDualBinding = right;
            return areValuesEqual(left.left, rightDualBinding.left) && areValuesEqual(left.right, rightDualBinding.right)
                || areValuesEqual(left.right, rightDualBinding.left) && areValuesEqual(left.left, rightDualBinding.right);
        }
        case 'DataValue': {
            const rightDataValue = right;
            return areValuesEqual(left.name, rightDataValue.name)
                && left.parameters.length === rightDataValue.parameters.length
                && utils_1.checkedZip(left.parameters, rightDataValue.parameters)
                    .every(([leftParam, rightParam]) => areValuesEqual(leftParam, rightParam));
        }
        case 'RecordLiteral': {
            const rightRecord = right;
            if (Object.keys(rightRecord.properties).length !== Object.keys(left.properties).length) {
                return false;
            }
            return lodash_1.every(left.properties, (leftValue, key) => {
                const rightValue = rightRecord.properties[key];
                return rightValue && areValuesEqual(leftValue, rightValue);
            });
        }
        case 'ApplicationValue': {
            if (right.kind !== 'ApplicationValue') {
                return false;
            }
            return areValuesEqual(left.callee, right.callee) && areValuesEqual(left.parameter, right.parameter);
        }
        case 'ImplicitFunctionLiteral':
        case 'FunctionLiteral':
        case 'ReadDataValueProperty':
        case 'ReadRecordProperty':
        case 'PatternMatchValue':
            return false;
        default:
            return utils_1.assertNever(left);
    }
}
exports.areValuesEqual = areValuesEqual;
const collapseValue = visitor_utils_1.visitValue({
    after(value) {
        if (value.kind === 'DualBinding') {
            return areValuesEqual(value.left, value.right) ? value.left : value;
        }
        if (value.kind === 'ApplicationValue' && extractFreeVariableNamesFromValue(value.parameter).length === 0) {
            return applyParameter(value.parameter, value.callee);
        }
        return value;
    },
});
function applyParameter(parameter, func) {
    // if (!isFunctionType(func)) {
    //   throw new Error(`Tried to apply parameters to a data value that is not a function. Actual: ${JSON.stringify(func, undefined, 2)}`);
    // }
    for (const [expectedParameter, body, skippedImplicits] of visitor_utils_1.unfoldExplicitParameters(func)) {
        const bindings = getBindingsFromPair(parameter, expectedParameter);
        const newBody = collapseValue(exports.applyReplacements(bindings)(body));
        return constructors_1.functionType(newBody, skippedImplicits.map(implicit => [implicit, true]));
    }
    return func;
}
exports.applyParameter = applyParameter;
function collectFreeVariables(expression) {
    switch (expression.kind) {
        case 'Identifier':
            return [expression.name];
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'SymbolExpression':
            return [];
        case 'RecordExpression':
            return [].concat(...Object.values(expression.properties));
        case 'Application':
            return [
                ...expression.callee,
                ...expression.parameter,
            ];
        case 'FunctionExpression':
            return [];
        case 'DataInstantiation':
            return expression.callee.concat(...expression.parameters);
        case 'BindingExpression':
            return [];
        case 'DualExpression':
            return [
                ...expression.left,
                ...expression.right,
            ];
        case 'ReadRecordPropertyExpression':
            return expression.record;
        case 'ReadDataPropertyExpression':
            return expression.dataValue;
        case 'PatternMatchExpression':
            return expression.value.concat(...expression.patterns.map(pattern => [...pattern.test, ...pattern.value]));
        case 'NativeExpression':
            return [];
        default:
            return utils_1.assertNever(expression);
    }
}
function extractFreeVariablesFromExpression(expression) {
    return visitor_utils_1.visitAndTransformExpression(collectFreeVariables)(expression);
}
exports.extractFreeVariablesFromExpression = extractFreeVariablesFromExpression;
//# sourceMappingURL=variable-utils.js.map