"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tokenize_1 = require("./tokenize");
const breakToken = { kind: 'break', value: '' };
function* produceExpressionTokens(lexer) {
    let startOfLine = true;
    let previousIndent = undefined;
    let currentIndent = 0;
    for (const { kind, value } of lexer) {
        switch (kind) {
            case tokenize_1.TokenKind.unknown:
            case tokenize_1.TokenKind.comment:
                break;
            case tokenize_1.TokenKind.lineBreak:
                startOfLine = true;
                previousIndent = currentIndent;
                currentIndent = 0;
                break;
            case tokenize_1.TokenKind.whitespace:
                if (startOfLine) {
                    currentIndent += Math.floor(value.length / 2);
                }
                break;
            default:
                if (startOfLine) {
                    startOfLine = false;
                    if (previousIndent !== undefined) {
                        for (let i = previousIndent; i >= currentIndent; i--) {
                            yield breakToken;
                        }
                    }
                }
                yield { kind, value };
        }
    }
    if (startOfLine && previousIndent !== undefined) {
        yield breakToken;
    }
}
exports.produceExpressionTokens = produceExpressionTokens;
//# sourceMappingURL=produce-expression-tokens.js.map