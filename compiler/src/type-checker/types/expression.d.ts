export interface Identifier {
    kind: 'Identifier';
    name: string;
}
export interface NumberExpression {
    kind: 'NumberExpression';
    value: number;
}
export interface StringExpression {
    kind: 'StringExpression';
    value: string;
}
export interface BooleanExpression {
    kind: 'BooleanExpression';
    value: boolean;
}
export interface SymbolExpression {
    kind: 'SymbolExpression';
    name: string;
}
export interface RecordExpression<T = Expression> {
    kind: 'RecordExpression';
    properties: {
        [k: string]: T;
    };
}
export interface Application<T = Expression> {
    kind: 'Application';
    callee: T;
    parameter: T;
}
export interface FunctionExpression<T = Expression> {
    kind: 'FunctionExpression';
    parameter: T;
    implicit: boolean;
    body: T;
}
export interface DataInstantiation<T = Expression> {
    kind: 'DataInstantiation';
    callee: T;
    parameters: T[];
    parameterShapes: [Expression, boolean][];
}
export interface BindingExpression<T = Expression> {
    kind: 'BindingExpression';
    name: string;
    value: T;
    body: T;
}
export interface DualExpression<T = Expression> {
    kind: 'DualExpression';
    left: T;
    right: T;
}
export interface ReadRecordPropertyExpression<T = Expression> {
    kind: 'ReadRecordPropertyExpression';
    record: T;
    property: string;
}
export interface ReadDataPropertyExpression<T = Expression> {
    kind: 'ReadDataPropertyExpression';
    dataValue: T;
    property: number;
}
export interface PatternMatchExpression<T = Expression> {
    kind: 'PatternMatchExpression';
    value: T;
    patterns: {
        test: T;
        value: T;
    }[];
}
export interface NativeExpression {
    kind: 'NativeExpression';
    data: {
        [k: string]: any;
    };
}
export declare type Expression<T = void> = Identifier | BooleanExpression | NumberExpression | StringExpression | SymbolExpression | RecordExpression<T extends void ? Expression : T> | Application<T extends void ? Expression : T> | FunctionExpression<T extends void ? Expression : T> | DataInstantiation<T extends void ? Expression : T> | BindingExpression<T extends void ? Expression : T> | DualExpression<T extends void ? Expression : T> | ReadRecordPropertyExpression<T extends void ? Expression : T> | ReadDataPropertyExpression<T extends void ? Expression : T> | PatternMatchExpression<T extends void ? Expression : T> | NativeExpression;
export declare const ExpressionURI = "Expression";
declare module 'fp-ts/lib/HKT' {
    interface URItoKind<A> {
        readonly ['Identifier']: Identifier;
        readonly ['BooleanExpression']: BooleanExpression;
        readonly ['NumberExpression']: NumberExpression;
        readonly ['StringExpression']: StringExpression;
        readonly ['SymbolExpression']: SymbolExpression;
        readonly ['NativeExpression']: NativeExpression;
        readonly ['RecordExpression']: RecordExpression<A>;
        readonly ['Application']: Application<A>;
        readonly ['FunctionExpression']: FunctionExpression<A>;
        readonly ['DataInstantiation']: DataInstantiation<A>;
        readonly ['BindingExpression']: BindingExpression<A>;
        readonly ['DualExpression']: DualExpression<A>;
        readonly ['ReadRecordPropertyExpression']: ReadRecordPropertyExpression<A>;
        readonly ['ReadDataPropertyExpression']: ReadDataPropertyExpression<A>;
        readonly ['PatternMatchExpression']: PatternMatchExpression<A>;
        readonly [ExpressionURI]: Expression<A>;
    }
}
//# sourceMappingURL=expression.d.ts.map