import { Expression } from './expression';
import { Value } from './value';

export type InferredTypeOperator = 'Equals' | 'EvaluatesTo' | 'EvaluatedFrom';

export interface InferredType {
  operator: InferredTypeOperator;
  from: string;
  to: Value;
  origin: Expression;
  inferrer: Expression;
}

export interface CollapsedInferredType {
  operator: InferredTypeOperator;
  from: string;
  to: Value;
  sources: InferredType[];
}

export type CollapsedInferredTypeMap = { [k: string]: CollapsedInferredType }

export function makeInferredType(
  operator: InferredTypeOperator,
  from: string,
  to: Value,
  origin: Expression,
  inferrer: Expression,
): InferredType {
  return { operator, from, to, origin, inferrer };
}

export function makeCollapsedInferredType(inferredType: InferredType): CollapsedInferredType {
  return {
    operator: inferredType.operator,
    from: inferredType.from,
    to: inferredType.to,
    sources: [inferredType],
  };
}

// type RelationshipOperator = 'Equals' | 'EvaluatesTo' | 'EvaluatedFrom';
//
// interface Relationship {
//   name: string;
//   operator: RelationshipOperator;
//   value: Value;
// }
//
// function reduceM(state: any, existing: Relationship, next: Relationship): boolean {
//   switch (existing.operator) {
//     case 'Equals':
//       switch (next.operator) {
//         case 'Equals':
//           // converge
//           break;
//         case 'EvaluatesTo':
//           // strip implicits from existing
//           // if existing is freeVariable, then (existing.name evaluatesTo next.value)
//           // else converge
//           break;
//         case 'EvaluatedFrom':
//           // strip implicits from next
//           // if next is freeVariable, then (next.name evaluatesTo existing.value)
//           // else converge
//           break;
//       }
//       break;
//     case 'EvaluatesTo':
//       switch (next.operator) {
//         case 'Equals':
//           // strip implicits from next
//           // if next is freeVariable, then (next.name evaluatesTo existing.value)
//           // else converge
//           break;
//         case 'EvaluatesTo':
//           // converge
//           break;
//         case 'EvaluatedFrom':
//           // strip implicits from next
//           // if next is freeVariable, then (next.name evaluatesTo existing.value)
//           // else converge
//           // TODO this really infers that existing is exactly next.value
//           break;
//       }
//       break;
//     case 'EvaluatedFrom':
//       switch (next.operator) {
//         case 'Equals':
//           // strip implicits from existing
//           // if existing is a freeVariable, then (existing.name evaluatesTo next.value)
//           // else converge
//           break;
//         case 'EvaluatesTo':
//           // strip implicits from existing
//           // if existing is a freeVariable, then (existing.name evaluatesTo next.value)
//           // else converge
//           // TODO this really infers that existing is exactly next.value
//           break;
//         case 'EvaluatedFrom':
//           // converge
//           break;
//       }
//       break;
//   }
// }
