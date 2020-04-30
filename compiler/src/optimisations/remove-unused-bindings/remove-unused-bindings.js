"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const visitor_utils_1 = require("../../type-checker/visitor-utils");
function removedUnusedBindingsVisitor(node) {
    if (node.expression.kind === 'BindingExpression') {
        const [variables] = node.expression.body;
        if (!variables.includes(node.expression.name)) {
            return node.expression.body;
        }
    }
    let allVariables = [];
    const expression = visitor_utils_1.visitAndTransformChildExpression(([variables, node]) => {
        allVariables = allVariables.concat(variables);
        return node;
    })(node.expression);
    if (expression.kind === 'Identifier') {
        allVariables.push(expression.name);
    }
    return [allVariables, Object.assign(Object.assign({}, node), { expression })];
}
function removeUnusedBindings(node) {
    const [_, resultNode] = visitor_utils_1.visitAndTransformNode(removedUnusedBindingsVisitor)(node);
    return resultNode;
}
exports.removeUnusedBindings = removeUnusedBindings;
//# sourceMappingURL=remove-unused-bindings.js.map