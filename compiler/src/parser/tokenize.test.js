"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const tokenize_1 = tslib_1.__importStar(require("./tokenize"));
describe('tokenize', () => {
    it('tokenizes a number literal', () => {
        expect(Array.from(tokenize_1.default('5'))).toEqual([{ kind: tokenize_1.TokenKind.number, value: '5' }]);
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
            { kind: tokenize_1.TokenKind.comment, value: '-- Hello' },
            { kind: tokenize_1.TokenKind.lineBreak, value: '\n' },
            { kind: tokenize_1.TokenKind.number, value: '10' },
        ]);
    });
});
//# sourceMappingURL=tokenize.test.js.map