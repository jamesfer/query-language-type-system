import { CoreExpression, NodeWithExpression } from '../..';
import { ResolvedNodeDecoration } from '../../type-checker/resolve-implicits';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { CppExpression } from './cpp-ast';
import { GenerateCppState } from './generate-cpp-state';
export declare function convertNodeToAst(state: GenerateCppState, makeUniqueId: UniqueIdGenerator, { expression, decoration }: NodeWithExpression<ResolvedNodeDecoration, CoreExpression<CppExpression>>): CppExpression;
//# sourceMappingURL=convert-node-to-ast.d.ts.map