import { EditorConfiguration, Mode, StringStream } from 'codemirror';
import 'codemirror/addon/comment/comment';
import { tokenize, TokenKind } from 'query-language-compiler';
import { assertNever } from './utils';

export type Many<T> = T | T[];

export interface HighlighterState {
  inString?: string | undefined;
}

export default class Highlighter implements Mode<HighlighterState> {
  lineComment = '--';

  constructor(
    private readonly config: EditorConfiguration,
    private readonly modeOptions?: any,
  ) {}

  token(stream: StringStream, state: HighlighterState): string | null {
    const token = this.nextToken(stream);
    return token ? this.mapTokenKindToStyle(token) : null;
  }

  private nextToken(stream: StringStream): TokenKind {
    // Try to consume spaces because the tokenize method hides whitespace from its results
    // if (stream.eatSpace()) {
    //   return null;
    // }

    const tokens = tokenize(stream.string.slice(stream.pos));
    for (const token of tokens) {
      // Eat characters from the stream
      stream.match(token.value);

      return token.kind;
    }

    stream.eat(/./);
    return TokenKind.unknown;
  }

  private mapTokenKindToStyle(kind: TokenKind): string | null {
    switch (kind) {
      case TokenKind.keyword:
        return 'keyword';

      case TokenKind.identifier:
        return 'variable-1';

      case TokenKind.number:
        return 'number';

      case TokenKind.boolean:
        return 'atom';

      // case TokenKind.comment:
      //   return 'comment';

      // case TokenKind.openBrace:
      //   return '{';

      // case TokenKind.CloseBrace:
      //   return '}';

      case TokenKind.openParen:
        return '(';

      case TokenKind.closeParen:
        return ')';

      // case TokenKind.OpenBracket:
      //   return '[';
      //
      // case TokenKind.CloseBracket:
      //   return ']';

      // case TokenKind.comma:
      //   return ',';

      case TokenKind.bar:
        return '|';

      // case TokenKind.AddOperator:
      // case TokenKind.SubtractOperator:
      // case TokenKind.MultiplyOperator:
      // case TokenKind.DivideOperator:
      // case TokenKind.ModuloOperator:
      // case TokenKind.PowerOperator:
      // case TokenKind.LessThan:
      // case TokenKind.LessEqual:
      // case TokenKind.GreaterThan:
      // case TokenKind.GreaterEqual:
      case TokenKind.equals:
      // case TokenKind.NotEqual:
      // case TokenKind.InOperator:
      // case TokenKind.RangeOperator:
      // case TokenKind.ComposeOperator:
      case TokenKind.colon:
      case TokenKind.arrow:
      case TokenKind.dot:
      case TokenKind.hash:
        return 'operator';

      case TokenKind.whitespace:
        return null;

      case TokenKind.unknown:
        return 'error';

      default:
        assertNever(kind);
    }
  }
}
