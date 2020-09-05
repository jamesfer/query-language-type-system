import { DesugaredExpressionWithoutPatternMatch } from '../desugar/desugar-pattern-match';
import { EvaluationScope } from './types/evaluation-scope';
import { Value } from './types/value';
export declare const evaluateExpression: (scope: EvaluationScope) => (expression: DesugaredExpressionWithoutPatternMatch) => Value | undefined;
export declare const simplify: (value: Value<void>) => Value<void>;
//# sourceMappingURL=evaluate.d.ts.map