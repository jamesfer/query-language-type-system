import { makeExpressionIterator } from '../../desugar/iterators-specific';
import { NamedNode } from '../attach-shapes';
import { freeVariable } from '../constructors';
import { NodeWithChild } from '../types/node';
import { Value } from '../types/value';
import { mapNode } from '../visitor-utils';
import { applyCompressedInferredTypes } from './apply-compresed-inferred-types';
import { CompressedInferredTypes } from './merge-compressed-inferred-types';

export interface ShapedNodeDecoration {
  /**
   * The type of the node that should be shown to users.
   */
  type: Value;
  /**
   * The expected type of the node after implicits were removed.
   */
  shape: Value;
}

export type ShapedNode<T = void> = NodeWithChild<ShapedNodeDecoration, T extends void ? ShapedNode : T>;

const applyInferredTypesAttachedTypeNode = (inferredTypes: CompressedInferredTypes) => (
  node: NamedNode<ShapedNode>,
): ShapedNode => {
  return {
    ...node,
    decoration: {
      shape: applyCompressedInferredTypes(inferredTypes, freeVariable(node.decoration.shapeName)),
      type: applyCompressedInferredTypes(inferredTypes, node.decoration.type),
    },
  };
}

export function recursivelyApplyInferredTypes(
  inferredTypes: CompressedInferredTypes,
): (node: NamedNode) => ShapedNode {
  const applyTypes = applyInferredTypesAttachedTypeNode(inferredTypes);
  const internal = (node: NamedNode): ShapedNode => applyTypes(mapNode(iterator, node));
  const iterator = makeExpressionIterator(internal);
  return internal;
}
