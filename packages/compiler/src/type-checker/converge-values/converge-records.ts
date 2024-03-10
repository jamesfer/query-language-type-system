import { sortBy } from 'lodash';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { RecordLiteral, Value } from '../types/value';
import { checkedZip } from '../utils/utils';
import { ConvergeState, InferredType } from './converge-types';
import { mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeRecords(
  messageState: StateRecorder<Message>,
  state: ConvergeState,
  record: RecordLiteral,
  other: Value,
): InferredType[] {
  if (other.kind !== 'RecordLiteral') {
    return mismatchResult(messageState, state, record, other);
  }

  const recordProperties = sortBy(Object.keys(record.properties));
  const otherProperties = sortBy(Object.keys(other.properties));
  const zippedProperties = checkedZip(recordProperties, otherProperties);
  if (zippedProperties.some(([left, right]) => left !== right)) {
    return mismatchResult(messageState, state, record, other);
  }

  return zippedProperties.flatMap(([recordProperty, otherProperty]) => convergeValuesWithState(
    messageState,
    state,
    record.properties[recordProperty],
    other.properties[otherProperty],
  ));
}
