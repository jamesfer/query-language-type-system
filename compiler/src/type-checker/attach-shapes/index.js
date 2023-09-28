"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachShapes = void 0;
const function_1 = require("fp-ts/function");
const lodash_1 = require("lodash");
const fp_1 = require("lodash/fp");
const iterators_specific_1 = require("../../desugar/iterators-specific");
const constructors_1 = require("../constructors");
const state_recorder_1 = require("../state-recorder/state-recorder");
const inferred_type_1 = require("../types/inferred-type");
const convertChildrenToShapeNames = iterators_specific_1.makeExpressionIterator(({ expression, value }) => ({ expression, value: constructors_1.freeVariable(value.decoration.shapeName) }));
const selectChildNamedNodes = iterators_specific_1.makeExpressionIterator(({ value }) => value);
const selectChildExpressions = iterators_specific_1.makeExpressionIterator(({ expression }) => expression);
/**
 * Returns the type of the particular expression. In addition, it records any value pairs between the
 * child types and the result type.
 */
function determineResultType(inferredTypes, makeUniqueId, expressionWithNodes) {
    const expression = selectChildExpressions(expressionWithNodes);
    const shallowExpression = convertChildrenToShapeNames(expressionWithNodes);
    switch (shallowExpression.kind) {
        case 'Identifier':
            return constructors_1.freeVariable(shallowExpression.name);
        case 'BooleanExpression':
            return constructors_1.booleanLiteral(shallowExpression.value);
        case 'NumberExpression':
            return constructors_1.numberLiteral(shallowExpression.value);
        case 'StringExpression':
            return constructors_1.stringLiteral(shallowExpression.value);
        case 'SymbolExpression':
            return constructors_1.symbol(shallowExpression.name);
        case 'RecordExpression': {
            const propertyTypes = lodash_1.mapValues(shallowExpression.properties, property => property.value);
            return constructors_1.recordLiteral(propertyTypes);
        }
        case 'Application': {
            const resultType = constructors_1.freeVariable(makeUniqueId('applicationResult$'));
            inferredTypes.push(inferred_type_1.makeInferredType('EvaluatesTo', shallowExpression.callee.value.name, constructors_1.functionType(resultType, [shallowExpression.parameter.value]), shallowExpression.callee.expression, expression));
            return resultType;
            // inferredTypes.push(makeInferredType(
            //   'EvaluatedFrom',
            //   pivot.name,
            //   shallowExpression.callee.value,
            //   expression,
            //   shallowExpression.callee.expression,
            // ));
            // inferredTypes.push(makeInferredType(
            //   'Equals',
            //   pivot.name,
            //   functionType(resultType, [shallowExpression.parameter.value]),
            //   expression,
            //   shallowExpression.parameter.expression,
            // ));
            // const parameter = freeVariable(makeUniqueId('applicationParameter$'));
            // inferredTypes.push(makeInferredType(
            //   'EvaluatedFrom',
            //   shallowExpression.callee.value.name,
            //   functionType(resultType, [parameter]),
            //   shallowExpression.callee.expression,
            //   expression,
            // ));
            // inferredTypes.push(makeInferredType(
            //   'EvaluatedFrom',
            //   shallowExpression.parameter.value.name,
            //   parameter,
            //   shallowExpression.parameter.expression,
            //   expression,
            // ));
            // return resultType;
        }
        case 'FunctionExpression':
            return constructors_1.functionType(shallowExpression.body.value, [
                [shallowExpression.parameter.value, shallowExpression.implicit],
            ]);
        case 'DataInstantiation': {
            const parameterTypes = shallowExpression.parameters.map(parameter => parameter.value);
            return constructors_1.dataValue(shallowExpression.callee.value, parameterTypes);
        }
        case 'BindingExpression':
            inferredTypes.push(inferred_type_1.makeInferredType('Equals', shallowExpression.value.value.name, constructors_1.freeVariable(shallowExpression.name), shallowExpression.value.expression, expression));
            return shallowExpression.body.value;
        case 'DualExpression': {
            const resultType = constructors_1.freeVariable(makeUniqueId('dualExpression$'));
            inferredTypes.push(inferred_type_1.makeInferredType('EvaluatedFrom', shallowExpression.left.value.name, resultType, shallowExpression.left.expression, expression));
            inferredTypes.push(inferred_type_1.makeInferredType('EvaluatedFrom', shallowExpression.right.value.name, resultType, shallowExpression.right.expression, expression));
            return resultType;
        }
        case 'ReadRecordPropertyExpression': {
            const resultType = constructors_1.freeVariable(makeUniqueId('readRecordProperty$'));
            // TODO this implementation is bugged because it requires that record have exactly these properties
            const expectedType = constructors_1.recordLiteral({ [shallowExpression.property]: resultType });
            inferredTypes.push(inferred_type_1.makeInferredType('EvaluatedFrom', shallowExpression.record.value.name, expectedType, shallowExpression.record.expression, expression));
            return resultType;
        }
        case 'ReadDataPropertyExpression': {
            const resultType = constructors_1.freeVariable(makeUniqueId('readDataProperty$'));
            // TODO this implementation is bugged because it requires that data value have exactly this many elements
            const expectedType = constructors_1.dataValue(constructors_1.freeVariable(makeUniqueId('dataPropertyName$')), [
                ...Array(shallowExpression.property).fill(0).map(() => constructors_1.freeVariable(makeUniqueId('dataPropertyParameter$'))),
                resultType,
            ]);
            inferredTypes.push(inferred_type_1.makeInferredType('EvaluatedFrom', shallowExpression.dataValue.value.name, expectedType, shallowExpression.dataValue.expression, expression));
            return resultType;
        }
        case 'PatternMatchExpression': {
            const resultType = constructors_1.freeVariable(makeUniqueId('patternMatchBody$'));
            const testType = constructors_1.freeVariable(makeUniqueId('patternMatchTest$'));
            inferredTypes.push(inferred_type_1.makeInferredType('EvaluatedFrom', shallowExpression.value.value.name, testType, shallowExpression.value.expression, expression));
            shallowExpression.patterns.forEach((pattern) => {
                inferredTypes.push(inferred_type_1.makeInferredType('EvaluatedFrom', pattern.test.value.name, testType, pattern.test.expression, expression));
                inferredTypes.push(inferred_type_1.makeInferredType('EvaluatedFrom', pattern.value.value.name, resultType, pattern.value.expression, expression));
            });
            return resultType;
        }
        case 'NativeExpression':
            return constructors_1.freeVariable(makeUniqueId('nativeExpression$'));
    }
}
function getPrefix(expression) {
    if (expression.kind === 'Identifier') {
        return `nodeIdentifier${expression.name}Type$`;
    }
    return `node${expression.kind}Type$`;
}
/**
 * Converts an expression to a named node. It attaches the result type of the expression and a
 * generated shape name to the node.
 */
