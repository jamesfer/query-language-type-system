import { CoreExpression, NodeWithExpression } from '../..';
import { TypedDecoration } from '../../type-checker/type-check';
import { CppExpression } from './cpp-ast';
import { Monad } from './monad';
import { CppState } from './monad-state-operations';
export declare function convertNodeToAst({ expression, decoration }: NodeWithExpression<TypedDecoration, CoreExpression<Monad<CppState, CppExpression>>>): Monad<CppState, CppExpression>;
//# sourceMappingURL=convert-node-to-ast.d.ts.map