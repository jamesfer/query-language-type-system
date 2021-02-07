import { InferredType } from '../converge-values/converge-types';
import { convertInferredTypeToCompressed } from './convert-inferred-type-to-compressed';
import { CompressedInferredTypes, mergeCompressedInferredTypes } from './merge-compressed-inferred-types';
import { Message } from '../../index';

export function compressInferredTypes(inferredTypes: InferredType[]): [Message[], CompressedInferredTypes] {
  return mergeCompressedInferredTypes(inferredTypes.map(convertInferredTypeToCompressed));
}
