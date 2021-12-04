import { UniqueIdGenerator } from '../utils/unique-id-generator';
import { attachShapes } from './attach-shapes';
import { buildScopedNode } from './build-scoped-node';
import { collapseInferredTypes } from './compress-inferred-types/collapse-inferred-types';
import { recursivelyApplyInferredTypes } from './compress-inferred-types/recursively-apply-inferred-types';
import { reduceInferredTypes } from './compress-inferred-types/reduce-inferred-types';
import { renameFreeVariables } from './rename-free-variables';
import { ResolvedNode, resolveImplicits } from './resolve-implicits';
import { StateRecorder } from './state-recorder/state-recorder';
import { Expression } from './types/expression';
import { Message } from './types/message';

export function checkTypes(makeUniqueId: UniqueIdGenerator, expression: Expression): [Message[], ResolvedNode] {
  const messageState = new StateRecorder<Message>();

  // Rename all free variables to prevent conflicts
  const renamedExpression = renameFreeVariables(makeUniqueId, expression);

  // Attach a partial type and a name to every node
  const [inferredTypes, namedNode] = attachShapes(makeUniqueId, renamedExpression);

  require('fs').writeFileSync(__dirname + '/../../../../inferredTypes.json', JSON.stringify(inferredTypes, undefined, 2));

  // Compress all inferred types and detect issues where variables were inferred to different types
  // const collapsedInferredTypes = collapseInferredTypes(messageState, inferredTypes);
  const collapsedInferredTypes = reduceInferredTypes(messageState, inferredTypes);

  // Reapplies all the inferred types discovered in the previous step. Type information can propagate to all expressions
  const shapedNode = recursivelyApplyInferredTypes(collapsedInferredTypes)(namedNode);

  // Builds and attaches a scope to each node
  const scopedNode = buildScopedNode(shapedNode);

  // Find replacements for all implicit parameters and strip them
  const [resolvedMessages, resolvedNode] = resolveImplicits(scopedNode);
  messageState.pushAll(resolvedMessages);

  return [messageState.values, resolvedNode];
}
