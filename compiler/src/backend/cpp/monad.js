"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipeRecord = exports.flattenRM = exports.traverseM = exports.sequenceM = exports.flatMapM = exports.mapM = exports.Monad = exports.CombinedState = exports.FState = exports.MapState = exports.ArrayState = exports.State = void 0;
const lodash_1 = require("lodash");
class State {
    constructor(state) {
        this.state = state;
    }
    get() {
        return this.state;
    }
    set(state) {
        this.state = state;
    }
}
exports.State = State;
class ArrayState extends State {
    constructor(state = []) {
        super(state);
    }
    append(value) {
        this.state.push(value);
    }
    concat(values) {
        this.state = this.state.concat(values);
    }
}
exports.ArrayState = ArrayState;
class MapState extends State {
    constructor(state = {}) {
        super(state);
    }
    property(key) {
        return this.state[key];
    }
    setProperty(key, value) {
        this.state[key] = value;
    }
}
exports.MapState = MapState;
class FState extends State {
    constructor(f) {
        super(f);
    }
    apply(...args) {
        return this.get()(...args);
    }
}
exports.FState = FState;
class CombinedState extends State {
    constructor(state) {
        super(state);
    }
    child(key) {
        return this.state[key];
    }
}
exports.CombinedState = CombinedState;
class Monad {
    constructor(f) {
        this.f = f;
    }
    static of(f) {
        return new Monad(f);
    }
    static pure(t) {
        return Monad.of(_ => t);
    }
    run(state) {
        return this.f(state);
    }
}
exports.Monad = Monad;
function mapM(monad, f) {
    return Monad.of(state => f(monad.run(state)));
}
exports.mapM = mapM;
function flatMapM(monad, f) {
    return Monad.of(state => f(monad.run(state)).run(state));
}
exports.flatMapM = flatMapM;
function sequenceM(monads) {
    return monads.reduce((accum, monad) => flatMapM(accum, values => mapM(monad, newValue => [...values, newValue])), Monad.of(_ => []));
}
exports.sequenceM = sequenceM;
function traverseM(values, f) {
    return values.reduce((accum, value) => flatMapM(accum, accumValues => mapM(f(value), newValue => [...accumValues, newValue])), Monad.of(_ => []));
}
exports.traverseM = traverseM;
function flattenRM(record) {
    return mapM(traverseM(lodash_1.toPairs(record), ([key, monad]) => mapM(monad, value => [key, value])), lodash_1.fromPairs);
}
exports.flattenRM = flattenRM;
function pipeRecord(initial, f1, ...fs) {
    if (fs.length === 0) {
        return mapM(flattenRM(initial), f1);
    }
    const operations = [f1, fs.slice(0, -1)];
    const final = fs[fs.length - 1];
    const penultimateResult = operations.reduce((accum, operation) => flatMapM(accum, accumValue => (mapM(flattenRM(operation(accumValue)), newValues => (Object.assign(Object.assign({}, accumValue), newValues))))), flattenRM(initial));
    return mapM(penultimateResult, final);
}
exports.pipeRecord = pipeRecord;
//# sourceMappingURL=monad.js.map