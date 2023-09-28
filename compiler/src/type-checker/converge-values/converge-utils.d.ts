import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function mismatchMessage(state: ConvergeState, leftValue: Value, rightValue: Value): Message;
export declare function mismatchResult(messageState: StateRecorder<Message>, state: ConvergeState, leftValue: Value, rightValue: Value): InferredType[];
export declare function inferredType(state: ConvergeState, from: string, to: Value): InferredType;
//# sourceMappingURL=converge-utils.d.ts.map