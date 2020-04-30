"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const prelude_library_1 = tslib_1.__importDefault(require("./prelude-library"));
const parse_1 = tslib_1.__importDefault(require("../parser/parse"));
function replaceEndWith(prelude, expression) {
    if (prelude.kind === 'BindingExpression') {
        return Object.assign(Object.assign({}, prelude), { body: replaceEndWith(prelude.body, expression) });
    }
    if (prelude.kind === 'StringExpression' && prelude.value === "END") {
        return expression;
    }
    throw new Error(`Failed to find the end of the prelude expression. Ended on ${expression.kind}`);
}
function attachPrelude(expression) {
    const { messages, value: preludeExpression } = parse_1.default(prelude_library_1.default);
    if (!preludeExpression) {
        throw new Error('Failed to compile prelude library. Messages: ' + messages.join(', '));
    }
    return replaceEndWith(preludeExpression, expression);
}
exports.attachPrelude = attachPrelude;
//# sourceMappingURL=attach-prelude.js.map