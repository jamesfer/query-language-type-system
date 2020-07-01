"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const tokenize_1 = tslib_1.__importStar(require("./tokenize"));
describe('tokenize', () => {
    it.each([
        '0',
        '5',
        '-5',
        '123',
        '123.1',
        '123.100',
        '0.0',
        '0.123',
        '.123',
        '-.123',
        '123.0e10',
        '123.0e.10',
        '123.123E10',
        '123.0E-10',
        '123.123e-0.132',
        '123.123e-.123',
    ])('tokenizes the number literal %s', (code) => {
        expect(Array.from(tokenize_1.default(code))).toEqual([{ kind: tokenize_1.TokenKind.number, value: code }]);
    });
    it.each([
        '.',
        '-.',
        '123.',
        '123.e',
        '123.0e0.',
    ])('does not tokenize the literal %s as a number', (code) => {
        expect(Array.from(tokenize_1.default(code))).not.toEqual([{ kind: tokenize_1.TokenKind.number, value: code }]);
    });
    it('tokenizes a bind expression', () => {
        expect(Array.from(tokenize_1.default('let a = 5\na'))).toEqual([
            { kind: tokenize_1.TokenKind.keyword, value: 'let' },
            { kind: tokenize_1.TokenKind.whitespace, value: ' ' },
            { kind: tokenize_1.TokenKind.identifier, value: 'a' },
            { kind: tokenize_1.TokenKind.whitespace, value: ' ' },
            { kind: tokenize_1.TokenKind.equals, value: '=' },
            { kind: tokenize_1.TokenKind.whitespace, value: ' ' },
            { kind: tokenize_1.TokenKind.number, value: '5' },
            { kind: tokenize_1.TokenKind.lineBreak, value: '\n' },
            { kind: tokenize_1.TokenKind.identifier, value: 'a' },
        ]);
    });
    it('tokenizes a comment', () => {
        expect(Array.from(tokenize_1.default('5-- Hello\n10'))).toEqual([
            { kind: tokenize_1.TokenKind.number, value: '5' },
            { kind: tokenize_1.TokenKind.comment, value: '-- Hello\n' },
            { kind: tokenize_1.TokenKind.number, value: '10' },
        ]);
    });
});
//# sourceMappingURL=tokenize.test.js.map