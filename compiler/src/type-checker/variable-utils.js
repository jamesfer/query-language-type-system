"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.areValuesEqual = exports.usesVariable = exports.getBindingsFromPair = exports.extractFreeVariableNamesFromValue = exports.applyReplacements = void 0;
const lodash_1 = require("lodash");
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
function extractFreeVariableNamesFromValue(inputValue) {
    const [getState, after] = utils_1.accumulateStates((value) => (value.kind === 'FreeVariable' ? [value.name] : []));
    visitor_utils_1.visitValue({ after })(inputValue);
    return getState();
}
exports.extractFreeVariableNamesFromValue = extractFreeVariableNamesFromValue;
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
//# sourceMappingURL=variable-utils.js.map