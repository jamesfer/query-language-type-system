"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildScopedNode = void 0;
const lodash_1 = require("lodash");
const iterators_specific_1 = require("../../desugar/iterators-specific");
const constructors_1 = require("../constructors");
const extract_destructurable_bindings_1 = require("./extract-destructurable-bindings");
function expandScope(scope, newBindings) {
    return {
        bindings: Object.assign(Object.assign({}, scope.bindings), newBindings),
    };
}
function buildBindingScope(scope, expression) {
    const bodyScope = expandScope(scope, { [expression.name]: expression.value.decoration.type });
    return Object.assign(Object.assign({}, expression), { value: shallowBuildScope(scope)(expression.value), body: shallowBuildScope(bodyScope)(expression.body) });
}
function buildFunctionScope(scope, expression) {
    const identifiers = extract_destructurable_bindings_1.extractDestructurableBindings(expression.parameter);
    const bodyScope = expandScope(scope, lodash_1.fromPairs(identifiers.filter(([name]) => !(name in scope))));
    return Object.assign(Object.assign({}, expression), { parameter: shallowBuildScope(scope)(expression.parameter), body: shallowBuildScope(bodyScope)(expression.body) });
}
function attachScope(scope, decoration, expression) {
    return constructors_1.node(expression, Object.assign(Object.assign({}, decoration), { scope }));
}
const shallowBuildScope = (scope) => (node) => {
    switch (node.expression.kind) {
        case 'BindingExpression':
            return attachScope(scope, node.decoration, buildBindingScope(scope, node.expression));
        case 'FunctionExpression':
            return attachScope(scope, node.decoration, buildFunctionScope(scope, node.expression));
        default: {
            const scopedExpression = iterators_specific_1.makeExpressionIterator(shallowBuildScope(scope))(node.expression);
            return attachScope(scope, node.decoration, scopedExpression);
        }
    }
};
function buildScopedNode(node) {
    return shallowBuildScope({ bindings: {} })(node);
}
exports.buildScopedNode = buildScopedNode;
//# sourceMappingURL=index.js.map