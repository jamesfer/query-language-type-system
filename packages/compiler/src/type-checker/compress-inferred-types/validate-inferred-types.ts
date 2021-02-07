import { InferredType } from '../converge-values/converge-types';
import { Message } from '../..';

export function validateInferredTypes(inferredTypes: InferredType[]): [Message[], InferredType[]] {
  return [[], inferredTypes];
}
