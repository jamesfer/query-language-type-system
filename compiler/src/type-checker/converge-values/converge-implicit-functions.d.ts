import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { ImplicitFunctionLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function convergeImplicitFunctions(messageState: StateRecorder<Message>, state: ConvergeState, implicitFunction: ImplicitFunctionLiteral, other: Value): InferredType[];
//# sourceMappingURL=converge-implicit-functions.d.ts.map