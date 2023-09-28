"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePartialTypes = void 0;
const Array_1 = require("fp-ts/Array");
const Either_1 = require("fp-ts/Either");
const function_1 = require("fp-ts/function");
const Record_1 = require("fp-ts/Record");
const Separated_1 = require("fp-ts/Separated");
const These_1 = require("fp-ts/These");
const shallow_strip_implicits_1 = require("../utils/shallow-strip-implicits");
const partial_type_1 = require("./partial-type");
const zip_records_1 = require("./utils/zip-records");
const shallow_extract_implicits_1 = require("../utils/shallow-extract-implicits");
const constructors_1 = require("../constructors");
const exactlyMergeTypesWithState = (messageState, assumptionsState) => (left, right) => {
    const exactlyMergeTypes = exactlyMergeTypesWithState(messageState, assumptionsState);
    if (left.kind === 'FreeVariable') {
        assumptionsState.push(Either_1.left({
            from: left.name,
            operator: 'Equals',
            to: right,
        }));
        return right;
    }
    if (right.kind === 'FreeVariable') {
        assumptionsState.push(Either_1.right({
            from: right.name,
            operator: 'Equals',
            to: left,
        }));
        return left;
    }
    switch (left.kind) {
        case 'SymbolLiteral': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            if (right.name !== left.name) {
                messageState.push('Type values are different');
                return left;
            }
            return left;
        }
        case 'BooleanLiteral':
        case 'NumberLiteral':
        case 'StringLiteral': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            if (right.value !== left.value) {
                messageState.push('Type values are different');
                return left;
            }
            return left;
        }
        case 'RecordLiteral': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            const newProperties = function_1.pipe(zip_records_1.zipRecords(left.properties, right.properties), Record_1.map(x => These_1.isBoth(x) ? Either_1.right(x) : Either_1.left(x)), Record_1.separate, Separated_1.mapLeft((unevenProperties) => {
                if (!Record_1.isEmpty(unevenProperties)) {
                    messageState.push('Uneven properties');
                }
            }), s => s.right, Record_1.map(both => exactlyMergeTypes(both.left, both.right)));
            return {
                kind: 'RecordLiteral',
                properties: newProperties,
            };
        }
        case 'DataValue': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            if (left.parameters.length !== right.parameters.length) {
                messageState.push('Types are different');
            }
            const name = exactlyMergeTypes(left.name, right.name);
            const parameters = function_1.pipe(Array_1.zip(left.parameters)(right.parameters), Array_1.map(function_1.tupled(exactlyMergeTypes)));
            return { name, parameters, kind: 'DataValue' };
        }
        case 'DualBinding': {
            const combined = exactlyMergeTypes(left.left, left.right);
            return exactlyMergeTypes(combined, right);
        }
        case 'ApplicationValue': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            const callee = exactlyMergeTypes(left.callee, right.callee);
            const parameter = exactlyMergeTypes(left.parameter, right.parameter);
            return { callee, parameter, kind: 'ApplicationValue' };
        }
        case 'ReadDataValueProperty': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            if (left.property !== right.property) {
                messageState.push('Data value properties read are different');
                return left;
            }
            const dataValue = exactlyMergeTypes(left.dataValue, right.dataValue);
            return Object.assign(Object.assign({}, left), { dataValue });
        }
        case 'ReadRecordProperty': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            if (left.property !== right.property) {
                messageState.push('Record properties read are different');
                return left;
            }
            const record = exactlyMergeTypes(left.record, right.record);
            return Object.assign(Object.assign({}, left), { record });
        }
        case 'FunctionLiteral': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            const parameter = exactlyMergeTypes(left.parameter, right.parameter);
            const body = exactlyMergeTypes(left.body, right.body);
            return Object.assign(Object.assign({}, left), { parameter, body });
        }
        case 'ImplicitFunctionLiteral': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            const parameter = exactlyMergeTypes(left.parameter, right.parameter);
            const body = exactlyMergeTypes(left.body, right.body);
            return Object.assign(Object.assign({}, left), { parameter, body });
        }
        case 'PatternMatchValue': {
            if (right.kind !== left.kind) {
                messageState.push('Types are different');
                return left;
            }
            if (left.patterns.length !== right.patterns.length) {
                messageState.push('Pattern counts are different');
                return left;
            }
            const value = exactlyMergeTypes(left.value, right.value);
            const patterns = Array_1.zip(left.patterns)(right.patterns).map(([leftPattern, rightPattern]) => {
                const test = exactlyMergeTypes(leftPattern.test, rightPattern.test);
                const value = exactlyMergeTypes(leftPattern.value, rightPattern.value);
                return { test, value };
            });
            return Object.assign(Object.assign({}, left), { value, patterns });
        }
        default:
            return function_1.absurd(left);
    }
};
/**
 * strip implicits from left
 * if left is a freeVariable, then (left.value.name evaluatesTo right.value)
 * else converge
 */
