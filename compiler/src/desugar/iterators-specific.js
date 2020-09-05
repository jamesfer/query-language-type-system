"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripNode = exports.stripExpressionNodes = exports.makeStripNode = exports.shallowStripNode = exports.makeExpressionIterator = exports.recordMapIterator = exports.patternMatchMapIterator = exports.bindingMapIterator = exports.dualMapIterator = exports.functionMapIterator = exports.readRecordPropertyMapIterator = exports.readDataPropertyMapIterator = exports.dataInstantiationMapIterator = exports.applicationMapIterator = exports.emptyMapIterator = void 0;
const lodash_1 = require("lodash");
const iterators_core_1 = require("./iterators-core");
// export function passThroughNodeIterator<A, B, D>(f: (value: A) => B): (node: NodeWithExpression<D, A>) => NodeWithExpression<D, B> {
//   return passThroughIterator('expression')(f);
// }
//
// export function strippingNodeIterator<A, B, D>(f: (value: A) => B): (node: NodeWithExpression<D, A>) => B {
//   return node => f(node.expression);
// }
// type Keys<K extends string, E extends { kind: string }> = E extends { kind: K } ? keyof E : never;
//
// const expressionChildPropertyMap: { [K in Expression['kind']]: Keys<K, Expression>[] } = {
//   Application: ['callee'],
//   DataInstantiation: ['callee', 'parameters']
// };
function emptyMapIterator(f) {
    return expression => expression;
}
exports.emptyMapIterator = emptyMapIterator;
function applicationMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { callee: f(expression.callee), parameter: f(expression.parameter) }));
}
exports.applicationMapIterator = applicationMapIterator;
function dataInstantiationMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { callee: f(expression.callee), parameters: expression.parameters.map(f) }));
}
exports.dataInstantiationMapIterator = dataInstantiationMapIterator;
function readDataPropertyMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { dataValue: f(expression.dataValue) }));
}
exports.readDataPropertyMapIterator = readDataPropertyMapIterator;
function readRecordPropertyMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { record: f(expression.record) }));
}
exports.readRecordPropertyMapIterator = readRecordPropertyMapIterator;
function functionMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { parameter: f(expression.parameter), body: f(expression.body) }));
}
exports.functionMapIterator = functionMapIterator;
function dualMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { left: f(expression.left), right: f(expression.right) }));
}
exports.dualMapIterator = dualMapIterator;
function bindingMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { body: f(expression.body), value: f(expression.value) }));
}
exports.bindingMapIterator = bindingMapIterator;
function patternMatchMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { value: f(expression.value), patterns: expression.patterns.map(pattern => (Object.assign(Object.assign({}, pattern), { value: f(pattern.value), test: f(pattern.test) }))) }));
}
exports.patternMatchMapIterator = patternMatchMapIterator;
function recordMapIterator(f) {
    return expression => (Object.assign(Object.assign({}, expression), { properties: lodash_1.mapValues(expression.properties, f) }));
}
exports.recordMapIterator = recordMapIterator;
function makeExpressionIterator(f) {
    return iterators_core_1.combineIteratorMap({
        Identifier: emptyMapIterator,
        BooleanExpression: emptyMapIterator,
        StringExpression: emptyMapIterator,
        NumberExpression: emptyMapIterator,
        SymbolExpression: emptyMapIterator,
        NativeExpression: emptyMapIterator,
        Application: applicationMapIterator,
        DataInstantiation: dataInstantiationMapIterator,
        ReadDataPropertyExpression: readDataPropertyMapIterator,
        ReadRecordPropertyExpression: readRecordPropertyMapIterator,
        FunctionExpression: functionMapIterator,
        DualExpression: dualMapIterator,
        BindingExpression: bindingMapIterator,
        PatternMatchExpression: patternMatchMapIterator,
        RecordExpression: recordMapIterator,
    })(f);
}
exports.makeExpressionIterator = makeExpressionIterator;
function shallowStripNode(node) {
    return node.expression;
}
exports.shallowStripNode = shallowStripNode;
function makeStripNode(makeIterator) {
    const iterator = (makeIterator(node => iterator(shallowStripNode(node))));
    return iterator;
}
exports.makeStripNode = makeStripNode;
exports.stripExpressionNodes = makeStripNode(makeExpressionIterator);
function stripNode(node) {
    return exports.stripExpressionNodes(shallowStripNode(node));
}
exports.stripNode = stripNode;
// function reduceExpression<A>(f: (input: Expression<A>) => A): (input: Expression) => A {
//   // Doesn't work, will just cause infinite loop
//   const nestedIterator = (expression: Expression) => reduceIterator(expression);
//   const iterators: ReductionIteratorMap<Expression['kind'], Expression, Expression, A> = {
//     Identifier: f,
//     BooleanExpression: f,
//     StringExpression: f,
//     NumberExpression: f,
//     SymbolExpression: f,
//     DataInstantiation: nestedIterator,
//     Application: applicationMapIterator(f),
//     ReadDataPropertyExpression: nestedIterator,
//     ReadRecordPropertyExpression: nestedIterator,
//     FunctionExpression: nestedIterator,
//     DualExpression: nestedIterator,
//     BindingExpression: nestedIterator,
//     NativeExpression: nestedIterator,
//     PatternMatchExpression: nestedIterator,
//     RecordExpression: nestedIterator,
//   };
//   const reduceIterator = makeReduceIterator<'Expression', Expression, Expression, A>(iterators);
//   return reduceIterator;
// }
// function a<D, A>(f: NodeWithExpression<D, A>): (node: NodeWithExpression<D, any>)
//# sourceMappingURL=iterators-specific.js.map