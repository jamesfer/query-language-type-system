import { Value } from '../../type-checker/types/value';
import { CppType } from './cpp-ast';
import { Monad } from './monad';
import { CppState } from './monad-state-operations';
export declare function convertValueToType(value: Value): Monad<CppState, CppType>;
//# sourceMappingURL=convert-value-to-type.d.ts.map