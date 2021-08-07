import { UniqueIdGenerator } from '../utils/unique-id-generator';
import { attachShapes } from './attach-shapes';
import { buildScopedNode } from './build-scoped-node';
import { recursivelyApplyInferredTypes } from './compress-inferred-types/recursively-apply-inferred-types';
import { renameFreeVariables } from './rename-free-variables';
import { ResolvedNode, resolveImplicits } from './resolve-implicits';
import { Expression } from './types/expression';
import { compressInferredTypes } from './compress-inferred-types/compress-inferred-types';
import { Message } from './types/message';

export function checkTypes(makeUniqueId: UniqueIdGenerator, expression: Expression): [Message[], ResolvedNode] {
  // Rename all free variables to prevent conflicts
  const renamedExpression = renameFreeVariables(makeUniqueId, expression);

  // Attach a partial type and a name to every node
  const [messages, inferredTypes, namedNode] = attachShapes(makeUniqueId, renamedExpression);

  // Compress all inferred types and detect issues where variables were inferred to different types
  const [compressionMessages, compressedInferredTypes] = compressInferredTypes(inferredTypes);

  // Reapplies all the inferred types discovered in the previous step. Type information can propagate to all expressions
  const shapedNode = recursivelyApplyInferredTypes(compressedInferredTypes)(namedNode);

  // Builds and attaches a scope to each node
  const scopedNode = buildScopedNode(shapedNode);

  // Find replacements for all implicit parameters and strip them
  const [resolvedMessages, resolvedNode] = resolveImplicits(scopedNode);

  return [
    [
      ...messages,
      ...compressionMessages,
      ...resolvedMessages,
    ],
    resolvedNode,
  ];
}
