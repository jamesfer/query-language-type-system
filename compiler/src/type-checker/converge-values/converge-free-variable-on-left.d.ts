import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { FreeVariable, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
/**
 * Converges a free variable with a concrete type to produce an `InferredType` annotation
 */
export declare function convergeFreeVariableOnLeft(messageState: StateRecorder<Message>, state: ConvergeState, left: FreeVariable, right: Value): InferredType[];
//# sourceMappingURL=converge-free-variable-on-left.d.ts.map