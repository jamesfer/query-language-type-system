import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { DualBinding, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
/**
 * Attempts to converge the left and right sides of the dual binding to the same value.
 */
export declare function convergeDualBindingOnLeft(messagesState: StateRecorder<Message>, state: ConvergeState, left: DualBinding, right: Value): InferredType[];
//# sourceMappingURL=converge-dual-binding-on-left.d.ts.map