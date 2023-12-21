import * as moo from 'moo';
import { GenericToken } from './types/generic-token';

export enum TokenKind {
  lineBreak = 'lineBreak',
  whitespace = 'whitespace',
  keyword = 'keyword',
  identifier = 'identifier',
  string = 'string',
  boolean = 'boolean',
  number = 'number',
  arrow = 'arrow',
  colon = 'colon',
  dot = 'dot',
  hash = 'hash',
  equals = 'equals',
  bar = 'bar',
  comma = 'comma',
  openParen = 'openParen',
  closeParen = 'closeParen',
  openBrace = 'openBrace',
  closeBrace = 'closeBrace',
  comment = 'comment',
  // openBracket,
  // closeBracket,
  unknown = 'unknown',
}

export interface Token extends GenericToken<TokenKind> {}

export const rules: moo.Rules = {
  [TokenKind.lineBreak]: { match: /(?:\r\n?|\n)+/, lineBreaks: true },
  [TokenKind.whitespace]: / +/,
  [TokenKind.comment]: { match: /--[^\r\n]*(?:\r\n|\n)*/, lineBreaks: true },
  [TokenKind.identifier]: {
    match: /[a-zA-Z_][a-zA-Z0-9_]*/,
    type: moo.keywords({
      [TokenKind.keyword]: ['let', 'implicit', 'match', 'data'],
      [TokenKind.boolean]: ['true', 'false'],
    }),
  },
  [TokenKind.number]: /(?:-?[0-9]+(?:\.[0-9]+)?|-?\.[0-9]+)(?:[eE](?:-?[0-9]+(?:\.[0-9]+)?|-?\.[0-9]+))?/,
  [TokenKind.string]: /"[^"]*?"/,
  [TokenKind.arrow]: '->',
  [TokenKind.colon]: ':',
  [TokenKind.dot]: '.',
  [TokenKind.hash]: '#',
  [TokenKind.equals]: '=',
  [TokenKind.bar]: '|',
  [TokenKind.comma]: ',',
  [TokenKind.openParen]: '(',
  [TokenKind.closeParen]: ')',
  [TokenKind.openBrace]: '{',
  [TokenKind.closeBrace]: '}',
  [TokenKind.unknown]: /./,
};

let cachedLexer: moo.Lexer | undefined;

function makeLexer(): moo.Lexer {
  if (cachedLexer === undefined) {
    cachedLexer = moo.compile(rules);
  }
  return cachedLexer;
}

export default function * tokenize(code: string): Iterable<Token> {
  const lexer = makeLexer();
  lexer.reset(code);
  for (const { type, value } of lexer) {
    if (type) {
      const kind = type as unknown as TokenKind;
      yield { kind, value };
    }
  }
}
