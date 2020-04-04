import tokenize, { TokenKind } from './tokenize';

describe('tokenize', () => {
  it('tokenizes a number literal', () => {
    expect(Array.from(tokenize('5'))).toEqual([{ kind: TokenKind.number, value: '5' }]);
  });

  it('tokenizes a bind expression', () => {
    expect(Array.from(tokenize('let a = 5\na'))).toEqual([
      { kind: TokenKind.keyword, value: 'let' },
      { kind: TokenKind.whitespace, value: ' ' },
      { kind: TokenKind.identifier, value: 'a' },
      { kind: TokenKind.whitespace, value: ' ' },
      { kind: TokenKind.equals, value: '=' },
      { kind: TokenKind.whitespace, value: ' ' },
      { kind: TokenKind.number, value: '5' },
      { kind: TokenKind.lineBreak, value: '\n' },
      { kind: TokenKind.identifier, value: 'a' },
    ]);
  });

  it('tokenizes a comment', () => {
    expect(Array.from(tokenize('5-- Hello\n10'))).toEqual([
      { kind: TokenKind.number, value: '5' },
      { kind: TokenKind.comment, value: '-- Hello' },
      { kind: TokenKind.lineBreak, value: '\n' },
      { kind: TokenKind.number, value: '10' },
    ]);
  });
});
