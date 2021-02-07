import { sortBy } from 'lodash';
import { RecordLiteral, Value } from '../types/value';
import { checkedZip } from '../utils';
import { ConvergeResult, ConvergeState } from './converge-types';
import { join, mismatchResult } from './converge-utils';
import { convergeValuesWithState } from './converge-values-with-state';

export function convergeRecords(
  state: ConvergeState,
  record: RecordLiteral,
  other: Value,
): ConvergeResult {
  if (other.kind !== 'RecordLiteral') {
    return mismatchResult(state, record, other);
  }

  const recordProperties = sortBy(Object.keys(record.properties));
  const otherProperties = sortBy(Object.keys(other.properties));
  const zippedProperties = checkedZip(recordProperties, otherProperties);
  if (zippedProperties.some(([left, right]) => left !== right)) {
    return mismatchResult(state, record, other);
  }

  return join(zippedProperties.map(([recordProperty, otherProperty]) => (
    convergeValuesWithState(state, record.properties[recordProperty], other.properties[otherProperty])
  )));
}
