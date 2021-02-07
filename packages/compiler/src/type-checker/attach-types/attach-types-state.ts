import { InferredType } from '../converge-values/converge-types';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { castArray } from 'lodash';


export class AttachTypesState {
  messagesState = new StateRecorder<Message>()
  inferredTypesState = new StateRecorder<InferredType>();

  // append<V>(wrappedValue: [Message[], InferredType[], V]): V {
  //
  // }
  //
  // appendMessages<V>(wrappedValue: [Message[], V]): V {
  //
  // }
  //
  // appendInferredTypes() {
  //
  // }

  log(messages: Message | Message[]): void {
    this.messagesState.push(messages);
  }

  recordInferredTypes(inferredTypes: InferredType[]): void {
    this.inferredTypesState.push(inferredTypes);
  }

  wrap<V>(value: V): [Message[], InferredType[], V] {
    return [this.messagesState.values, this.inferredTypesState.values, value];
  }

  static run<A extends any[], R>(f: (state: AttachTypesState, ...args: A) => R): (...args: A) => [Message[], InferredType[], R] {
    return (...args) => {
      const state = new AttachTypesState();
      return state.wrap(f(state, ...args));
    }
  }

  // run<A1 extends any[], A2 extends any[], A3 extends any[], R>(f: (state: AttachTypesState) => (...a1: A1) => (...a2: A2) => (...a3: A3) => R): (...a1: A1) => (...a2: A2) => (...a3: A3) => [Message[], InferredType[], R];
  // run<A1 extends any[], A2 extends any[], R>(f: (state: AttachTypesState) => (...a1: A1) => (...a2: A2) => R): (...a1: A1) => (...a2: A2) => [Message[], InferredType[], R];
  // run<A1 extends any[], R>(f: (state: AttachTypesState) => (...a1: A1) => R): (...a1: A1) => [Message[], InferredType[], R];
  // run<R>(f: (state: AttachTypesState) => R): [Message[], InferredType[], R];
  // run(f: (state: AttachTypesState) => any): unknown {
  //   const wrapper = (result: any) => {
  //     if (isFunction(result)) {
  //       return (...args: any[]) => {
  //         wrapper(result(...args));
  //       };
  //     }
  //     return [this.messagesState.values, this.inferredTypesState.values]
  //   };
  //   const result = f(this);
  //   if (isFunction(result)) {
  //     return (...args: any[]) => {
  //       result
  //     };
  //   }
  //   return
  // }
}

