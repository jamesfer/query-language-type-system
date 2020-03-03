import * as moo from 'moo';
export declare enum TokenKind {
    lineBreak = "lineBreak",
    whitespace = "whitespace",
    keyword = "keyword",
    identifier = "identifier",
    string = "string",
    boolean = "boolean",
    number = "number",
    arrow = "arrow",
    colon = "colon",
    dot = "dot",
    hash = "hash",
    equals = "equals",
    bar = "bar",
    comma = "comma",
    openParen = "openParen",
    closeParen = "closeParen",
    openBrace = "openBrace",
    closeBrace = "closeBrace",
    unknown = "unknown"
}
export interface GenericToken<K> {
    kind: K;
    value: string;
}
export interface Token extends GenericToken<TokenKind> {
}
export declare const rules: moo.Rules;
export default function tokenize(code: string): Iterable<Token>;
//# sourceMappingURL=tokenize.d.ts.map