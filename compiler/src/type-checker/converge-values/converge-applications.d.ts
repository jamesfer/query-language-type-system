import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { ApplicationValue, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function convergeApplications(messageState: StateRecorder<Message>, state: ConvergeState, application: ApplicationValue, other: Value): InferredType[];
//# sourceMappingURL=converge-applications.d.ts.map