import { Token, TokenKind } from './tokenize';
import { GenericToken } from './types/generic-token';

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
  | 'comma'
  | 'openParen'
  | 'closeParen'
  | 'openBrace'
  | 'closeBrace';

export interface ExpressionToken extends GenericToken<ExpressionTokenKind> {}

const BREAK_TOKEN: GenericToken<'break'> = { kind: 'break', value: '' };

export function * produceExpressionTokens(lexer: Iterable<Token>): Iterable<ExpressionToken> {
  let startOfLine = true;
  let previousIndent: number | undefined = undefined;
  let currentIndent = 0;
  for (const { kind, value } of lexer) {
    switch (kind) {
      // Skip comment tokens
      case TokenKind.unknown:
      case TokenKind.comment:
        break;

      // Reset indentation on line-breaks
      case TokenKind.lineBreak:
        startOfLine = true;
        previousIndent = currentIndent;
        currentIndent = 0;
        break;

      // Count the current indentation level
      case TokenKind.whitespace:
        if (startOfLine) {
          currentIndent += Math.floor(value.length / 2);
        }
        break;

      default:
        if (startOfLine) {
          startOfLine = false;
          if (previousIndent !== undefined) {
            for (let i = previousIndent; i >= currentIndent; i -= 1) {
              yield BREAK_TOKEN;
            }
          }
        }
        yield { kind, value };
    }
  }

  if (startOfLine && previousIndent !== undefined) {
    yield BREAK_TOKEN;
  }
}
