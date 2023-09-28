import { MapStateRecorder } from '../../type-checker/state-recorder/map-state-recorder';
import { StateRecorder } from '../../type-checker/state-recorder/state-recorder';
import { CppStatement } from './cpp-ast';

export class GenerateCppState {
  anonymousStructCache = new MapStateRecorder<string, string>();
  globalStatements = new StateRecorder<CppStatement>();
  localStatements = new StateRecorder<CppStatement>();
}
