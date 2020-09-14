import { UniqueIdGenerator, uniqueIdStream } from '../utils/unique-id-generator';
import { scope } from './constructors';
import { TypeResult, TypeWriter } from './monad-utils';
import { renameFreeVariables } from './rename-free-variables';
import { resolveImplicitParameters } from './resolve-implicits';
import { TypedNode, typeExpression } from './type-check';
import { Expression } from './types/expression';
import { Message } from './types/message';
import { Scope } from './types/scope';

export function runTypePhase(expression: Expression, ): [Message[], TypedNode] {
  const makeUniqueId = uniqueIdStream();
  const typedNodeTypeResult = runTypePhaseWithoutRename(makeUniqueId)(scope())(renameFreeVariables(expression));
  const { state: [messages], value: node } = typedNodeTypeResult;
  return [messages, node];
}

export const runTypePhaseWithoutRename = (makeUniqueId: UniqueIdGenerator) => (scope: Scope) => (expression: Expression): TypeResult<TypedNode> => {
  const state = new TypeWriter(scope);
  const node = state.run(typeExpression(makeUniqueId))(expression);
  const [resolvingMessages, resolvedNode] = resolveImplicitParameters(node);
  state.logAll(resolvingMessages);
  return state.wrap(resolvedNode);
};
