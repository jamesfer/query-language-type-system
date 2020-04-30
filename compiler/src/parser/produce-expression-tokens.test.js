"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const produce_expression_tokens_1 = require("./produce-expression-tokens");
const tokenize_1 = require("./tokenize");
describe('produceExpressionTokens', () => {
    it.each([
        [tokenize_1.TokenKind.whitespace, ' '],
        [tokenize_1.TokenKind.unknown, ''],
        [tokenize_1.TokenKind.comment, '-- Hello this is a comment'],
    ])('strips out %s tokens', (kind, value) => {
        const result = Array.from(produce_expression_tokens_1.produceExpressionTokens([
            { kind: tokenize_1.TokenKind.colon, value: ':' },
            { kind, value },
            { kind: tokenize_1.TokenKind.number, value: '9' },
        ]));
        expect(result).toEqual([
            { kind: tokenize_1.TokenKind.colon, value: ':' },
            { kind: tokenize_1.TokenKind.number, value: '9' },
        ]);
    });
    it('converts new lines to break tokens', () => {
        const result = Array.from(produce_expression_tokens_1.produceExpressionTokens([
            { kind: tokenize_1.TokenKind.identifier, value: 'b' },
            { kind: tokenize_1.TokenKind.lineBreak, value: '\n' },
        ]));
        expect(result).toEqual([
            { kind: 'identifier', value: 'b' },
            { kind: 'break', value: '' },
        ]);
    });
    it('does not emit a break if the next line has more indentation', () => {
        const result = Array.from(produce_expression_tokens_1.produceExpressionTokens([
            { kind: tokenize_1.TokenKind.identifier, value: 'b' },
            { kind: tokenize_1.TokenKind.lineBreak, value: '\n' },
            { kind: tokenize_1.TokenKind.whitespace, value: '  ' },
            { kind: tokenize_1.TokenKind.number, value: '9' },
        ]));
        expect(result).toEqual([
            { kind: 'identifier', value: 'b' },
            { kind: 'number', value: '9' },
        ]);
    });
    it('emits a break for each reduction of indentation', () => {
        const result = Array.from(produce_expression_tokens_1.produceExpressionTokens([
            { kind: tokenize_1.TokenKind.whitespace, value: '  ' },
            { kind: tokenize_1.TokenKind.identifier, value: 'b' },
            { kind: tokenize_1.TokenKind.lineBreak, value: '\n' },
            { kind: tokenize_1.TokenKind.identifier, value: 'c' },
        ]));
        expect(result).toEqual([
            { kind: 'identifier', value: 'b' },
            { kind: 'break', value: '' },
            { kind: 'break', value: '' },
            { kind: 'identifier', value: 'c' },
        ]);
    });
    it('does not emit any tokens on empty input', () => {
        expect(Array.from(produce_expression_tokens_1.produceExpressionTokens([]))).toEqual([]);
    });
});
//# sourceMappingURL=produce-expression-tokens.test.js.map