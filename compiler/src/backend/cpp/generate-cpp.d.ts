import { CoreNode } from '../..';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { CppExpression } from './cpp-ast';
import { GenerateCppState } from './generate-cpp-state';
export declare function nodeToAstIterator(state: GenerateCppState, makeUniqueId: UniqueIdGenerator, node: CoreNode): CppExpression;
export declare function generateCpp(makeUniqueId: UniqueIdGenerator, node: CoreNode): string;
//# sourceMappingURL=generate-cpp.d.ts.map