import { GenericToken, Token } from './tokenize';
export declare type ExpressionTokenKind = 'break' | 'keyword' | 'identifier' | 'string' | 'boolean' | 'number' | 'arrow' | 'colon' | 'dot' | 'hash' | 'equals' | 'bar' | 'comma' | 'openParen' | 'closeParen' | 'openBrace' | 'closeBrace';
export interface ExpressionToken extends GenericToken<ExpressionTokenKind> {
}
export declare function produceExpressionTokens(lexer: Iterable<Token>): Iterable<ExpressionToken>;
//# sourceMappingURL=produce-expression-tokens.d.ts.map