import { mapValues } from 'lodash';
import { Expression, Message } from '../../index';
import { assert } from '../../utils/assert';
import { getGenElement } from '../../utils/get-gen-element';
import { convergeValues } from '../converge-values';
import { InferredType } from '../converge-values/converge-types';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Value } from '../types/value';
import { selectImplicitParameters } from '../utils/select-implicit-parameters';
import { unfoldParameters } from '../visitor-utils';
import { applyCompressedInferredTypes } from './apply-compresed-inferred-types';
import { convertInferredTypeToCompressed } from './convert-inferred-type-to-compressed';

export interface CompressedInferredTypeSource {
  to: Value;
  originatingExpression: Expression;
  inferringExpression: Expression;
}

export interface CompressedInferredType {
  to: Value;
  sources: CompressedInferredTypeSource[];
}

export interface CompressedInferredTypes {
  [k: string]: CompressedInferredType;
}

function correctImplicits(existing: Value, next: Value): Value {
  if (next.kind !== 'ImplicitFunctionLiteral') {
    return next;
  }

  const expectedParameters = selectImplicitParameters(existing);
  const currentParameters = selectImplicitParameters(next);
  const implicitsToRemove = currentParameters.length - expectedParameters.length;

  if (implicitsToRemove > 0) {
    const maybeBody = getGenElement(implicitsToRemove - 1, unfoldParameters(next));
    if (maybeBody.length === 1) {
      const [[, , body]] = maybeBody;
      return body;
    }
  }

  return next;
}

function combineInferredType(
  messageState: StateRecorder<Message>,
  existing: CompressedInferredType,
  next: CompressedInferredType,
): [InferredType[], CompressedInferredType] {
  assert(existing.sources.length > 0, 'Tried to combine an inferred type that has no sources');
  assert(next.sources.length > 0, 'Tried to combine an inferred type that has no sources');

  // Remove any implicits from next.to that would need to be inferred to get it match the expected type
  const correctedNextValue = correctImplicits(existing.to, next.to);

  // Attempt to converge the two destination values
  const nestedMessageState = new StateRecorder<Message>();
  const newInferredTypes = convergeValues(
    nestedMessageState,
    existing.to,
    existing.sources[next.sources.length - 1].inferringExpression,
    correctedNextValue,
    next.sources[next.sources.length - 1].inferringExpression,
  );

  if (nestedMessageState.values.length === 0) {
    const result = {
      to: correctedNextValue,
      sources: [
        ...existing.sources,
        ...next.sources,
      ],
    };
    return [newInferredTypes, result];
  }

  messageState.pushAll(nestedMessageState.values);
  return [newInferredTypes, existing];
}

function appendNewInferredType(
  existing: CompressedInferredTypes,
  name: string,
  newType: CompressedInferredType,
): CompressedInferredTypes {
  const newCompressedType: CompressedInferredTypes = { [name]: newType };
  return {
    ...mapValues(existing, existingType => ({
      ...existingType,
      to: applyCompressedInferredTypes(newCompressedType, existingType.to),
    })),
    ...newCompressedType,
  };
}

function combineAllInferredTypes(
  messageState: StateRecorder<Message>,
  existing: CompressedInferredTypes,
  next: CompressedInferredTypes,
): [CompressedInferredTypes, InferredType[]] {
  const allNewInferredTypes: InferredType[] = [];
  let resultingCompressedTypes = existing;
  for (const name in next) {
    const inferredType = {
      ...next[name],
      to: applyCompressedInferredTypes(existing, next[name].to),
    };

    if (!(name in resultingCompressedTypes)) {
      resultingCompressedTypes = appendNewInferredType(resultingCompressedTypes, name, inferredType);
    } else {
      const nestedMessageState = new StateRecorder<Message>();
      const [newInferredTypes, newCompressedType] = combineInferredType(
        nestedMessageState,
        existing[name],
        inferredType,
      );
      allNewInferredTypes.push(...newInferredTypes)
      messageState.pushAll(nestedMessageState.values);
      if (nestedMessageState.values.length === 0) {
        resultingCompressedTypes = appendNewInferredType(resultingCompressedTypes, name, newCompressedType);
      }
    }
  }
  return [resultingCompressedTypes, allNewInferredTypes];
}

export function mergeCompressedInferredTypes(
  messageState: StateRecorder<Message>,
  compressedInferredTypes: CompressedInferredTypes[],
): CompressedInferredTypes {
  const compressedInferredTypesCopy = [...compressedInferredTypes];
  let accumulatedInferredTypes: CompressedInferredTypes = {};
  let newInferredTypes;
  while (compressedInferredTypesCopy.length > 0) {
    ([accumulatedInferredTypes, newInferredTypes] = combineAllInferredTypes(
      messageState,
      accumulatedInferredTypes,
      compressedInferredTypesCopy.shift()!,
    ));
    compressedInferredTypesCopy.unshift(...newInferredTypes.map(convertInferredTypeToCompressed));
  }

  return accumulatedInferredTypes;
}
