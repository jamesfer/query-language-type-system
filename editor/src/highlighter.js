"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("codemirror/addon/comment/comment");
const query_language_compiler_1 = require("query-language-compiler");
const utils_1 = require("./utils");
class Highlighter {
    constructor(config, modeOptions) {
        this.config = config;
        this.modeOptions = modeOptions;
        this.lineComment = '--';
    }
    token(stream, state) {
        const token = this.nextToken(stream);
        return token ? this.mapTokenKindToStyle(token) : null;
    }
    nextToken(stream) {
        // Try to consume spaces because the tokenize method hides whitespace from its results
        // if (stream.eatSpace()) {
        //   return null;
        // }
        const tokens = query_language_compiler_1.tokenize(stream.string.slice(stream.pos));
        for (const token of tokens) {
            // Eat characters from the stream
            stream.match(token.value);
            return token.kind;
        }
        stream.eat(/./);
        return query_language_compiler_1.TokenKind.unknown;
    }
    mapTokenKindToStyle(kind) {
        switch (kind) {
            case query_language_compiler_1.TokenKind.keyword:
                return 'keyword';
            case query_language_compiler_1.TokenKind.identifier:
                return 'variable-1';
            case query_language_compiler_1.TokenKind.boolean:
                return 'atom';
            case query_language_compiler_1.TokenKind.number:
                return 'number';
            case query_language_compiler_1.TokenKind.string:
                return 'string';
            // case TokenKind.comment:
            //   return 'comment';
            case query_language_compiler_1.TokenKind.openBrace:
                return '{';
            case query_language_compiler_1.TokenKind.closeBrace:
                return '}';
            case query_language_compiler_1.TokenKind.openParen:
                return '(';
            case query_language_compiler_1.TokenKind.closeParen:
                return ')';
            // case TokenKind.OpenBracket:
            //   return '[';
            //
            // case TokenKind.CloseBracket:
            //   return ']';
            case query_language_compiler_1.TokenKind.comma:
                return ',';
            case query_language_compiler_1.TokenKind.bar:
                return '|';
            // case TokenKind.AddOperator:
            // case TokenKind.SubtractOperator:
            // case TokenKind.MultiplyOperator:
            // case TokenKind.DivideOperator:
            // case TokenKind.ModuloOperator:
            // case TokenKind.PowerOperator:
            // case TokenKind.LessThan:
            // case TokenKind.LessEqual:
            // case TokenKind.GreaterThan:
            // case TokenKind.GreaterEqual:
            case query_language_compiler_1.TokenKind.equals:
            // case TokenKind.NotEqual:
            // case TokenKind.InOperator:
            // case TokenKind.RangeOperator:
            // case TokenKind.ComposeOperator:
            case query_language_compiler_1.TokenKind.colon:
            case query_language_compiler_1.TokenKind.arrow:
            case query_language_compiler_1.TokenKind.dot:
            case query_language_compiler_1.TokenKind.hash:
                return 'operator';
            case query_language_compiler_1.TokenKind.comment:
                return 'comment';
            case query_language_compiler_1.TokenKind.whitespace:
            case query_language_compiler_1.TokenKind.lineBreak:
                return null;
            case query_language_compiler_1.TokenKind.unknown:
                return 'error';
            default:
                utils_1.assertNever(kind);
        }
    }
}
exports.default = Highlighter;
//# sourceMappingURL=highlighter.js.map