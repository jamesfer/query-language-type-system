"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeCollapsedInferredType = exports.makeInferredType = void 0;
function makeInferredType(operator, from, to, origin, inferrer) {
    return { operator, from, to, origin, inferrer };
}
exports.makeInferredType = makeInferredType;
function makeCollapsedInferredType(inferredType) {
    return {
        operator: inferredType.operator,
        from: inferredType.from,
        to: inferredType.to,
        sources: [inferredType],
    };
}
exports.makeCollapsedInferredType = makeCollapsedInferredType;
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
//# sourceMappingURL=inferred-type.js.map