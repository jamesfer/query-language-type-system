import { TypedNode } from '../type-check';
import { Expression } from './expression';
import { Value } from './value';

export interface ScopeBinding {
  kind: 'ScopeBinding';
  name: string;
  type: Value;
  scope: Scope;
  node?: TypedNode;
  // expression?: Expression;
}

export interface Scope {
  bindings: ScopeBinding[];
}
