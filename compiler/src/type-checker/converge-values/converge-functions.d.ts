import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { FunctionLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function convergeFunctions(messageState: StateRecorder<Message>, state: ConvergeState, functionValue: FunctionLiteral, other: Value): InferredType[];
//# sourceMappingURL=converge-functions.d.ts.map