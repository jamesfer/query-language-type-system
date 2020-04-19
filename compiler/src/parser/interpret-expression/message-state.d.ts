import { Message } from '../..';
import { Free } from '../../utils/free';
export interface WithMessages<T> {
    messages: Message[];
    value: T;
}
export declare function withMessages<T>(messages: Message[], value: T): WithMessages<T>;
export declare function doWithState<T>(f: (state: MessageState) => T): WithMessages<T>;
export declare function doWithFreeState<T>(f: (state: MessageState) => Free<T>): Free<WithMessages<T>>;
export declare class MessageState {
    private messages;
    run<T extends any[], R>(f: (...args: T) => WithMessages<R>): (...args: T) => R;
    sequence<T>(inputs: WithMessages<T>[]): T[];
    unwrap<T>({ messages, value }: WithMessages<T>): T;
    wrap<T>(value: T): WithMessages<T>;
    log(messages: Message[]): void;
}
//# sourceMappingURL=message-state.d.ts.map