import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { RecordLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function convergeRecords(messageState: StateRecorder<Message>, state: ConvergeState, record: RecordLiteral, other: Value): InferredType[];
//# sourceMappingURL=converge-records.d.ts.map