import tokenize, { TokenKind } from './tokenize';

describe('tokenize', () => {
  it('tokenizes a number literal', () => {
    expect(Array.from(tokenize('5'))).toEqual([{ kind: TokenKind.number, value: '5' }]);
  });

  it('tokenizes a bind expression', () => {
    expect(Array.from(tokenize('let a = 5 a'))).toEqual([
      { kind: TokenKind.keyword, value: 'let' },
      { kind: TokenKind.identifier, value: 'a' },
      { kind: TokenKind.equals, value: '=' },
      { kind: TokenKind.number, value: '5' },
      { kind: TokenKind.identifier, value: 'a' },
    ]);
  });
});
