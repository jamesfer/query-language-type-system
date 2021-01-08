import { Expression } from './types/expression';
import { TypedNode } from './type-check';
import { attachTypes } from './attach-types';
import { Scope } from './types/scope';
import { recursivelyApplyReplacementsToNode } from './variable-utils';
import { applyVariableReplacements } from './apply-variable-replacements';

export function checkTypes(scope: Scope, expression: Expression): TypedNode {
  // Compute the type of each expression. Implicit parameters are only kept in a single place. Type information learned
  // in the form of type replacements are propagated upwards
  const result = attachTypes(scope)(expression);

  // Reapplies all the type replacements discovered in the previous step. Type information gained from higher level
  // expressions can be propagated downwards
  const updatedNode = applyVariableReplacements(result.state[1], result.value);
}
