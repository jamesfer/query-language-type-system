import { flatten } from 'lodash';
import { Message } from '../../index';
import { convergeValues } from '../converge-values';
import { ConvergeResult } from '../converge-values/converge-types';
import { StateRecorder } from '../state-recorder/state-recorder';
import { ValuePair } from '../types/value-pair';
import { assertNever, unzip } from '../utils';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';
import { convertInferredTypeToCompressed } from './convert-inferred-type-to-compressed';
import {
  CompressedInferredTypes,
  mergeCompressedInferredTypes,
} from './merge-compressed-inferred-types';

function convergePairs(pair: ValuePair): ConvergeResult {
  switch (pair.kind) {
    case 'Exact':
      return convergeValues(
        pair.left.value,
        pair.left.expression,
        pair.right.value,
        pair.right.expression,
      );
    case 'Evaluated':
      return convergeValues(
        shallowStripImplicits(pair.left.value),
        pair.left.expression,
        shallowStripImplicits(pair.right.value),
        pair.right.expression,
      );
    default:
      return assertNever(pair);
  }
}

export function compressTypeRelationships(pairedValues: ValuePair[]): [Message[], CompressedInferredTypes] {
  const messageRecorder = new StateRecorder<Message>()

  const [messageArray, inferredTypesArray] = unzip(pairedValues.map(convergePairs));
  messageRecorder.pushAll(flatten(messageArray));

  const [messages, compressedInferredTypes] = mergeCompressedInferredTypes(
    flatten(inferredTypesArray).map(convertInferredTypeToCompressed),
  );
  messageRecorder.pushAll(messages);

  return [messageRecorder.values, compressedInferredTypes]
}
