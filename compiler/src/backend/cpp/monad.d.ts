export declare class State<S> {
    protected state: S;
    constructor(state: S);
    get(): S;
    set(state: S): void;
}
export declare class ArrayState<S> extends State<S[]> {
    constructor(state?: S[]);
    append(value: S): void;
    concat(values: S[]): void;
}
export declare class MapState<K extends string | number, S> extends State<Record<K, S>> {
    constructor(state?: Record<K, S>);
    property(key: K): S | undefined;
    setProperty(key: K, value: S): void;
}
export declare class FState<T extends any[], R> extends State<(...args: T) => R> {
    constructor(f: (...args: T) => R);
    apply(...args: T): R;
}
export declare class CombinedState<S extends {
    [k: string]: State<any>;
}> extends State<S> {
    constructor(state: S);
    child<K extends keyof S>(key: K): S[K];
}
export declare class Monad<S extends State<any>, T> {
    private f;
    static of<S extends State<any>, T>(f: (state: S) => T): Monad<S, T>;
    static pure<S extends State<any>, T>(t: T): Monad<S, T>;
    private constructor();
    run(state: S): T;
}
export declare function mapM<S extends State<any>, A, B>(monad: Monad<S, A>, f: (a: A) => B): Monad<S, B>;
export declare function flatMapM<S extends State<any>, A, B>(monad: Monad<S, A>, f: (a: A) => Monad<S, B>): Monad<S, B>;
export declare function sequenceM<S extends State<any>, T>(monads: Monad<S, T>[]): Monad<S, T[]>;
export declare function traverseM<S extends State<any>, A, B>(values: A[], f: (a: A) => Monad<S, B>): Monad<S, B[]>;
export declare type MonadRecordValues<T> = {
    [K in keyof T]: T[K] extends Monad<any, infer A> ? A : unknown;
};
export declare function flattenRM<S extends State<any>, T, R extends Record<string, Monad<S, T>>>(record: R): Monad<S, MonadRecordValues<R>>;
export declare function pipeRecord<S extends State<any>, R, I extends {
    [k: string]: Monad<S, any>;
}>(initial: I, final: (record: MonadRecordValues<I>) => R): Monad<S, R>;
export declare function pipeRecord<S extends State<any>, R, I extends {
    [k: string]: Monad<S, any>;
}, I2 extends {
    [k: string]: Monad<S, any>;
}>(initial: I, f1: (record: MonadRecordValues<I>) => I2, final: (record: MonadRecordValues<I & I2>) => R): Monad<S, R>;
export declare function pipeRecord<S extends State<any>, R, I extends {
    [k: string]: Monad<S, any>;
}, I2 extends {
    [k: string]: Monad<S, any>;
}, I3 extends {
    [k: string]: Monad<S, any>;
}>(initial: I, f1: (record: MonadRecordValues<I>) => I2, f2: (record: MonadRecordValues<I & I2>) => I3, final: (record: MonadRecordValues<I & I2 & I3>) => R): Monad<S, R>;
//# sourceMappingURL=monad.d.ts.map