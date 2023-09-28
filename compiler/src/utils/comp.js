"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chain = exports.Applicative = exports.Pointed = exports.Functor = exports.run = exports.chain = exports.ap = exports.map = exports.of = exports.URI = void 0;
const ChainRec_1 = require("fp-ts/ChainRec");
const Either_1 = require("fp-ts/Either");
const function_1 = require("fp-ts/function");
exports.URI = 'Comp';
const compFlatMap = (child, f) => ({
    child,
    f,
    _tag: 'CompFlatMap',
});
const compPure = (value) => ({ value, _tag: 'CompPure' });
const _map = (ma, f) => compFlatMap(ma, function_1.flow(f, exports.of));
const _ap = (mab, ma) => compFlatMap(mab, (fab) => compFlatMap(ma, function_1.flow(fab, exports.of)));
const _chain = compFlatMap;
exports.of = compPure;
exports.map = (f) => (ma) => _map(ma, f);
exports.ap = (ma) => (mab) => _ap(mab, ma);
exports.chain = (f) => (ma) => _chain(ma, f);
function run(comp) {
    const queue = [];
    return ChainRec_1.tailRec(comp, (current) => {
        switch (current._tag) {
            case 'CompPure':
                return queue.length === 0
                    ? Either_1.right(current.value)
                    : Either_1.left(queue.pop()(current.value));
            case 'CompFlatMap':
                queue.push(current.f);
                return Either_1.left(current.child);
        }
    });
}
exports.run = run;
exports.Functor = {
    URI: exports.URI,
    map: _map,
};
exports.Pointed = {
    URI: exports.URI,
    of: exports.of,
};
exports.Applicative = {
    URI: exports.URI,
    of: exports.of,
    map: _map,
    ap: _ap
};
exports.Chain = {
    URI: exports.URI,
    ap: _ap,
    map: _map,
    chain: _chain,
};
//# sourceMappingURL=comp.js.map