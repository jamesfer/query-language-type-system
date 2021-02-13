import { CoreExpression, CoreNode, desugar, stripCoreNode } from './desugar/desugar';
import { removeUnusedBindings } from './optimisations/remove-unused-bindings/remove-unused-bindings';
import parse from './parser/parse';
import { attachPrelude } from './prelude/attach-prelude';
import { checkTypes } from './type-checker';
import { Message } from './type-checker/types/message';
import { uniqueIdStream } from './utils/unique-id-generator';

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

  const makeUniqueId = uniqueIdStream();
  const expressionWithPrelude = prelude ? attachPrelude(expression) : expression;
  const [typeMessages, typedNode] = checkTypes(makeUniqueId, expressionWithPrelude);
  const desugaredNode = desugar(makeUniqueId, typedNode);
  const optimizedNode = removeUnused ? removeUnusedBindings(desugaredNode) : desugaredNode;

  return {
    expression: stripCoreNode(optimizedNode),
    node: optimizedNode,
    messages: typeMessages,
  };
}
