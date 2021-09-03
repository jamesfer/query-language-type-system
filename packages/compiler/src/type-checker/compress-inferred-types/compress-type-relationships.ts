import { Message } from '../../index';
import { convergeValues } from '../converge-values';
import { InferredType } from '../converge-values/converge-types';
import { StateRecorder } from '../state-recorder/state-recorder';
import { ValuePair } from '../types/value-pair';
import { assertNever } from '../utils';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';
import { convertInferredTypeToCompressed } from './convert-inferred-type-to-compressed';
import {
  CompressedInferredTypes,
  mergeCompressedInferredTypes,
} from './merge-compressed-inferred-types';

const convergePairs = (
  messageState: StateRecorder<Message>
) => (
  pair: ValuePair,
): InferredType[] => {
  switch (pair.kind) {
    case 'Exact':
      return convergeValues(
        messageState,
        pair.left.value,
        pair.left.expression,
        pair.right.value,
        pair.right.expression,
      );
    case 'Evaluated':
      return convergeValues(
        messageState,
        shallowStripImplicits(pair.left.value),
        pair.left.expression,
        shallowStripImplicits(pair.right.value),
        pair.right.expression,
      );
    default:
      return assertNever(pair);
  }
}

export function compressTypeRelationships(
  messageState: StateRecorder<Message>,
  pairedValues: ValuePair[],
): CompressedInferredTypes {
  const inferredTypesArray = pairedValues.flatMap(convergePairs(messageState));
  return mergeCompressedInferredTypes(
    messageState,
    inferredTypesArray.map(convertInferredTypeToCompressed),
  );
}
