import { Either, isLeft, toUnion } from 'fp-ts/Either';
import { flow, pipe } from 'fp-ts/function';
import { fold } from 'fp-ts/Option';
import { lookup } from 'fp-ts/Record';
import { mapFst } from 'fp-ts/Tuple';
import { pick } from 'lodash';
import { adhocReduce } from '../../utils/adhoc-reduce';
import { StateRecorder } from '../state-recorder/state-recorder';
import {
  CollapsedInferredType,
  CollapsedInferredTypeMap,
  makeCollapsedInferredType,
  InferredType,
} from '../types/inferred-type';
import { Message } from '../types/message';
import { mergePartialTypes } from './merge-partial-types';
import { NamedPartialType, PartialType } from './partial-type';

function isExactMirror(inferredType: CollapsedInferredType): boolean {
  return inferredType.operator === 'Equals'
    && inferredType.to.kind === 'FreeVariable'
    && inferredType.to.name === inferredType.from;
}

function buildInferredTypesFromAssumptions(
  assumptions: Either<NamedPartialType, NamedPartialType>[],
  existingSources: InferredType[],
  nextSources: InferredType[],
) {
  return assumptions.map((assumption): CollapsedInferredType => {
    const sources = isLeft(assumption)
      ? [...nextSources, ...existingSources]
      : [...existingSources, ...nextSources];
    const { from, operator, to } = toUnion(assumption);
    return { from, operator, to, sources };
  });
}

function toPartialType({ operator, to }: CollapsedInferredType): PartialType {
  return { operator, to };
}

function mergePartialTypesWithAssumptions(
  messageState: StateRecorder<Message>,
  existing: CollapsedInferredType,
  next: CollapsedInferredType,
): [PartialType, CollapsedInferredType[]] {
  const assumptionsState = new StateRecorder<Either<NamedPartialType, NamedPartialType>>();
  const mergedPartialType = mergePartialTypes(
    messageState,
    assumptionsState,
    toPartialType(existing),
    toPartialType(next),
  );
  const newInferredTypes = buildInferredTypesFromAssumptions(
    assumptionsState.values,
    existing.sources,
    next.sources,
  );
  return [mergedPartialType, newInferredTypes];
}

function wrapped(
  messageState: StateRecorder<Message>,
  existing: CollapsedInferredType,
  next: CollapsedInferredType,
): [PartialType, CollapsedInferredType[]] {
  const [l, r] = mergePartialTypesWithAssumptions(messageState, existing, next);
  // messageState.push(
  //   `$${existing.from}: ${existing.operator} -> ${JSON.stringify(existing.to)}       &       ${next.operator} -> ${JSON.stringify(next.to)}          =          ${l.operator} -> ${JSON.stringify(l.to)}         given         ${r.map(x => `${x.from} -> ${x.operator} -> ${JSON.stringify(x.to)}`).join('   ,   ')}`
  // );
  return [l, r];
}

const mergeCollapsedTypes = (
  messageState: StateRecorder<Message>,
) => (
  next: CollapsedInferredType,
) => (
  existing: CollapsedInferredType,
): [CollapsedInferredType, CollapsedInferredType[]] => {
  return pipe(
    wrapped(messageState, existing, next),
    mapFst((mergedPartialType): CollapsedInferredType => ({
      ...mergedPartialType,
      from: existing.from,
      sources: [...existing.sources, ...next.sources],
    })),
  );
};

const applyCollapsedType = (
  messageState: StateRecorder<Message>,
) => (
  allTypes: CollapsedInferredTypeMap,
  nextType: CollapsedInferredType,
) : [CollapsedInferredTypeMap, CollapsedInferredType[]] => {
  if (isExactMirror(nextType)) {
    // Ignore inferred types that are exactly recursive. These types are always true and don't need
    // to be checked.
    return [allTypes, []];
  }

  return pipe(
    allTypes,
    lookup(nextType.from),
    fold<CollapsedInferredType, [CollapsedInferredType, CollapsedInferredType[]]>(
      () => [nextType, []],
      mergeCollapsedTypes(messageState)(nextType),
    ),
    mapFst(newType => ({ ...allTypes, [newType.from]: newType })),
  );
};

export function reduceInferredTypes(
  messageState: StateRecorder<Message>,
  inferredTypes: InferredType[],
): CollapsedInferredTypeMap {
  return adhocReduce(
    {},
    inferredTypes.map(makeCollapsedInferredType),
    applyCollapsedType(messageState),
  );
}
