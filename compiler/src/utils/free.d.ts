export interface FreeFlatMap<A, T> {
    child: Free<A>;
    map(a: A): Free<T>;
}
export interface FreePure<T> {
    value: T;
}
export declare type Free<T> = FreeFlatMap<any, T> | FreePure<T>;
export declare function pureFree<T>(value: T): Free<T>;
export declare function deferFree<T>(value: () => Free<T>): Free<T>;
export declare function returningFree<T extends any[], B>(f: (...args: T) => B): (...args: T) => Free<B>;
export declare function flatMapFree<A, T>(child: Free<A>, map: (value: A) => Free<T>): Free<T>;
export declare function mapFree<A, T>(child: Free<A>, map: (value: A) => T): Free<T>;
export declare function traverseFree<A, B>(inputs: A[], f: (a: A) => Free<B>): Free<B[]>;
export declare function pipeFree<A1>(free: Free<A1>): Free<A1>;
export declare function pipeFree<A1, A2>(free: Free<A1>, f1: (a: A1) => Free<A2>): Free<A2>;
export declare function pipeFree<A1, A2, A3>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>): Free<A3>;
export declare function pipeFree<A1, A2, A3, A4>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>, f3: (a: A3) => Free<A4>): Free<A4>;
export declare function pipeFree<A1, A2, A3, A4, A5>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>, f3: (a: A3) => Free<A4>, f4: (a: A4) => Free<A5>): Free<A5>;
export declare function pipeFree<A1, A2, A3, A4, A5, A6>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>, f3: (a: A3) => Free<A4>, f4: (a: A4) => Free<A5>, f5: (a: A5) => Free<A6>): Free<A6>;
export declare function pipeFree<A1, A2, A3, A4, A5, A6, A7>(free: Free<A1>, f1: (a: A1) => Free<A2>, f2: (a: A2) => Free<A3>, f3: (a: A3) => Free<A4>, f4: (a: A4) => Free<A5>, f5: (a: A5) => Free<A6>, f6: (a: A6) => Free<A7>): Free<A7>;
export declare function runFree<T>(free: Free<T>): T;
//# sourceMappingURL=free.d.ts.map