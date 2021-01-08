import { Scope } from '../../types/scope';
import { FreeVariable, Value } from '../../types/value';
import { findBinding } from '../../scope-utils';

export function isFreeVariable(scope: Scope, value: Value): value is FreeVariable {
  return value.kind === 'FreeVariable' && !findBinding(scope, value.name);
}
