import { Value } from '../types/value';
import { Scope } from '../types/scope';
import { Node } from '../types/node';

export interface AttachedTypeDecoration {
  type: Value;
  scope: Scope;
}

// export interface RequiredImplicitParameter {
//   position: number;
//   type: Value;
// }

// export interface AttachedTypeDecoration extends PartialAttachedTypeDecoration {
//   requiredImplicitParameters: RequiredImplicitParameter[];
// }

// export type AttachedTypeNode = Node<PartialAttachedTypeDecoration>;

export type AttachedTypeNode = Node<AttachedTypeDecoration>;
