import { DesugaredExpressionWithoutPatternMatch } from '../../desugar/desugar-pattern-match';
import { Value } from './value';

export interface EScopeBinding {
  kind: 'ScopeBinding';
  name: string;
  value: DesugaredExpressionWithoutPatternMatch;
}

export interface EScopeShapeBinding {
  kind: 'ScopeShapeBinding';
  name: string;
  type: Value;
}

export interface EvaluationScope {
  bindings: (EScopeBinding | EScopeShapeBinding)[];
}
