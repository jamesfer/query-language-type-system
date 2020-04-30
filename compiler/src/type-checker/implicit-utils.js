"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const constructors_1 = require("./constructors");
const utils_1 = require("./utils");
const variable_utils_1 = require("./variable-utils");
const visitor_utils_1 = require("./visitor-utils");
function deepExtractImplicitParameters(node) {
    const [implicits] = extractImplicitsParameters(node.decoration.implicitType);
    const childImplicits = deepExtractImplicitParametersFromExpression(node.expression);
    return [...implicits, ...childImplicits];
}
exports.deepExtractImplicitParameters = deepExtractImplicitParameters;
function deepExtractImplicitParametersFromExpression(expression) {
    const extractNextImplicits = deepExtractImplicitParameters;
    switch (expression.kind) {
        case 'Identifier':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'SymbolExpression':
        case 'NativeExpression':
            return [];
        case 'RecordExpression':
            return lodash_1.flatMap(expression.properties, extractNextImplicits);
        case 'Application':
            return [...extractNextImplicits(expression.callee), ...extractNextImplicits(expression.parameter)];
        case 'FunctionExpression':
            // We don't extract implicits from the parameters because I don't think they should be handled
            // in the same way
            return extractNextImplicits(expression.body);
        case 'DataInstantiation':
            return lodash_1.flatMap(expression.parameters, extractNextImplicits);
        case 'BindingExpression':
            return extractNextImplicits(expression.body);
        case 'DualExpression':
            return [...extractNextImplicits(expression.left), ...extractNextImplicits(expression.right)];
        case 'ReadRecordPropertyExpression':
            return extractNextImplicits(expression.record);
        case 'ReadDataPropertyExpression':
            return extractNextImplicits(expression.dataValue);
        case 'PatternMatchExpression':
            return [...extractNextImplicits(expression.value), ...lodash_1.flatMap(expression.patterns, ({ test, value }) => ([...extractNextImplicits(test), ...extractNextImplicits(value)]))];
        default:
            return utils_1.assertNever(expression);
    }
}
exports.deepExtractImplicitParametersFromExpression = deepExtractImplicitParametersFromExpression;
function extractImplicitsParameters(type) {
    // Strips any implicit values from the result type and stores them in a separate array.
    const implicits = [];
    const parameters = [];
    let currentType = type;
    for (const [isImplicit, parameter, result] of visitor_utils_1.unfoldParameters(type)) {
        currentType = result;
        // Skip implicit arguments
        if (isImplicit) {
            implicits.push(parameter);
        }
        else {
            parameters.push(parameter);
        }
    }
    return [implicits, constructors_1.functionType(currentType, parameters)];
}
exports.extractImplicitsParameters = extractImplicitsParameters;
// export function stripImplicits(type: Value): ExplicitValue {
//   if (type.kind === 'ImplicitFunctionLiteral') {
//     return stripImplicits(type.body);
//   }
//   return type;
// }
function shallowStripImplicits(value) {
    return value.kind === 'ImplicitFunctionLiteral' ? shallowStripImplicits(value.body) : value;
}
exports.stripImplicits = visitor_utils_1.visitAndTransformValue(shallowStripImplicits);
function stripAllImplicits(types) {
    return types.map(exports.stripImplicits);
}
exports.stripAllImplicits = stripAllImplicits;
/**
 * Splits a list of values into two lists. The first contains all the values that use at least one
 * free variable in common with relating value. The second shares no free variables.
 */
function partitionUnrelatedValues(valueList, relatingValue) {
    let variableNames = variable_utils_1.extractFreeVariableNames(relatingValue);
    let allRelated = [];
    let [related, unrelated] = lodash_1.partition(valueList, variable_utils_1.usesVariable(variableNames));
    while (related.length > 0) {
        allRelated = [...allRelated, ...related];
        variableNames = [...variableNames, ...lodash_1.flatMap(related, variable_utils_1.extractFreeVariableNames)];
        ([related, unrelated] = lodash_1.partition(unrelated, variable_utils_1.usesVariable(variableNames)));
    }
    return [allRelated, unrelated];
    // const freeVariables = extractFreeVariableNames(relatingValue);
    // return partition(valueList, usesVariable(freeVariables));
}
exports.partitionUnrelatedValues = partitionUnrelatedValues;
//# sourceMappingURL=implicit-utils.js.map