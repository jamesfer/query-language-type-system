import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare const convergeValuesWithState: (messageState: StateRecorder<Message>, state: ConvergeState, leftValue: Value, rightValue: Value) => InferredType[];
//# sourceMappingURL=converge-values-with-state.d.ts.map