import { some } from 'lodash';
import { node } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { findBinding } from '../scope-utils';
import { BindingExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachTypesState } from './attach-types-state';
import { AttachedTypeNode } from './attached-type-node';
import { shallowStripImplicits } from '../utils/shallow-strip-implicits';

export const attachTypeToBinding = (state: AttachTypesState) => (scope: Scope) => (
  expression: BindingExpression<AttachedTypeNode>,
): AttachedTypeNode => {
  if (findBinding(scope, expression.name)) {
    state.log(`A variable with the name ${expression.name} already exists`)
  }

  return node(expression, {
    scope,
    type: shallowStripImplicits(expression.body.decoration.type),
  });
};
