import { Value } from '../types/value';
import { visitAndTransformValue } from '../visitor-utils';
import { CompressedInferredTypes } from './merge-compressed-inferred-types';

export function applyCompressedInferredTypes(compressedInferredTypes: CompressedInferredTypes, value: Value): Value {
  return visitAndTransformValue((value: Value) => {
    if (value.kind === 'FreeVariable' && value.name in compressedInferredTypes) {
      return compressedInferredTypes[value.name].to;
    }
    return value;
  })(value);
}
