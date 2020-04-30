"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const interpreters_1 = tslib_1.__importDefault(require("./interpret-expression/interpreters"));
const produce_expression_tokens_1 = require("./produce-expression-tokens");
const tokenize_1 = tslib_1.__importDefault(require("./tokenize"));
function parse(code) {
    return interpreters_1.default(Array.from(produce_expression_tokens_1.produceExpressionTokens(tokenize_1.default(code))));
}
exports.default = parse;
//# sourceMappingURL=parse.js.map