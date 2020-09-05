import { CoreExpression, CoreNode, desugar, stripCoreNode } from './desugar/desugar';
import { removeUnusedBindings } from './optimisations/remove-unused-bindings/remove-unused-bindings';
import parse from './parser/parse';
import { attachPrelude } from './prelude/attach-prelude';
import { evaluationScope } from './type-checker/constructors';
import { evaluateExpression } from './type-checker/evaluate';
import { runTypePhase } from './type-checker/run-type-phase';
import { TypedNode } from './type-checker/type-check';
import { Message } from './type-checker/types/message';
import { Value } from './type-checker/types/value';

export { TypedNode } from './type-checker/type-check';

export interface CompileResult {
  expression?: CoreExpression;
  node?: CoreNode;
  messages: Message[];
}

export interface CompileOptions {
  prelude?: boolean;
  removeUnused?: boolean;
}

export function compile(code: string, options?: CompileOptions): CompileResult {
  const prelude = options?.prelude ?? true;
  const removeUnused = options?.removeUnused ?? true;

  const { value: expression } = parse(code);
  if (!expression) {
    return { messages: ['Failed to parse code'] };
  }

  const [typeMessages, typedNode] = runTypePhase(
    prelude ? attachPrelude(expression) : expression,
  );
  const desugaredNode = desugar(typedNode);
  const optimizedNode = removeUnused ? removeUnusedBindings(desugaredNode) : desugaredNode;

  return {
    expression: stripCoreNode(optimizedNode),
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
