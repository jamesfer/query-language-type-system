import { Message } from '../..';
import { Free, mapFree } from '../../utils/free';

export interface WithMessages<T> {
  messages: Message[];
  value: T;
}

export function withMessages<T>(messages: Message[], value: T): WithMessages<T> {
  return { messages, value };
}

export function doWithState<T>(f: (state: MessageState) => T): WithMessages<T> {
  const state = new MessageState();
  return state.wrap(f(state));
}

export function doWithFreeState<T>(f: (state: MessageState) => Free<T>): Free<WithMessages<T>> {
  const state = new MessageState();
  return mapFree(f(state), value => state.wrap(value));
}

export class MessageState {
  private messages: Message[] = [];

  run<T extends any[], R>(f: (...args: T) => WithMessages<R>): (...args: T) => R {
    return (...args) => {
      const { messages, value } = f(...args);
      this.log(messages);
      return value;
    };
  }

  sequence<T>(inputs: WithMessages<T>[]): T[] {
    return inputs.map(this.unwrap.bind(this));
  }

  unwrap<T>({ messages, value }: WithMessages<T>): T {
    this.log(messages);
    return value;
  }

  wrap<T>(value: T) {
    return withMessages(this.messages, value);
  }

  log(messages: Message[]): void {
    this.messages = this.messages.concat(messages);
  }
}
