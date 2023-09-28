import { Either } from 'fp-ts/Either';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { NamedPartialType, PartialType } from './partial-type';
export declare function mergePartialTypes(messageState: StateRecorder<Message>, assumptionsState: StateRecorder<Either<NamedPartialType, NamedPartialType>>, left: PartialType, right: PartialType): PartialType;
//# sourceMappingURL=merge-partial-types.d.ts.map