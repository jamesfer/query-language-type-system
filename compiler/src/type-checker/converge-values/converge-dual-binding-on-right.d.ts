import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { DualBinding, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
/**
 * Attempts to converge the left and right sides of the dual binding to the same value.
 */
export declare function convergeDualBindingOnRight(messageState: StateRecorder<Message>, state: ConvergeState, left: Value, right: DualBinding): InferredType[];
//# sourceMappingURL=converge-dual-binding-on-right.d.ts.map