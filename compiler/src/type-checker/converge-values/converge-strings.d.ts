import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { StringLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function convergeStrings(messageState: StateRecorder<Message>, state: ConvergeState, string: StringLiteral, other: Value): InferredType[];
//# sourceMappingURL=converge-strings.d.ts.map