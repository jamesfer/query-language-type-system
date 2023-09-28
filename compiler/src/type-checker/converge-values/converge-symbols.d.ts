import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { SymbolLiteral, Value } from '../types/value';
import { ConvergeState, InferredType } from './converge-types';
export declare function convergeSymbols(messageState: StateRecorder<Message>, state: ConvergeState, symbol: SymbolLiteral, other: Value): InferredType[];
//# sourceMappingURL=converge-symbols.d.ts.map