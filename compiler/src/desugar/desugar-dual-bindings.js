"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDualBindingDesugaredNodeIterator = exports.desugarDualBindings = void 0;
const visitor_utils_1 = require("../type-checker/visitor-utils");
const desugar_destructuring_1 = require("./desugar-destructuring");
const iterators_core_1 = require("./iterators-core");
const iterators_specific_1 = require("./iterators-specific");
function shallowDesugarDualBindings({ expression, decoration }) {
    switch (expression.kind) {
        case 'Identifier':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'SymbolExpression':
        case 'RecordExpression':
        case 'Application':
        case 'SimpleFunctionExpression':
        case 'DataInstantiation':
        case 'ReadRecordPropertyExpression':
        case 'ReadDataPropertyExpression':
        case 'PatternMatchExpression':
        case 'NativeExpression':
        case 'BindingExpression':
            return { expression, decoration, kind: 'Node' };
        case 'DualExpression':
            if (expression.left.expression.kind === 'NativeExpression'
                || expression.right.expression.kind === 'Identifier') {
                return expression.left;
            }
            if (expression.right.expression.kind === 'NativeExpression'
                || expression.left.expression.kind === 'Identifier') {
                return expression.right;
            }
            throw new Error(`Cannot simplify DualExpression: ${JSON.stringify(expression, undefined, 2)}`);
    }
}
function desugarDualBindings(node) {
    const internal = (node) => shallowDesugarDualBindings(visitor_utils_1.mapNode(iterator, node));
    const iterator = desugar_destructuring_1.makeDesugaredNodeIterator(internal);
    return internal(node);
}
exports.desugarDualBindings = desugarDualBindings;
function makeDualBindingDesugaredNodeIterator(f) {
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
        SimpleFunctionExpression: desugar_destructuring_1.simpleFunctionMapIterator,
        BindingExpression: iterators_specific_1.bindingMapIterator,
        PatternMatchExpression: iterators_specific_1.patternMatchMapIterator,
        RecordExpression: iterators_specific_1.recordMapIterator,
    })(f);
}
exports.makeDualBindingDesugaredNodeIterator = makeDualBindingDesugaredNodeIterator;
//# sourceMappingURL=desugar-dual-bindings.js.map