function stripLeftImplicitsAndConverge(messageState, assumptionsState, left, right) {
    const leftValue = shallow_strip_implicits_1.shallowStripImplicits(left.to);
    if (leftValue.kind === 'FreeVariable') {
        assumptionsState.push(Either_1.left(partial_type_1.evaluatesToPartialType(leftValue.name, right.to)));
        return left;
    }
    // converge
    return partial_type_1.equalsPartialType(exactlyMergeTypesWithState(messageState, assumptionsState)(leftValue, right.to));
}
function stripAndRestoreLeftImplicitsAndConverge(messageState, assumptionsState, left, right) {
    const [leftValue, implicits] = shallow_extract_implicits_1.shallowExtractImplicits(left.to);
    if (leftValue.kind === 'FreeVariable') {
        assumptionsState.push(Either_1.left(partial_type_1.evaluatesToPartialType(leftValue.name, right.to)));
        return left;
    }
    // converge
    const convergedValue = exactlyMergeTypesWithState(messageState, assumptionsState)(leftValue, right.to);
    return partial_type_1.equalsPartialType(constructors_1.functionType(convergedValue, implicits.map(implicit => [implicit, true])));
}
/**
 * strip implicits from right
 * if right is freeVariable, then (right.value.name evaluatesTo left.value)
 * else converge
 */
function stripRightImplicitsAndConverge(messageState, assumptionsState, left, right) {
    const rightValue = shallow_strip_implicits_1.shallowStripImplicits(right.to);
    if (rightValue.kind === 'FreeVariable') {
        assumptionsState.push(Either_1.right(partial_type_1.evaluatesToPartialType(rightValue.name, left.to)));
        return right;
    }
    // converge
    return partial_type_1.equalsPartialType(exactlyMergeTypesWithState(messageState, assumptionsState)(left.to, rightValue));
}
function stripAndRestoreRightImplicitsAndConverge(messageState, assumptionsState, left, right) {
    const [rightValue, implicits] = shallow_extract_implicits_1.shallowExtractImplicits(right.to);
    if (rightValue.kind === 'FreeVariable') {
        assumptionsState.push(Either_1.right(partial_type_1.evaluatesToPartialType(rightValue.name, left.to)));
        return right;
    }
    // converge
    const convergedValue = exactlyMergeTypesWithState(messageState, assumptionsState)(left.to, rightValue);
    return partial_type_1.equalsPartialType(constructors_1.functionType(convergedValue, implicits.map(implicit => [implicit, true])));
}
function mergePartialTypes(messageState, assumptionsState, left, right) {
    const exactlyMergeTypes = exactlyMergeTypesWithState(messageState, assumptionsState);
    switch (left.operator) {
        case 'Equals':
            switch (right.operator) {
                case 'Equals':
                    return partial_type_1.equalsPartialType(exactlyMergeTypes(left.to, right.to));
                case 'EvaluatesTo':
                    return stripAndRestoreLeftImplicitsAndConverge(messageState, assumptionsState, left, right);
                case 'EvaluatedFrom':
                    return stripRightImplicitsAndConverge(messageState, assumptionsState, left, right);
                default:
                    return function_1.absurd(right.operator);
            }
        case 'EvaluatesTo':
            switch (right.operator) {
                case 'Equals':
                    return stripAndRestoreRightImplicitsAndConverge(messageState, assumptionsState, left, right);
                case 'EvaluatesTo':
                    return partial_type_1.equalsPartialType(exactlyMergeTypes(left.to, right.to));
                case 'EvaluatedFrom':
                    return stripRightImplicitsAndConverge(messageState, assumptionsState, left, right);
                default:
                    return function_1.absurd(right.operator);
            }
        case 'EvaluatedFrom':
            switch (right.operator) {
                case 'Equals':
                    return stripLeftImplicitsAndConverge(messageState, assumptionsState, left, right);
                case 'EvaluatesTo':
                    return stripLeftImplicitsAndConverge(messageState, assumptionsState, left, right);
                case 'EvaluatedFrom':
                    return partial_type_1.equalsPartialType(exactlyMergeTypes(left.to, right.to));
                default:
                    return function_1.absurd(right.operator);
            }
        default:
            return function_1.absurd(left.operator);
    }
}
exports.mergePartialTypes = mergePartialTypes;
//# sourceMappingURL=merge-partial-types.js.map