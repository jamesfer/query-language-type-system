import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { DataValue, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function convergeDataValues(messageState: StateRecorder<Message>, state: ConvergeState, dataValue: DataValue, other: Value): InferredType[];
//# sourceMappingURL=converge-data-values.d.ts.map