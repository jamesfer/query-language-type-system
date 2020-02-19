import parse from './parser/parse';
import { evaluationScope } from './type-checker/constructors';
import { evaluateExpression } from './type-checker/evaluate';
import { runTypePhase } from './type-checker/run-type-phase';
import { stripNode } from './type-checker/strip-nodes';
import { TypedNode } from './type-checker/type-check';
import { Value } from './type-checker/types/value';

export function compile(code: string): TypedNode | undefined {
  const { messages, value: expression } = parse(code);
  if (expression) {
    const [typeMessages, typedNode] = runTypePhase(expression);

    if (typeMessages.length === 0) {
      return typedNode;
    }
  }
  return undefined;
}

export function evaluate(code: string): Value | undefined {
  const typedNode = compile(code);
  if (typedNode) {
    return evaluateExpression(evaluationScope())(stripNode(typedNode));
  }
  return undefined;
}
