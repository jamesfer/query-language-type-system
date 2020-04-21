import { removeUnusedBindings } from './optimisations/remove-unused-bindings/remove-unused-bindings';
import parse from './parser/parse';
import { evaluationScope } from './type-checker/constructors';
import { evaluateExpression } from './type-checker/evaluate';
import { runTypePhase } from './type-checker/run-type-phase';
import { stripNode } from './type-checker/strip-nodes';
import { TypedNode } from './type-checker/type-check';
import { Expression } from './type-checker/types/expression';
import { Message } from './type-checker/types/message';
import { Value } from './type-checker/types/value';

export { TypedNode } from './type-checker/type-check';

export interface CompileResult {
  expression?: Expression;
  node?: TypedNode;
  messages: Message[];
}

export function compile(code: string): CompileResult {
  const { value: expression } = parse(code);
  if (!expression) {
    return { messages: ['Failed to parse code'] };
  }

  const [typeMessages, typedNode] = runTypePhase(expression);
  const optimizedNode = removeUnusedBindings(typedNode);

  return {
    expression: stripNode(optimizedNode),
    node: optimizedNode,
    messages: typeMessages,
  };
}

export function evaluate(code: string): Value | undefined {
  const { expression } = compile(code);
  if (expression) {
    return evaluateExpression(evaluationScope())(expression);
  }
  return undefined;
}
