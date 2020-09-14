import { CppExpression, CppExpressionWithChild, CppStatement, CppStatementWithChild } from './cpp-ast';
export declare function visitAndTransformCppExpression<T>(expressionVisitor: (expression: CppExpressionWithChild<T>) => T, statementVisitor: (statement: CppStatementWithChild<T>) => T): (expression: CppExpression) => T;
export declare function visitAndTransformCppStatement<T>(statementVisitor: (statement: CppStatementWithChild<T>) => T, expressionVisitor: (expression: CppExpressionWithChild<T>) => T): (statement: CppStatement) => T;
//# sourceMappingURL=cpp-ast-visitors.d.ts.map