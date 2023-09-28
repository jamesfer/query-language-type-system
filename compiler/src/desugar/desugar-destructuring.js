"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDesugaredNodeIterator = exports.simpleFunctionMapIterator = exports.desugarDestructuring = void 0;
const visitor_utils_1 = require("../type-checker/visitor-utils");
const destructure_expression_1 = require("./destructure-expression");
const iterators_core_1 = require("./iterators-core");
const iterators_specific_1 = require("./iterators-specific");
function shallowDesugarDestructuring(makeUniqueId, { expression, decoration }) {
    switch (expression.kind) {
        case 'Identifier':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'SymbolExpression':
        case 'RecordExpression':
        case 'Application':
        case 'DataInstantiation':
        case 'BindingExpression':
        case 'DualExpression':
        case 'ReadRecordPropertyExpression':
        case 'ReadDataPropertyExpression':
        case 'PatternMatchExpression':
        case 'NativeExpression':
            return { kind: 'Node', expression, decoration };
        case 'FunctionExpression': {
            if (expression.parameter.expression.kind === 'Identifier') {
                return {
                    decoration,
                    kind: 'Node',
                    expression: {
                        kind: 'SimpleFunctionExpression',
                        parameter: expression.parameter.expression.name,
                        parameterType: expression.parameter.decoration.type,
                        implicit: expression.implicit,
                        body: expression.body,
                    },
                };
            }
            const newName = makeUniqueId('injectedParameter$');
            const identifierNode = {
                kind: 'Node',
                expression: { kind: 'Identifier', name: newName },
                decoration: expression.parameter.decoration,
            };
            const bindings = destructure_expression_1.performExpressionDestructuring(identifierNode, expression.parameter);
            return {
                decoration,
                kind: 'Node',
                expression: {
                    kind: 'SimpleFunctionExpression',
                    parameter: newName,
                    parameterType: expression.parameter.decoration.type,
                    implicit: expression.implicit,
                    body: bindings.reduce((accum, binding) => ({
                        decoration,
                        kind: 'Node',
                        expression: {
                            kind: 'BindingExpression',
                            name: binding.name,
                            value: binding.node,
                            body: accum,
                        },
                    }), expression.body),
                },
            };
        }
    }
}
function desugarDestructuring(makeUniqueId, node) {
    const internal = (node) => (shallowDesugarDestructuring(makeUniqueId, visitor_utils_1.mapNode(iterator, node)));
    const iterator = iterators_specific_1.makeExpressionIterator(internal);
    return internal(node);
}
exports.desugarDestructuring = desugarDestructuring;
function simpleFunctionMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { body: f(expression.body) }));
}
exports.simpleFunctionMapIterator = simpleFunctionMapIterator;
function makeDesugaredNodeIterator(f) {
    return iterators_core_1.combineIteratorMap({
        Identifier: iterators_specific_1.emptyMapIterator,
        BooleanExpression: iterators_specific_1.emptyMapIterator,
        StringExpression: iterators_specific_1.emptyMapIterator,
        NumberExpression: iterators_specific_1.emptyMapIterator,
        SymbolExpression: iterators_specific_1.emptyMapIterator,
        NativeExpression: iterators_specific_1.emptyMapIterator,
        Application: iterators_specific_1.applicationMapIterator,
        DataInstantiation: iterators_specific_1.dataInstantiationMapIterator,
        ReadDataPropertyExpression: iterators_specific_1.readDataPropertyMapIterator,
        ReadRecordPropertyExpression: iterators_specific_1.readRecordPropertyMapIterator,
        SimpleFunctionExpression: simpleFunctionMapIterator,
        DualExpression: iterators_specific_1.dualMapIterator,
        BindingExpression: iterators_specific_1.bindingMapIterator,
        PatternMatchExpression: iterators_specific_1.patternMatchMapIterator,
        RecordExpression: iterators_specific_1.recordMapIterator,
    })(f);
}
exports.makeDesugaredNodeIterator = makeDesugaredNodeIterator;
//# sourceMappingURL=desugar-destructuring.js.map