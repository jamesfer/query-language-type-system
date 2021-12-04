import { makeExpressionIterator } from '../../desugar/iterators-specific';
import { NamedNode } from '../attach-shapes';
import { freeVariable } from '../constructors';
import { CollapsedInferredTypeMap } from '../types/inferred-type';
import { NodeWithChild } from '../types/node';
import { Value } from '../types/value';
import { mapNode, visitAndTransformValue } from '../visitor-utils';

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

function applyCompressedInferredTypes(inferredTypes: CollapsedInferredTypeMap, value: Value): Value {
  return visitAndTransformValue((value: Value) => (
    value.kind === 'FreeVariable' && value.name in inferredTypes
      ? applyCompressedInferredTypes(inferredTypes, inferredTypes[value.name].to)
      : value
  ))(value);
}

const applyInferredTypesAttachedTypeNode = (inferredTypes: CollapsedInferredTypeMap) => (
  node: NamedNode<ShapedNode>,
): ShapedNode => {
  console.log('Applying to', node.decoration.shapeName);
  const shape = applyCompressedInferredTypes(
    inferredTypes,
    freeVariable(node.decoration.shapeName)
  );
  console.log('Applying to', node.decoration.type);
  const type = applyCompressedInferredTypes(inferredTypes, node.decoration.type);
  return {
    ...node,
    decoration: {
      shape: shape,
      type: type,
    },
  };
}

export function recursivelyApplyInferredTypes(
  inferredTypes: CollapsedInferredTypeMap,
): (node: NamedNode) => ShapedNode {
  const applyTypes = applyInferredTypesAttachedTypeNode(inferredTypes);
  const internal = (node: NamedNode): ShapedNode => applyTypes(mapNode(iterator, node));
  const iterator = makeExpressionIterator(internal);
  return internal;
}
