import { map } from 'fp-ts/Array';
import { absurd, flow, pipe } from 'fp-ts/function';
import { fold } from 'fp-ts/Option';
import { lookup } from 'fp-ts/Record';
import { adhocReduce } from '../../utils/adhoc-reduce';
import { assert } from '../../utils/assert';
import { convergeValues } from '../converge-values';
import { StateRecorder } from '../state-recorder/state-recorder';
import {
  CollapsedInferredType,
  CollapsedInferredTypeMap, makeCollapsedInferredType,
  InferredType, makeInferredType,
} from '../types/inferred-type';
import { Message } from '../types/message';
import { FreeVariable, Value } from '../types/value';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';
import { Expression } from '../types/expression';

// Old algorithm
// // Remove implicits from the existing value if needed
// const existingValue = stripImplicitsIfNeeded(existing);
// if (existingValue.kind === 'FreeVariable') {
//   return [{ ...next, from: existingValue.name }];
// }
//
// // Remove implicits from the next value if needed
// const nextValue = stripImplicitsIfNeeded(next);
// if (nextValue.kind === 'FreeVariable') {
//   return [{ ...next, kind: existing.kind, from: nextValue.name, to: existing.to }];
// }
//
// // Converge the values and expect every other relationship to be exact
// return convergeValues(
//   messageState,
//   existingValue,
//   existing.sources[existing.sources.length - 1].inferrer,
//   nextValue,
//   next.inferrer,
// ).map(({ from, to, originatingExpression, inferringExpression }): InferredType => ({
//   from,
//   to,
//   kind: 'Equals',
//   origin: originatingExpression,
//   inferrer: inferringExpression,
// }));

// function stripImplicitsIfNeeded(type: CollapsedInferredType): Value {
//   return type.kind === 'Evaluated' ? shallowStripImplicits(type.to) : type.to;
// }

function performValueConverge(
  messageState: StateRecorder<Message>,
  existingValue: Value,
  existingExpression: Expression,
  nextValue: Value,
  nextExpression: Expression,
): CollapsedInferredType[] {
  return pipe(
    convergeValues(messageState, existingValue, existingExpression, nextValue, nextExpression),
    // TODO need to include the sources from the existing and next inferred types
    map(({ from, to, originatingExpression, inferringExpression }): InferredType => (
      makeInferredType('Equals', from, to, originatingExpression, inferringExpression)
    )),
    map(makeCollapsedInferredType)
  );
}

/**
 * This is the most complex part of the typing algorithm.
 *
 * x exact ...
 * x exact ...
 * -> Converge ...
 *
 * x evaluated implicit y -> ...
 * x exact ...
 * -> Converge ...
 *
 * x exact implicit y -> ...
 * x evaluated ...
 * -> Converge ...
 */
