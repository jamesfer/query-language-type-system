import tokenize, { TokenKind } from './tokenize';

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
    expect(Array.from(tokenize(code))).toEqual([{ kind: TokenKind.number, value: code }]);
  });

  it.each([
    '.',
    '-.',
    '123.',
    '123.e',
    '123.0e0.',
  ])('does not tokenize the literal %s as a number', (code) => {
    expect(Array.from(tokenize(code))).not.toEqual([{ kind: TokenKind.number, value: code }]);
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
