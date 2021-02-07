import { freeVariable, node } from '../constructors';
import { findBinding } from '../scope-utils';
import { Identifier } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToIdentifier = (scope: Scope) => (expression: Identifier): AttachedTypeNode => {
  const binding = findBinding(scope, expression.name);
  return node(expression, {
    scope,
    type: binding
      // If we found the binding in the scope, we can return its type
      ? binding.type
      // Otherwise we create a new free variable for the expression
      // TODO these free variables are constant globally. Instead they should be constant in some local scope such
      //      as inside a function type definition but considered different between different function types.
      : freeVariable(expression.name),
  });
};
