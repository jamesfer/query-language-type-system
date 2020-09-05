"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeUnusedBindings = void 0;
const lodash_1 = require("lodash");
const desugar_pattern_match_1 = require("../../desugar/desugar-pattern-match");
const visitor_utils_1 = require("../../type-checker/visitor-utils");
function collectChildBindings(node) {
    const allVariables = [];
    const collector = ([variables, expression]) => {
        allVariables.push(variables);
        return expression;
    };
    const expression = desugar_pattern_match_1.makePatternMatchDesugaredNodeIterator(collector)(node);
    return [lodash_1.flatten(allVariables), expression];
}
function removedUnusedBindingsVisitor(node) {
    const expression = node.expression;
    if (expression.kind === 'BindingExpression') {
        // Check if the binding is used inside the body
        const [variables] = expression.body;
        if (!variables.includes(expression.name)) {
            return expression.body;
        }
    }
    else if (expression.kind === 'Identifier') {
        return [[expression.name], Object.assign(Object.assign({}, node), { expression })];
    }
    const [variables, plainExpression] = collectChildBindings(expression);
    return [variables, Object.assign(Object.assign({}, node), { expression: plainExpression })];
}
function removeUnusedBindings(node) {
    const internal = (node) => (removedUnusedBindingsVisitor(visitor_utils_1.mapNode(iterator, node)));
    const iterator = desugar_pattern_match_1.makePatternMatchDesugaredNodeIterator(internal);
    const [, result] = internal(node);
    return result;
}
exports.removeUnusedBindings = removeUnusedBindings;
//# sourceMappingURL=remove-unused-bindings.js.map