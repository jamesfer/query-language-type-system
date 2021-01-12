import { Message } from '../../types/message';
import { VariableReplacement } from '../../variable-utils';
import { Value } from '../../types/value';
import { map } from 'lodash';

export interface CompressedReplacements {
  [k: string]: Value;
}

// TODO write implementation
export function compressReplacements(replacements: VariableReplacement[]): [Message[], CompressedReplacements]  {
  const messages: Message[] = [];
  const combinedReplacements = replacements.reduce(
    (correctReplacements, replacement): CompressedReplacements => {
      // Check if the variable already exists in the replacements
      // If it does, try to merge them using converge.
      // If that fails, write a message.
      // If that succeeds, additional replacements should be prepended to the remaining list

      // After, also apply the replacement to all other replacements somehow?

      // Detect when there is an infinite loop of replacements
      // a -> b and b -> a
      // or a -> Maybe[b] -> b -> Maybe[a]

      return {};
    },
    {},
  );
  return [messages, combinedReplacements];
}
