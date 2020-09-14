"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.printCppAst = void 0;
const tslib_1 = require("tslib");
const utils_1 = require("../../type-checker/utils");
const dedent_js_1 = tslib_1.__importDefault(require("dedent-js"));
const cpp_ast_visitors_1 = require("./cpp-ast-visitors");
function indentLines(lines) {
    return lines.map(line => `    ${line}`);
}
function indent(string) {
    return indentLines(string.split('\n')).join('\n');
}
function printCppExpression(expression) {
    switch (expression.kind) {
        case 'Identifier':
            return expression.name;
        case 'Boolean':
            return expression.value.toString();
        case 'Number':
            return expression.value.toString();
        case 'String':
            return `"${expression.value}"`;
        case 'Application':
            return `${expression.callee}(${expression.parameters.join(', ')}`;
        case 'StructConstruction':
            return `${expression.structName}{${expression.parameters.join(', ')}`;
        case 'Lambda':
            return `[](${expression.parameters.map(printParameter).join(', ')}) -> {
        ${indentLines(expression.body.statements).map(line => `${line};`).join('\n')}
      }`;
        case 'ReadProperty':
            return `${expression.object}.${expression.property}`;
    }
}
function printParameter({ identifier, type }) {
    return `${type.value} ${identifier}`;
}
function printCppStatement(statement) {
    switch (statement.kind) {
        case 'ExpressionStatement':
            return `${statement.expression};`;
        case 'Return':
            return `return ${statement.value};`;
        case 'Binding':
            return `${statement.type.value} ${statement.name} = ${statement.value}`;
        case 'Struct': {
            const properties = statement.properties.map(printParameter).map(line => `${line};`);
            return dedent_js_1.default `
        struct ${statement.name} {
            ${indentLines(properties).join('\n')}
        };
      `;
        }
        case 'Function':
            const parameters = statement.parameters.map(printParameter).map(line => `${line};`);
            return dedent_js_1.default `
        ${statement.returnType.value} ${statement.name}(${parameters.join(', ')}) {
        ${indentLines(statement.body.statements).join('\n')}
        }
      `;
        default:
            return utils_1.assertNever(statement);
    }
}
function printCppAst(statements) {
    const transformer = cpp_ast_visitors_1.visitAndTransformCppStatement(printCppStatement, printCppExpression);
    return statements.map(transformer).join('\n\n');
}
exports.printCppAst = printCppAst;
//# sourceMappingURL=print-cpp-ast.js.map