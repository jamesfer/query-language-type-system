import { ExpressionToken } from '../produce-expression-tokens';
export interface WithTokens<T> {
    tokens: ExpressionToken[];
    value: T;
}
export declare function withTokens<T>(tokens: ExpressionToken[], value: T): WithTokens<T>;
export declare function mapWithTokens<A, B>(f: (a: A) => B): (result: WithTokens<A>) => WithTokens<B>;
export declare function mapWithTokens<A, B>(result: WithTokens<A>, f: (a: A) => B): WithTokens<B>;
export declare function flatMapWithTokens<A, B>({ tokens, value }: WithTokens<A>, f: (a: A) => WithTokens<B>): WithTokens<B>;
//# sourceMappingURL=token-state.d.ts.map