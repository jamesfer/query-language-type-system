import { mapValues } from 'lodash';
import { Expression, Message } from '../../index';
import { assert } from '../../utils/assert';
import { getGenElement } from '../../utils/get-gen-element';
import { convergeValues } from '../converge-values';
import { InferredType } from '../converge-values/converge-types';
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
  name: string,
  existing: CompressedInferredType,
  next: CompressedInferredType,
): [Message[], InferredType[], CompressedInferredType] {
  assert(existing.sources.length > 0, 'Tried to combine an inferred type that has no sources');
  assert(next.sources.length > 0, 'Tried to combine an inferred type that has no sources');

  // Remove any implicits from next.to that would need to be inferred to get it match the expected type
  const correctedNextValue = correctImplicits(existing.to, next.to);

  // Attempt to converge the two destination values
  const [messages, newInferredTypes] = convergeValues(
    existing.to,
    existing.sources[next.sources.length - 1].inferringExpression,
    correctedNextValue,
    next.sources[next.sources.length - 1].inferringExpression,
  );

  const result = messages.length === 0
    ? {
      to: correctedNextValue,
      sources: [
        ...existing.sources,
        ...next.sources,
      ],
    }
    : existing;
  return [messages, newInferredTypes, result];
}

function appendNewInferredType(existing: CompressedInferredTypes, name: string, newType: CompressedInferredType): CompressedInferredTypes {
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
  messages: Message[],
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
      const [newMessages, newInferredTypes, newCompressedType] = combineInferredType(
        name,
        existing[name],
        inferredType,
      );
      messages.push(...newMessages);
      allNewInferredTypes.push(...newInferredTypes)
      if (newMessages.length === 0) {
        resultingCompressedTypes = appendNewInferredType(resultingCompressedTypes, name, newCompressedType);
      }
    }
  }
  return [resultingCompressedTypes, allNewInferredTypes];
}

export function mergeCompressedInferredTypes(
  compressedInferredTypes: CompressedInferredTypes[]
): [Message[], CompressedInferredTypes] {
  const compressedInferredTypesCopy = [...compressedInferredTypes];
  const messages: Message[] = [];
  let accumulatedInferredTypes: CompressedInferredTypes = {};
  let newInferredTypes;
  while (compressedInferredTypesCopy.length > 0) {
    ([accumulatedInferredTypes, newInferredTypes] = combineAllInferredTypes(
      messages,
      accumulatedInferredTypes,
      compressedInferredTypesCopy.shift()!,
    ));
    compressedInferredTypesCopy.unshift(...newInferredTypes.map(convertInferredTypeToCompressed));
  }

  return [messages, accumulatedInferredTypes];
}
