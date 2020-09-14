import { CoreNode } from '../..';
import { CppExpression } from './cpp-ast';
import { Monad } from './monad';
import { CppState } from './monad-state-operations';
export declare function nodeToAstIterator(node: CoreNode): Monad<CppState, CppExpression>;
export declare function generateCpp(node: CoreNode): string;
//# sourceMappingURL=generate-cpp.d.ts.map