import { produceExpressionTokens } from './produce-expression-tokens';
import { TokenKind } from './tokenize';

describe('produceExpressionTokens', () => {
  it.each<[TokenKind, string]>([
    [TokenKind.whitespace, ' '],
    [TokenKind.unknown, ''],
    [TokenKind.comment, '-- Hello this is a comment'],
  ])('strips out %s tokens', (kind, value) => {
    const result = Array.from(produceExpressionTokens([
      { kind: TokenKind.colon, value: ':' },
      { kind, value },
      { kind: TokenKind.number, value: '9' },
    ]));
    expect(result).toEqual([
      { kind: TokenKind.colon, value: ':' },
      { kind: TokenKind.number, value: '9' },
    ]);
  });

  it('converts new lines to break tokens', () => {
    const result = Array.from(produceExpressionTokens([
      { kind: TokenKind.identifier, value: 'b' },
      { kind: TokenKind.lineBreak, value: '\n' },
    ]));
    expect(result).toEqual([
      { kind: 'identifier', value: 'b' },
      { kind: 'break', value: '' },
    ]);
  });

  it('does not emit a break if the next line has more indentation', () => {
    const result = Array.from(produceExpressionTokens([
      { kind: TokenKind.identifier, value: 'b' },
      { kind: TokenKind.lineBreak, value: '\n' },
      { kind: TokenKind.whitespace, value: '  ' },
      { kind: TokenKind.number, value: '9' },
    ]));
    expect(result).toEqual([
      { kind: 'identifier', value: 'b' },
      { kind: 'number', value: '9' },
    ]);
  });

  it('emits a break for each reduction of indentation', () => {
    const result = Array.from(produceExpressionTokens([
      { kind: TokenKind.whitespace, value: '  ' },
      { kind: TokenKind.identifier, value: 'b' },
      { kind: TokenKind.lineBreak, value: '\n' },
      { kind: TokenKind.identifier, value: 'c' },
    ]));
    expect(result).toEqual([
      { kind: 'identifier', value: 'b' },
      { kind: 'break', value: '' },
      { kind: 'break', value: '' },
      { kind: 'identifier', value: 'c' },
    ]);
  });

  it('does not emit any tokens on empty input', () => {
    expect(Array.from(produceExpressionTokens([]))).toEqual([]);
  })
});
