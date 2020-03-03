export interface FreeVariable {
    kind: 'FreeVariable';
    name: string;
}
export interface DataValue<T = Value> {
    kind: 'DataValue';
    name: T;
    parameters: T[];
}
export interface DualBinding<T = Value> {
    kind: 'DualBinding';
    left: T;
    right: T;
}
export interface ApplicationValue<T = Value> {
    kind: 'ApplicationValue';
    callee: T;
    parameter: T;
}
export interface ReadRecordPropertyValue<T = Value> {
    kind: 'ReadRecordProperty';
    property: string;
    record: T;
}
export interface ReadDataValueProperty<T = Value> {
    kind: 'ReadDataValueProperty';
    property: number;
    dataValue: T;
}
export interface PatternMatchValue<T = Value> {
    kind: 'PatternMatchValue';
    value: T;
    patterns: {
        test: T;
        value: T;
    }[];
}
/**
 * Literals
 */
export interface SymbolLiteral {
    kind: 'SymbolLiteral';
    name: string;
}
export interface FunctionLiteral<T = Value> {
    kind: 'FunctionLiteral';
    parameter: T;
    body: T;
}
export interface ImplicitFunctionLiteral<T = Value> {
    kind: 'ImplicitFunctionLiteral';
    parameter: T;
    body: T;
}
export interface RecordLiteral<T = Value> {
    kind: 'RecordLiteral';
    properties: {
        [k: string]: T;
    };
}
export interface BooleanLiteral {
    kind: 'BooleanLiteral';
    value: boolean;
}
export interface NumberLiteral {
    kind: 'NumberLiteral';
    value: number;
}
export interface StringLiteral {
    kind: 'StringLiteral';
    value: string;
}
export declare type Value<T = void> = DataValue<T extends void ? Value : T> | RecordLiteral<T extends void ? Value : T> | DualBinding<T extends void ? Value : T> | ApplicationValue<T extends void ? Value : T> | ReadDataValueProperty<T extends void ? Value : T> | ReadRecordPropertyValue<T extends void ? Value : T> | FunctionLiteral<T extends void ? Value : T> | ImplicitFunctionLiteral<T extends void ? Value : T> | PatternMatchValue<T extends void ? Value : T> | FreeVariable | SymbolLiteral | BooleanLiteral | NumberLiteral | StringLiteral;
export declare type ExplicitValue<T = void> = DataValue<T extends void ? ExplicitValue : T> | RecordLiteral<T extends void ? ExplicitValue : T> | DualBinding<T extends void ? ExplicitValue : T> | ApplicationValue<T extends void ? ExplicitValue : T> | ReadDataValueProperty<T extends void ? ExplicitValue : T> | ReadRecordPropertyValue<T extends void ? ExplicitValue : T> | FunctionLiteral<T extends void ? ExplicitValue : T> | PatternMatchValue<T extends void ? ExplicitValue : T> | FreeVariable | SymbolLiteral | BooleanLiteral | NumberLiteral | StringLiteral;
//# sourceMappingURL=value.d.ts.map