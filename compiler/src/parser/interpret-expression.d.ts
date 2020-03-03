import { Expression } from '..';
import { Message } from '..';
import { ExpressionToken } from './produce-expression-tokens';
export interface WithTokens<T> {
    tokens: ExpressionToken[];
    value: T;
}
export interface WithMessages<T> {
    messages: Message[];
    value: T;
}
declare enum Precedence {
    none = 0,
    bindingEquals = 1,
    functionArrow = 2,
    patternMatch = 3,
    application = 4,
    application2 = 5,
    dual = 6,
    readProperty = 7
}
declare type InterpreterFunction<T> = (tokens: ExpressionToken[], previous: Expression | undefined, precedence: Precedence) => WithMessages<WithTokens<T>[]>;
export interface Interpreter<T> {
    name: string | undefined;
    interpret: InterpreterFunction<T>;
}
export default function interpretExpression(tokens: ExpressionToken[]): WithMessages<Expression | undefined>;
export {};
//# sourceMappingURL=interpret-expression.d.ts.map