import { VariableReplacement } from './variable-utils';
import { Node } from './types/node';
import { Value } from './types/value';

export function applyVariableReplacements<D extends { type: Value }>(replacements: VariableReplacement[], node: Node<D>): Node<D> {

}
