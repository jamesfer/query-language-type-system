import { TypeResult } from '../monad-utils';
import { Application, Expression } from '../types/expression';
import { Scope } from '../types/scope';
import { AttachedTypeNode } from './attached-type-node';

export const attachTypeToApplicationChildren = (scope: Scope) => (expression: Application) => (attachTypes: (scope: Scope) => (expression: Expression) => TypeResult<AttachedTypeNode>): Application<AttachedTypeNode>
