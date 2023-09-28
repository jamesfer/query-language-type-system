import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { BooleanLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function convergeBooleans(messageState: StateRecorder<Message>, state: ConvergeState, boolean: BooleanLiteral, other: Value): InferredType[];
//# sourceMappingURL=converge-booleans.d.ts.map