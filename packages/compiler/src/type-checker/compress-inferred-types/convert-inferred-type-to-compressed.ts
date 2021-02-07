import { InferredType } from '../converge-values/converge-types';
import { CompressedInferredTypes } from './merge-compressed-inferred-types';

export function convertInferredTypeToCompressed({ from, ...source }: InferredType): CompressedInferredTypes {
  return {
    [from]: {
      to: source.to,
      sources: [source],
    },
  };
}
