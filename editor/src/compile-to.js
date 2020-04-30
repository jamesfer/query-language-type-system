"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_language_compiler_1 = require("query-language-compiler");
function toBackend(expression, backend) {
    switch (backend) {
        case 'javascript':
            return query_language_compiler_1.generateJavascript(expression, { module: 'esm' });
    }
}
function compileTo(code, options) {
    const { messages, expression } = query_language_compiler_1.compile(code);
    const output = expression ? toBackend(expression, options.backend) : undefined;
    return { messages, output };
}
exports.default = compileTo;
//# sourceMappingURL=compile-to.js.map