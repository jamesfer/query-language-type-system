import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { node } from '../constructors';
import { newFreeVariable } from '../type-utils';
import { NativeExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToNative = (scope: Scope) => (makeUniqueId: UniqueIdGenerator, expression: NativeExpression): AttachedTypeNode => {
  return node(expression, { scope, type: newFreeVariable('native$', makeUniqueId) });
};
