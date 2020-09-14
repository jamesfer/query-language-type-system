import { UniqueIdGenerator } from '../utils/unique-id-generator';
import { TypeResult } from './monad-utils';
import { TypedNode } from './type-check';
import { Expression } from './types/expression';
import { Message } from './types/message';
import { Scope } from './types/scope';
export declare function runTypePhase(expression: Expression): [Message[], TypedNode];
export declare const runTypePhaseWithoutRename: (makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (expression: Expression) => TypeResult<TypedNode>;
//# sourceMappingURL=run-type-phase.d.ts.map