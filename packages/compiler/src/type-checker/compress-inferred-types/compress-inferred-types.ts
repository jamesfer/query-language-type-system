import { convergeValues } from '../converge-values';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Value } from '../types/value';
import { convertInferredTypeToCompressed } from './convert-inferred-type-to-compressed';
import { CompressedInferredTypes, mergeCompressedInferredTypes } from './merge-compressed-inferred-types';
import { Expression, Message } from '../../index';
import { unzip } from '../utils';
import { flatten } from 'lodash';

export function compressInferredTypes(pairedValues: [Value, Expression, Value, Expression][]): [Message[], CompressedInferredTypes] {
  const messageRecorder = new StateRecorder<Message>()
  const [messageArray, inferredTypesArray] = unzip(pairedValues.map(
    ([left, leftExpression, right, rightExpression]) => convergeValues(left, leftExpression, right, rightExpression)
  ));
  messageRecorder.pushAll(flatten(messageArray));

  const [messages, compressedInferredTypes] = mergeCompressedInferredTypes(
    flatten(inferredTypesArray).map(convertInferredTypeToCompressed),
  );
  messageRecorder.pushAll(messages);

  return [messageRecorder.values, compressedInferredTypes]
}
