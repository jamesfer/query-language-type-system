import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { NumberLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function convergeNumbers(messageState: StateRecorder<Message>, state: ConvergeState, number: NumberLiteral, other: Value): InferredType[];
//# sourceMappingURL=converge-numbers.d.ts.map