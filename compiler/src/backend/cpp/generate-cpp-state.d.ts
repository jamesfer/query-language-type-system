import { MapStateRecorder } from '../../type-checker/state-recorder/map-state-recorder';
import { StateRecorder } from '../../type-checker/state-recorder/state-recorder';
import { CppStatement } from './cpp-ast';
export declare class GenerateCppState {
    anonymousStructCache: MapStateRecorder<string, string>;
    globalStatements: StateRecorder<CppStatement>;
    localStatements: StateRecorder<CppStatement>;
}
//# sourceMappingURL=generate-cpp-state.d.ts.map