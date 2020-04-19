import { Expression } from '../..';
import { Free } from '../../utils/free';
import { ExpressionToken } from '../produce-expression-tokens';
import { WithMessages } from './message-state';
import { WithTokens } from './token-state';
export declare enum Precedence {
    none = 0,
    bindingEquals = 1,
    record = 2,
    functionArrow = 3,
    functionArrowParam = 4,
    implicitFunctionArrowParam = 5,
    patternMatch = 6,
    application = 7,
    application2 = 8,
    dual = 9,
    readProperty = 10,
    parenthesis = 11
}
export declare type InterpreterFunction<T> = (tokens: ExpressionToken[], previous: Expression | undefined, precedence: Precedence) => Free<WithMessages<WithTokens<T>[]>>;
export interface Interpreter<T> {
    name: string | undefined;
    interpret: InterpreterFunction<T>;
}
export declare function interpreter<T>(name: string | undefined, interpret: InterpreterFunction<T>): Interpreter<T>;
export declare function runInterpreter<T>(interpreter: Interpreter<T>, tokens: ExpressionToken[], previous: Expression | undefined, precedence: Precedence): Free<WithMessages<WithTokens<T>[]>>;
//# sourceMappingURL=interpreter-utils.d.ts.map