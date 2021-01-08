import { VariableReplacement } from '../../variable-utils';
import { Message } from '../../types/message';
import { AttachedTypeNode } from '../attached-type-node';
import { TypeResult } from '../../monad-utils';

export interface DeconstructedTypeState {
  replacements: VariableReplacement[];
  messages: Message[];
  node: AttachedTypeNode;
}

export function deconstructTypeState(result: TypeResult<AttachedTypeNode>): DeconstructedTypeState {
  const { state: [messages, replacements], value: node } = result;
  return { replacements, messages, node };
}
