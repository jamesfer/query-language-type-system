import { DesugaredExpressionWithoutPatternMatch } from '../desugar/desugar-pattern-match';
import { TypedNode } from './type-check';
import { EScopeBinding, EScopeShapeBinding, EvaluationScope } from './types/evaluation-scope';
import { BindingExpression, BooleanExpression, DataInstantiation, DualExpression, Expression, Identifier, NumberExpression, ReadDataPropertyExpression, ReadRecordPropertyExpression, RecordExpression, SymbolExpression } from './types/expression';
import { Node } from './types/node';
import { Scope, ScopeBinding } from './types/scope';
import { BooleanLiteral, DataValue, DualBinding, FreeVariable, NumberLiteral, RecordLiteral, StringLiteral, SymbolLiteral, Value } from './types/value';
/**
 * Scope stuff
 */
export declare function scope(scope?: Partial<Scope>): Scope;
export declare function evaluationScope(scope?: Partial<EvaluationScope>): EvaluationScope;
export declare function expandScope(parent: Scope, child?: Partial<Scope>): Scope;
export declare function expandEvaluationScope(parent: EvaluationScope, child?: Partial<EvaluationScope>): EvaluationScope;
export declare function scopeBinding(name: string, scope: Scope, type: Value, node?: TypedNode): ScopeBinding;
export declare function eScopeBinding(name: string, value: DesugaredExpressionWithoutPatternMatch): EScopeBinding;
export declare function eScopeShapeBinding(name: string, type: Value): EScopeShapeBinding;
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
/**
 * Expressions
 */
declare type MaybeExpression<T extends object = Expression> = string | number | boolean | T;
export declare function symbolExpression(name: string): SymbolExpression;
export declare const bind: (name: string, value: MaybeExpression) => (body: Expression) => BindingExpression;
export declare const implement: (name: string, parameters?: MaybeExpression[]) => (body: Expression) => BindingExpression;
export declare function lambda<T extends object = Expression>(parameters: (MaybeExpression | [MaybeExpression, boolean])[], body: MaybeExpression<T>): Expression;
export declare function identifier(name: string): Identifier;
export declare function apply(callee: MaybeExpression, parameters?: MaybeExpression[]): Expression;
export declare function numberExpression(value: number): NumberExpression;
export declare function booleanExpression(value: boolean): BooleanExpression;
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