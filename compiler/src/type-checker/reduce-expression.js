"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduceExpression = void 0;
const evaluate_1 = require("./evaluate");
const scope_utils_1 = require("./scope-utils");
const utils_1 = require("./utils");
const visitor_utils_1 = require("./visitor-utils");
const strip_nodes_1 = require("./strip-nodes");
const expressionToValue = (scope) => (expression) => {
    switch (expression.kind) {
        case 'Identifier':
            const binding = scope_utils_1.findBinding(scope, expression.name);
            if (binding) {
                if (binding.node) {
                    return reduceExpression(scope, strip_nodes_1.stripNode(binding.node));
                }
                return binding.type;
            }
            return {
                kind: 'FreeVariable',
                name: expression.name,
            };
        case 'BooleanExpression':
            return {
                kind: 'BooleanLiteral',
                value: expression.value,
            };
        case 'NumberExpression':
            return {
                kind: 'NumberLiteral',
                value: expression.value,
            };
        case 'StringExpression':
            return {
                kind: 'StringLiteral',
                value: expression.value,
            };
        case 'SymbolExpression':
            return {
                kind: 'SymbolLiteral',
                name: expression.name,
            };
        case 'RecordExpression':
            return {
                kind: 'RecordLiteral',
                properties: expression.properties,
            };
        case 'Application':
            return {
                kind: 'ApplicationValue',
                callee: expression.callee,
                parameter: expression.parameter,
            };
        case 'FunctionExpression':
            return {
                kind: expression.implicit ? 'ImplicitFunctionLiteral' : 'FunctionLiteral',
                parameter: expression.parameter,
                body: expression.body,
            };
        case 'DataInstantiation':
            return {
                kind: 'DataValue',
                name: expression.callee,
                parameters: expression.parameters,
            };
        case 'BindingExpression':
            // This is possibly wrong because the binding won't appear in the child state
            return expression.body;
        case 'DualExpression':
            return {
                kind: 'DualBinding',
                left: expression.left,
                right: expression.right,
            };
        case 'ReadRecordPropertyExpression':
            return {
                kind: 'ReadRecordProperty',
                property: expression.property,
                record: expression.record,
            };
        case 'ReadDataPropertyExpression':
            return {
                kind: 'ReadDataValueProperty',
                property: expression.property,
                dataValue: expression.dataValue,
            };
        case 'PatternMatchExpression':
            return {
                kind: 'PatternMatchValue',
                value: expression.value,
                patterns: expression.patterns,
            };
        case 'NativeExpression':
            throw new Error('NativeExpressions are not yet supported');
        default:
            return utils_1.assertNever(expression);
    }
};
function reduceExpression(scope, expression) {
    const newVar = visitor_utils_1.visitAndTransformExpression(expressionToValue(scope))(expression);
    return evaluate_1.simplify(newVar);
}
exports.reduceExpression = reduceExpression;
//# sourceMappingURL=reduce-expression.js.map