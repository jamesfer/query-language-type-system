export interface CppIdentifier {
    kind: 'Identifier';
    name: string;
}
export interface CppBoolean {
    kind: 'Boolean';
    value: boolean;
}
export interface CppNumber {
    kind: 'Number';
    value: number;
}
export interface CppString {
    kind: 'String';
    value: string;
}
export interface CppApplication<T = CppExpression> {
    kind: 'Application';
    callee: T;
    parameters: T[];
}
export interface CppStructConstruction<T = CppExpression> {
    kind: 'StructConstruction';
    structName: string;
    parameters: T[];
}
export interface CppParameter {
    kind: 'Parameter';
    identifier: CppIdentifier;
    type: CppType;
}
export interface CppLambda<T = CppStatement> {
    kind: 'Lambda';
    parameters: CppParameter[];
    body: CppBlock<T>;
}
export interface CppReadProperty<T = CppExpression> {
    kind: 'ReadProperty';
    object: T;
    property: string;
}
export declare type CppExpression = CppIdentifier | CppBoolean | CppNumber | CppString | CppApplication | CppStructConstruction | CppLambda | CppReadProperty;
export declare type CppExpressionWithChild<T> = CppIdentifier | CppBoolean | CppNumber | CppString | CppApplication<T> | CppStructConstruction<T> | CppLambda<T> | CppReadProperty<T>;
export interface CppBlock<T = CppStatement> {
    kind: 'Block';
    statements: T[];
}
export interface CppExpressionStatement<T = CppExpression> {
    kind: 'ExpressionStatement';
    expression: T;
}
export interface CppBinding<T = CppExpression> {
    kind: 'Binding';
    name: string;
    type: CppType;
    value: T;
}
export interface CppReturn<T = CppExpression> {
    kind: 'Return';
    value: T;
}
export interface CppStruct {
    kind: 'Struct';
    name: string;
    properties: CppParameter[];
}
export interface CppFunction<T = CppStatement> {
    kind: 'Function';
    name: string;
    parameters: CppParameter[];
    returnType: CppType;
    body: CppBlock<T>;
}
export declare type CppStatement = CppExpressionStatement | CppBinding | CppReturn | CppStruct | CppFunction;
export declare type CppStatementWithChild<T> = CppExpressionStatement<T> | CppBinding<T> | CppReturn<T> | CppStruct | CppFunction<T>;
export interface CppType {
    kind: 'Type';
    value: string;
}
//# sourceMappingURL=cpp-ast.d.ts.map