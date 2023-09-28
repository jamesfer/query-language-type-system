import { State } from '../../backend/cpp/monad';
export declare class MapStateRecorder<K extends string | number, S> extends State<Record<K, S>> {
    constructor(state?: Record<K, S>);
    property(key: K): S | undefined;
    setProperty(key: K, value: S): void;
}
//# sourceMappingURL=map-state-recorder.d.ts.map