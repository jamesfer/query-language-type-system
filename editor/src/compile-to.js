"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const query_language_compiler_1 = require("query-language-compiler");
const utils_1 = require("./utils");
function toBackend(expression, node, backend) {
    let i = 0;
    function makeUniqueId(prefix = 'variable') {
        i += 1;
        return `${prefix}${i}`;
    }
    switch (backend) {
        case 'javascript':
            return query_language_compiler_1.generateJavascript(expression, { module: 'esm' });
        case 'cpp':
            return query_language_compiler_1.generateCpp(makeUniqueId, node);
        default:
            return utils_1.assertNever(backend);
    }
}
function compileTo(code, options) {
    const { messages, expression, node } = query_language_compiler_1.compile(code);
    if (expression && node) {
        const output = toBackend(expression, node, options.backend);
        return { messages, output };
    }
    return { messages, output: undefined };
}
exports.default = compileTo;
//# sourceMappingURL=compile-to.js.map