const makeNamedNode = (inferredTypes, makeUniqueId) => (expression) => {
    return {
        expression: selectChildExpressions(expression),
        value: constructors_1.node(selectChildNamedNodes(expression), {
            type: determineResultType(inferredTypes, makeUniqueId, expression),
            shapeName: makeUniqueId(getPrefix(expression))
        }),
    };
};
/**
 * Records a value pair between the expression's shape name and the result type.
 */
const recordShapePair = (inferredTypes, kind) => ({ expression, value }) => {
    inferredTypes.push(inferred_type_1.makeInferredType(kind, value.decoration.shapeName, value.decoration.type, expression, expression));
};
/**
 * Records the value pairs for a binding expression.
 */
const recordBindingExpressionPairs = (inferredTypes) => (expression) => {
    recordShapePair(inferredTypes, 'Equals')(expression.value);
    recordShapePair(inferredTypes, 'EvaluatedFrom')(expression.body);
};
/**
 * Records the value pairs for a function expression.
 */
const recordFunctionExpressionPairs = (inferredTypes) => (expression) => {
    recordShapePair(inferredTypes, 'EvaluatedFrom')(expression.parameter);
    recordShapePair(inferredTypes, 'Equals')(expression.body);
};
const isBindingExpression = (expression) => (expression.kind === 'BindingExpression');
const recordChildShapePairs = (inferredTypes) => {
    return (expression) => {
        if (isBindingExpression(expression)) {
            recordBindingExpressionPairs(inferredTypes)(expression);
        }
        else if (expression.kind === 'FunctionExpression') {
            recordFunctionExpressionPairs(inferredTypes)(expression);
        }
        else {
            iterators_specific_1.makeExpressionIterator(recordShapePair(inferredTypes, 'EvaluatedFrom'))(expression);
        }
    };
    // return flow(
    //   fromPredicate(isBindingExpression, identity),
    //   fold(
    //     makeExpressionIterator(recordShapePair(inferredTypes, 'EvaluatedFrom')),
    //     recordBindingExpressionPairs(inferredTypes),
    //   ),
    // );
};
function attachShapesWithState(inferredTypes, makeUniqueId) {
    const iterateOverChildren = function_1.flow(
    // Recurse through all children
    iterators_specific_1.makeExpressionIterator((e) => iterateOverChildren(e)), 
    // Determine the type of the expression and attach a name
    iterators_specific_1.makeExpressionIterator(makeNamedNode(inferredTypes, makeUniqueId)), 
    // Record any value pairs on the named node
    fp_1.tap(recordChildShapePairs(inferredTypes)));
    return function_1.flow(iterateOverChildren, makeNamedNode(inferredTypes, makeUniqueId), fp_1.tap(recordShapePair(inferredTypes, 'EvaluatedFrom')), expression => expression.value);
}
function attachShapes(makeUniqueId, expression) {
    const inferredTypes = new state_recorder_1.StateRecorder();
    const namedNode = attachShapesWithState(inferredTypes, makeUniqueId)(expression);
    return [inferredTypes.values, namedNode];
}
exports.attachShapes = attachShapes;
//# sourceMappingURL=index.js.map