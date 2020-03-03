import { Expression } from './expression';
import { Value } from './value';
export interface EScopeBinding {
    kind: 'ScopeBinding';
    name: string;
    value: Expression;
}
export interface EScopeShapeBinding {
    kind: 'ScopeShapeBinding';
    name: string;
    type: Value;
}
export interface EvaluationScope {
    bindings: (EScopeBinding | EScopeShapeBinding)[];
}
//# sourceMappingURL=evaluation-scope.d.ts.map