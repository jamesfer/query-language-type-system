"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const find_matching_implementation_1 = require("./find-matching-implementation");
const constructors_1 = require("../constructors");
describe('findMatchingImplementation', () => {
    it('can find a matching data type', () => {
        const scope = {
            bindings: {
                x1: constructors_1.dataValue('X', [constructors_1.numberLiteral(1)]),
            },
        };
        const results = find_matching_implementation_1.findMatchingImplementations(scope, constructors_1.dataValue('X', [constructors_1.numberLiteral(1)]));
        expect(results).toEqual([
            ['x1', constructors_1.dataValue('X', [constructors_1.numberLiteral(1)])],
        ]);
    });
});
//# sourceMappingURL=find-matching-implementation.test.js.map