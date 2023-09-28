import { Application, BindingExpression, BooleanExpression, DataInstantiation, DualExpression, Expression, FunctionExpression, Identifier, NumberExpression, ReadDataPropertyExpression, ReadRecordPropertyExpression, RecordExpression, StringExpression, SymbolExpression } from './types/expression';
import { Node } from './types/node';
import { ApplicationValue, BooleanLiteral, DataValue, DualBinding, FreeVariable, NumberLiteral, RecordLiteral, StringLiteral, SymbolLiteral, Value } from './types/value';
/**
 * Values
 */
export declare function symbol(name: string): SymbolLiteral;
export declare function dataValue(name: string | Value, parameters?: Value[]): DataValue;
export declare function functionType(returnType: Value, parameters: (Value | [Value, boolean])[]): Value;
export declare function recordLiteral(properties: {
    [k: string]: Value;
}): RecordLiteral;
export declare function freeVariable(name: string): FreeVariable;
export declare function booleanLiteral(value: boolean): BooleanLiteral;
export declare function numberLiteral(value: number): NumberLiteral;
export declare function stringLiteral(value: string): StringLiteral;
export declare function dualBinding(left: Value, right: Value): DualBinding;
export declare function application(callee: Value, parameter: Value): ApplicationValue;
/**
 * Expressions
 */
declare type MaybeExpression<T extends object = Expression> = string | number | boolean | T;
export declare function symbolExpression(name: string): SymbolExpression;
export declare const bind: (name: string, value: MaybeExpression) => (body: Expression) => BindingExpression;
export declare function lambda(parameters: (MaybeExpression | [MaybeExpression, boolean])[], body: MaybeExpression): FunctionExpression;
export declare function identifier(name: string): Identifier;
export declare function apply(callee: MaybeExpression, parameters: MaybeExpression[]): Expression;
export declare function apply(callee: MaybeExpression, parameters: Expression): Application;
export declare function numberExpression(value: number): NumberExpression;
export declare function booleanExpression(value: boolean): BooleanExpression;
export declare function stringExpression(value: string): StringExpression;
export declare function record(properties: {
    [k: string]: Expression;
}): RecordExpression;
export declare function dataInstantiation(name: MaybeExpression, parameters: MaybeExpression[], parameterShapes: (MaybeExpression | [MaybeExpression, boolean])[]): DataInstantiation;
export declare function dual(left: MaybeExpression, right: MaybeExpression): DualExpression;
export declare const data: (name: string, parameterNames?: string[], parameters?: (MaybeExpression | [MaybeExpression, boolean])[]) => (body: Expression) => BindingExpression;
export declare function readRecordProperty(record: MaybeExpression, property: string): ReadRecordPropertyExpression;
export declare function readDataProperty(dataValue: MaybeExpression, property: number): ReadDataPropertyExpression;
/**
 * Other
 */
export declare function node<T>(expression: Expression<Node<T>>, decoration: T): Node<T>;
export {};
//# sourceMappingURL=constructors.d.ts.map