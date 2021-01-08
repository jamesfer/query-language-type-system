import { Value } from '../types/value';
import { Scope } from '../types/scope';
import { Node } from '../types/node';

export interface AttachedTypeDecoration {
  type: Value;
  scope: Scope;
}

export type AttachedTypeNode = Node<AttachedTypeDecoration>;
