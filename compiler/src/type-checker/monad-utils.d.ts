import { Message } from './types/message';
import { VariableReplacement } from './variable-utils';
import { Scope } from './types/scope';
export interface WriterResult<S, V> {
    state: S;
    value: V;
}
export declare class WriterMonad<S> {
    protected state: S;
    private combine;
    constructor(state: S, combine: (current: S, next: S) => S);
    update(state: S): void;
    append<V>({ state, value }: WriterResult<S, V>): V;
    wrap<V>(value: V): WriterResult<S, V>;
    static createResult<S, V>(state: S, value: V): WriterResult<S, V>;
}
export declare type TypeState = [Message[], VariableReplacement[]];
export interface TypeResult<V> extends WriterResult<TypeState, V> {
}
export declare class TypeWriter extends WriterMonad<TypeState> {
    scope: Scope;
    constructor(scope: Scope);
    get messages(): string[];
    get replacements(): VariableReplacement[];
    log(message: Message): void;
    logAll(messages: Message[]): void;
    recordReplacements(replacements: VariableReplacement[]): void;
    updateScope(newScope: Scope): void;
    expandScope(newScope: Scope): void;
    run<V, A extends any[]>(f: (scope: Scope) => (...args: A) => TypeResult<V>): (...args: A) => V;
    withChildScope<T>(f: (state: TypeWriter) => T): T;
    static emptyTypeState(): TypeState;
}
//# sourceMappingURL=monad-utils.d.ts.map