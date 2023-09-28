import { State } from '../../backend/cpp/monad';

export class MapStateRecorder<K extends string | number, S> extends State<Record<K, S>> {
  constructor(state: Record<K, S> = {} as Record<K, S>) {
    super(state);
  }

  property(key: K): S | undefined {
    return this.state[key];
  }

  setProperty(key: K, value: S): void {
    this.state[key] = value;
  }
}
