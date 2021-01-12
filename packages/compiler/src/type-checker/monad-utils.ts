import { expandScope } from './constructors';
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

  update(state: S): void {
    this.state = this.combine(this.state, state);
  }

  append<V>({ state, value }: WriterResult<S, V>): V {
    this.update(state);
    return value;
  }

  wrap<V>(value: V): WriterResult<S, V> {
    return { value, state: this.state };
  }

  // chain<V>(initial: WriterResult<S, V>): WriterResult<S, V>
  chain<V, V1>(initial: WriterResult<S, V>, f1: (value: V) => WriterResult<S, V1>): WriterResult<S, V1>
  chain<V, V1, V2>(initial: WriterResult<S, V>, f1: (value: V) => WriterResult<S, V1>, f2: (value: V1) => WriterResult<S, V2>): WriterResult<S, V2>
  chain<R>(initial: WriterResult<S, R>, ...fs: ((value: R) => WriterResult<S, R>)[]): WriterResult<S, R> {
    const result = fs.reduce<R>(
      (accum, f) => this.append(f(accum)),
      this.append(initial),
    );
    return this.wrap(result);
  }

  static createResult<S, V>(state: S, value: V): WriterResult<S, V> {
    return { state, value };
  }
}

export type TypeState = [Message[], VariableReplacement[]];

export interface TypeResult<V> extends WriterResult<TypeState, V> {}

export class TypeWriter extends WriterMonad<TypeState> {
  constructor(public scope: Scope) {
    super(
      TypeWriter.emptyTypeState(),
      ([messages, variableReplacements], [newMessages, newVariableReplacements]) => (
        [[...messages, ...newMessages], [...variableReplacements, ...newVariableReplacements]]
      ),
    );

    this.state = [this.state[0], []];
  }

  get messages() {
    return this.state[0];
  }

  get replacements()  {
    return this.state[1];
  }

  log(message: Message): void {
    this.state = [[...this.messages, message], this.replacements];
  }

  logAll(messages: Message[]): void {
    this.state = [[...this.messages, ...messages], this.replacements];
  }

  recordReplacements(replacements: VariableReplacement[]): void {
    this.state = [this.messages, [...this.replacements, ...replacements]];
  }

  updateScope(newScope: Scope): void {
    this.scope = newScope;
  }

  expandScope(newScope: Scope): void {
    this.scope = expandScope(this.scope, newScope);
  }

  // run<V>(f: (scope: Scope) => TypeResult<V>): V;
  run<V, A extends any[]>(f: (scope: Scope) => (...args: A) => TypeResult<V>): (...args: A) => V {
    return (...args) => this.append(f(this.scope)(...args));
  }

  withChildScope<T>(f: (state: TypeWriter) => T): T {
    const childWriter = new TypeWriter(this.scope);
    const result = f(childWriter);
    this.update(childWriter.state);
    return result;
  }

  static emptyTypeState(): TypeState {
    return [[], []];
  }

  // static wrapEmpty<V>(value: V): TypeResult<V> {
  //   return WriterMonad.createResult(TypeWriter.emptyTypeState(), value);
  // }

  // static wrapWithScope<V>(scope: Scope, value: V): TypeResult<V> {
  //   return WriterMonad.createResult([[], scope], value);
  // }
}

