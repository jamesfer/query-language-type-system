import { makeExpressionIterator } from '../../desugar/iterators-specific';
import { ShapedNode } from '../compress-inferred-types/recursively-apply-inferred-types';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Value } from '../types/value';
import { mapNode } from '../utils/visitor-utils';

const extractBinding = (state: StateRecorder<[string, Value]>) => (node: ShapedNode): ShapedNode => {
  if (node.expression.kind === 'Identifier') {
    state.push([node.expression.name, node.decoration.type]);
  }
  return node;
}

export function extractDestructurableBindings(node: ShapedNode): [string, Value][] {
  const state = new StateRecorder<[string, Value]>();

  const extractBindingIntoState = extractBinding(state);
  const internal = (node: ShapedNode): ShapedNode => extractBindingIntoState(mapNode(iterator, node))
  const iterator = makeExpressionIterator(internal);
  internal(node);
  return state.values;
}
