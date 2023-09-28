import { pipe } from 'fp-ts/function';
import { lookup, mapWithIndex } from 'fp-ts/Record';
import { leftOrBoth, rightOrBoth, These } from 'fp-ts/These';
import { assign } from 'lodash/fp';

export function zipRecords<A, B>(
  leftRecord: { [K: string]: A },
  rightRecord: { [K: string]: B },
): { [K: string]: These<A, B> } {
  return pipe(
    leftRecord,
    mapWithIndex((key, leftValue) => pipe(
      rightRecord,
      lookup(key),
      leftOrBoth(leftValue),
    )),
    assign(pipe(
      rightRecord,
      mapWithIndex((key, rightValue) => pipe(
        leftRecord,
        lookup(key),
        rightOrBoth(rightValue)
      )),
    )),
  );
}
