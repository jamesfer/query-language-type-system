import { GenericToken, Token, TokenKind } from './tokenize';

export type ExpressionTokenKind =
  | 'break'
  | 'keyword'
  | 'identifier'
  | 'string'
  | 'boolean'
  | 'number'
  | 'arrow'
  | 'colon'
  | 'dot'
  | 'hash'
  | 'equals'
  | 'bar'
  | 'openParen'
  | 'closeParen';

export interface ExpressionToken extends GenericToken<ExpressionTokenKind> {}

const breakToken: GenericToken<'break'> = { kind: 'break', value: '' };

export function * produceExpressionTokens(lexer: Iterable<Token>): Iterable<ExpressionToken> {
  let startOfLine = true;
  let previousIndent: number | undefined = undefined;
  let currentIndent = 0;
  for (const { kind, value } of lexer) {
    switch (kind) {
      case TokenKind.unknown:
        break;

      case TokenKind.lineBreak:
        startOfLine = true;
        previousIndent = currentIndent;
        currentIndent = 0;
        break;

      case TokenKind.whitespace:
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
