import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { node } from '../constructors';
import { TypeResult, TypeWriter } from '../monad-utils';
import { newFreeVariable } from '../type-utils';
import { NativeExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToNative = (scope: Scope) => (makeUniqueId: UniqueIdGenerator, expression: NativeExpression): TypeResult<AttachedTypeNode> => {
  return new TypeWriter(scope).wrap(node(expression, { scope, type: newFreeVariable('native$', makeUniqueId) }));
};
