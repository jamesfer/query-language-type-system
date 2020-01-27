import { Message } from './types/message';
import { VariableReplacement } from './variable-utils';
import { Scope } from './types/scope';

export interface WriterResult<S, V> {
  state: S;
  value: V;
}

export class WriterMonad<S> {
  constructor(
    protected state: S,
    private combine: (current: S, next: S) => S,
  ) {}

  append<V>({ state, value }: WriterResult<S, V>): V {
    this.state = this.combine(this.state, state);
    return value;
  }

  wrap<V>(value: V): WriterResult<S, V> {
    return { value, state: this.state };
  }

  static createResult<S, V>(state: S, value: V): WriterResult<S, V> {
    return { state, value };
  }
}

export type TypeState = [Message[], Scope];

export interface TypeResult<V> extends WriterResult<TypeState, V> {}

export class TypeWriter extends WriterMonad<TypeState> {
  constructor(scope: Scope) {
    super(
      TypeWriter.emptyTypeState(scope),
      ([messages], [newMessages, scope]) => [[...messages, ...newMessages], scope],
    );

    this.state = [this.state[0], scope];
  }

  get messages() {
    return this.state[0];
  }

  get scope() {
    return this.state[1];
  }

  log(message: Message): void {
    this.state = [[...this.messages, message], this.scope];
  }

  logAll(messages: Message[]): void {
    this.state = [[...this.messages, ...messages], this.scope];
  }

  updateScope(newScope: Scope): void {
    this.state = [this.messages, newScope];
  }

  // run<V>(f: (scope: Scope) => TypeResult<V>): V;
  run<V, A extends any[]>(f: (scope: Scope) => (...args: A) => TypeResult<V>): (...args: A) => V {
    return (...args) => this.append(f(this.scope)(...args));
  }

  static emptyTypeState(scope: Scope = { bindings: [] }): TypeState {
    return [[], { bindings: [] }];
  }

  static wrapEmpty<V>(value: V): TypeResult<V> {
    return WriterMonad.createResult(TypeWriter.emptyTypeState(), value);
  }

  static wrapWithScope<V>(scope: Scope, value: V): TypeResult<V> {
    return WriterMonad.createResult([[], scope], value);
  }
}

