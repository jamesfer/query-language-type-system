import { shallowExpressionIterator } from '../../utils/iterators-specific';
import { NamedNode } from '../attach-shapes';
import { freeVariable } from '../constructors';
import { NodeWithChild } from '../types/node';
import { Value } from '../types/value';
import { mapNode, visitAndTransformValue } from '../utils/visitor-utils';
import { CountMap } from '../../utils/count-map';
import { SimplifiedInferredTypeMap } from '../simplify-collapsed-types/simplify-collapsed-types';

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

export type ShapedNode<T = void> =
  NodeWithChild<ShapedNodeDecoration, T extends void ? ShapedNode : T>;

function applyCompressedInferredTypesRecursively(
  inferredTypes: SimplifiedInferredTypeMap,
  value: Value,
  visitedVariables: CountMap<string>,
): Value {
  return visitAndTransformValue((value: Value) => {
    if (value.kind !== 'FreeVariable' || !(value.name in inferredTypes)) {
      return value;
    }

    // If the type is recursive, skip it
    if (visitedVariables.has(value.name)) {
      return value;
    }

    visitedVariables.increment(value.name);
    const result = applyCompressedInferredTypesRecursively(
      inferredTypes,
      inferredTypes[value.name].to,
      visitedVariables,
    );
    visitedVariables.decrement(value.name);
    return result;
  })(value);
}

function applyCompressedInferredTypes(
  inferredTypes: SimplifiedInferredTypeMap,
  value: Value,
): Value {
  return applyCompressedInferredTypesRecursively(inferredTypes, value, new CountMap());
}

const applyInferredTypesAttachedTypeNode = (inferredTypes: SimplifiedInferredTypeMap) => (
  node: NamedNode<ShapedNode>,
): ShapedNode => {
  const shape = applyCompressedInferredTypes(
    inferredTypes,
    freeVariable(node.decoration.shapeName),
  );
  const type = applyCompressedInferredTypes(inferredTypes, node.decoration.type);
  return {
    ...node,
    decoration: { shape, type },
  };
};

export function recursivelyApplyInferredTypes(
  inferredTypes: SimplifiedInferredTypeMap,
): (node: NamedNode) => ShapedNode {
  const applyTypes = applyInferredTypesAttachedTypeNode(inferredTypes);
  const internal = (node: NamedNode): ShapedNode => applyTypes(mapNode(iterator, node));
  const iterator = shallowExpressionIterator(internal);
  return internal;
}