const convergeCollapsedType = (
  messageState: StateRecorder<Message>,
  next: CollapsedInferredType,
) => (
  existing: CollapsedInferredType,
): CollapsedInferredType[] => {
  assert(next.sources.length > 0, 'Tried to combine a new inferred type that has no sources');
  assert(existing.sources.length > 0, 'Tried to combine an existing inferred type that has no sources');

  switch (existing.operator) {
    case 'Equals':
      switch (next.operator) {
        case 'Equals':
          // converge
          return performValueConverge(
            messageState,
            existing.to,
            existing.sources[existing.sources.length - 1].inferrer,
            next.to,
            next.sources[next.sources.length - 1].inferrer,
          );
        case 'EvaluatesTo': {
          // strip implicits from existing
          // if existing is freeVariable, then (existing.name evaluatesTo next.value)
          // else converge
          const existingValue = shallowStripImplicits(existing.to);
          if (existingValue.kind === 'FreeVariable') {
            return [{
              operator: 'EvaluatesTo',
              from: existingValue.name,
              to: next.to,
              sources: [
                ...existing.sources,
                ...next.sources,
              ],
            }];
          }
          return performValueConverge(
            messageState,
            existingValue,
            existing.sources[existing.sources.length - 1].inferrer,
            next.to,
            next.sources[next.sources.length - 1].inferrer,
          );
        }
        case 'EvaluatedFrom': {
          // strip implicits from next
          // if next is freeVariable, then (next.name evaluatesTo existing.value)
          // else converge
          const nextValue = shallowStripImplicits(next.to);
          if (nextValue.kind === 'FreeVariable') {
            return [{
              operator: 'EvaluatesTo',
              from: nextValue.name,
              to: existing.to,
              sources: [
                ...next.sources,
                ...existing.sources,
              ],
            }];
          }
          return performValueConverge(
            messageState,
            existing.to,
            existing.sources[existing.sources.length - 1].inferrer,
            nextValue,
            next.sources[next.sources.length - 1].inferrer,
          );
        }
        default:
          return absurd(next.operator);
      }
    case 'EvaluatesTo':
      switch (next.operator) {
        case 'Equals': {
          // strip implicits from next
          // if next is freeVariable, then (next.name evaluatesTo existing.value)
          // else converge
          const nextValue = shallowStripImplicits(next.to);
          if (nextValue.kind === 'FreeVariable') {
            return [{
              operator: 'EvaluatesTo',
              from: nextValue.name,
              to: existing.to,
              sources: [
                ...next.sources,
                ...existing.sources,
              ],
            }];
          }
          return performValueConverge(
            messageState,
            existing.to,
            existing.sources[existing.sources.length - 1].inferrer,
            nextValue,
            next.sources[next.sources.length - 1].inferrer,
          );
        }
        case 'EvaluatesTo':
          // converge
          return performValueConverge(
            messageState,
            existing.to,
            existing.sources[existing.sources.length - 1].inferrer,
            next.to,
            next.sources[next.sources.length - 1].inferrer,
          );
        case 'EvaluatedFrom': {
          // strip implicits from next
          // if next is freeVariable, then (next.name evaluatesTo existing.value)
          // else converge
          const nextValue = shallowStripImplicits(next.to);
          if (nextValue.kind === 'FreeVariable') {
            return [{
              operator: 'EvaluatesTo',
              from: nextValue.name,
              to: existing.to,
              sources: [
                ...next.sources,
                ...existing.sources,
              ],
            }];
          }
          return performValueConverge(
            messageState,
            existing.to,
            existing.sources[existing.sources.length - 1].inferrer,
            nextValue,
            next.sources[next.sources.length - 1].inferrer,
          );
        }
        default:
          return absurd(next.operator);
      }
    case 'EvaluatedFrom':
      switch (next.operator) {
        case 'Equals': {
          // strip implicits from existing
          // if existing is a freeVariable, then (existing.name evaluatesTo next.value)
          // else converge
          const existingValue = shallowStripImplicits(existing.to);
          if (existingValue.kind === 'FreeVariable') {
            return [{
              operator: 'EvaluatesTo',
              from: existingValue.name,
              to: next.to,
              sources: [
                ...existing.sources,
                ...next.sources,
              ],
            }];
          }
          return performValueConverge(
            messageState,
            existingValue,
            existing.sources[existing.sources.length - 1].inferrer,
            next.to,
            next.sources[next.sources.length - 1].inferrer,
          );
        }
        case 'EvaluatesTo': {
          // strip implicits from existing
          // if existing is a freeVariable, then (existing.name evaluatesTo next.value)
          // else converge
          const existingValue = shallowStripImplicits(existing.to);
          if (existingValue.kind === 'FreeVariable') {
            return [{
              operator: 'EvaluatesTo',
              from: existingValue.name,
              to: next.to,
              sources: [
                ...existing.sources,
                ...next.sources,
              ],
            }];
          }
          return performValueConverge(
            messageState,
            existingValue,
            existing.sources[existing.sources.length - 1].inferrer,
            next.to,
            next.sources[next.sources.length - 1].inferrer,
          );
        }
        case 'EvaluatedFrom':
          // converge
          return performValueConverge(
            messageState,
            existing.to,
            existing.sources[existing.sources.length - 1].inferrer,
            next.to,
            next.sources[next.sources.length - 1].inferrer,
          );
        default:
          return absurd(next.operator);
      }
    default:
      return absurd(existing.operator);
  }
}

function appendNewInferredType(
  existing: CollapsedInferredTypeMap,
  nextType: CollapsedInferredType,
): CollapsedInferredTypeMap {
  return { ...existing, [nextType.from]: nextType };
}

function isExactMirror(inferredType: CollapsedInferredType): boolean {
  return inferredType.operator === 'Equals'
    && inferredType.to.kind === 'FreeVariable'
    && inferredType.to.name === inferredType.from;
}

const combineCollapsedTypes = (
  messageState: StateRecorder<Message>,
) => (
  allTypes: CollapsedInferredTypeMap,
  nextType: CollapsedInferredType,
): [CollapsedInferredTypeMap, CollapsedInferredType[]] => {
  if (isExactMirror(nextType)) {
    // Ignore inferred types that are exactly recursive. These types are always true and don't need
    // to be checked.
    return [allTypes, []];
  }

  return pipe(
    allTypes,
    lookup(nextType.from),
    fold<CollapsedInferredType, [CollapsedInferredTypeMap, CollapsedInferredType[]]>(
      () => [appendNewInferredType(allTypes, nextType), []],
      flow(
        convergeCollapsedType(messageState, nextType),
        inferredTypes => [allTypes, inferredTypes]
      ),
    ),
  );
};

export function collapseInferredTypes(
  messageState: StateRecorder<Message>,
  inferredTypes: InferredType[],
): CollapsedInferredTypeMap {
  return adhocReduce(
    {},
    inferredTypes.map(makeCollapsedInferredType),
    combineCollapsedTypes(messageState),
  );
}
