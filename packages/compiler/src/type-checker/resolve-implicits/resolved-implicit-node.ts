import { AttachedTypeDecoration } from '../attach-types/attached-type-node';
import { Node } from '../types/node';

export interface ResolvedImplicitDecoration extends AttachedTypeDecoration {
  resolvedImplicits: []; // TODO
}

export type ResolvedImplicitNode = Node<ResolvedImplicitDecoration>;
