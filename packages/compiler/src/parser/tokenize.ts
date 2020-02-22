import * as moo from 'moo';

export enum TokenKind {
  whitespace = 'whitespace',
  keyword = 'keyword',
  identifier = 'identifier',
  // string = 'string',
  boolean = 'boolean',
  number = 'number',
  arrow = 'arrow',
  colon = 'colon',
  dot = 'dot',
  hash = 'hash',
  equals = 'equals',
  bar = 'bar',
  openParen = 'openParen',
  closeParen = 'closeParen',
  // openBracket,
  // closeBracket,
  unknown = 'unknown',
}

export interface Token {
  kind: TokenKind;
  value: string;
}

export const rules: moo.Rules = {
  [TokenKind.whitespace]: { match: /\s+/, lineBreaks: true },
  [TokenKind.identifier]: {
    match: /[a-zA-Z_][a-zA-Z0-9_]*/,
    type: moo.keywords({
      [TokenKind.keyword]: ['let', 'implicit', 'match'],
      [TokenKind.boolean]: ['true', 'false'],
    }),
  },
  [TokenKind.number]: /[0-9]+/,
  // [TokenKind.string]: /"[^"]*?"/,
  [TokenKind.arrow]: '->',
  [TokenKind.colon]: ':',
  [TokenKind.dot]: '.',
  [TokenKind.hash]: '#',
  [TokenKind.equals]: '=',
  [TokenKind.bar]: '|',
  [TokenKind.openParen]: '(',
  [TokenKind.closeParen]: ')',
  [TokenKind.unknown]: /./,
};

const lexer = moo.compile(rules);

export default function * tokenize(code: string): Iterable<Token> {
  lexer.reset(code);
  for (const { type, value } of lexer) {
    if (type) {
      const kind = type as unknown as TokenKind;
      yield { kind, value };
    }
  }
}
