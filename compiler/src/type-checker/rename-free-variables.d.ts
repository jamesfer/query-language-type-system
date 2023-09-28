import { UniqueIdGenerator } from '../utils/unique-id-generator';
import { Expression } from './types/expression';
export declare type RenameScopes = {
    [k: string]: string;
}[];
export declare function renameFreeVariables(makeUniqueId: UniqueIdGenerator, expression: Expression): Expression;
//# sourceMappingURL=rename-free-variables.d.ts.map