"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const moo = tslib_1.__importStar(require("moo"));
var TokenKind;
(function (TokenKind) {
    TokenKind["lineBreak"] = "lineBreak";
    TokenKind["whitespace"] = "whitespace";
    TokenKind["keyword"] = "keyword";
    TokenKind["identifier"] = "identifier";
    TokenKind["string"] = "string";
    TokenKind["boolean"] = "boolean";
    TokenKind["number"] = "number";
    TokenKind["arrow"] = "arrow";
    TokenKind["colon"] = "colon";
    TokenKind["dot"] = "dot";
    TokenKind["hash"] = "hash";
    TokenKind["equals"] = "equals";
    TokenKind["bar"] = "bar";
    TokenKind["comma"] = "comma";
    TokenKind["openParen"] = "openParen";
    TokenKind["closeParen"] = "closeParen";
    TokenKind["openBrace"] = "openBrace";
    TokenKind["closeBrace"] = "closeBrace";
    TokenKind["comment"] = "comment";
    // openBracket,
    // closeBracket,
    TokenKind["unknown"] = "unknown";
})(TokenKind = exports.TokenKind || (exports.TokenKind = {}));
exports.rules = {
    [TokenKind.lineBreak]: { match: /(?:\r\n?|\n)+/, lineBreaks: true },
    [TokenKind.whitespace]: / +/,
    [TokenKind.comment]: /--[^\r\n]*/,
    [TokenKind.identifier]: {
        match: /[a-zA-Z_][a-zA-Z0-9_]*/,
        type: moo.keywords({
            [TokenKind.keyword]: ['let', 'implicit', 'match', 'data'],
            [TokenKind.boolean]: ['true', 'false'],
        }),
    },
    [TokenKind.number]: /[0-9]+/,
    [TokenKind.string]: /"[^"]*?"/,
    [TokenKind.arrow]: '->',
    [TokenKind.colon]: ':',
    [TokenKind.dot]: '.',
    [TokenKind.hash]: '#',
    [TokenKind.equals]: '=',
    [TokenKind.bar]: '|',
    [TokenKind.comma]: ',',
    [TokenKind.openParen]: '(',
    [TokenKind.closeParen]: ')',
    [TokenKind.openBrace]: '{',
    [TokenKind.closeBrace]: '}',
    [TokenKind.unknown]: /./,
};
const lexer = moo.compile(exports.rules);
function* tokenize(code) {
    lexer.reset(code);
    for (const { type, value } of lexer) {
        if (type) {
            const kind = type;
            yield { kind, value };
        }
    }
}
exports.default = tokenize;
//# sourceMappingURL=tokenize.js.map