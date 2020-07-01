"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("./constructors");
const scope_utils_1 = require("./scope-utils");
describe('scope-utils', () => {
    describe('findMatchingImplementations', () => {
        it.each([
            ['integer', 'Integer', { kind: 'NumberLiteral', value: 2 }],
            ['float', 'Float', { kind: 'NumberLiteral', value: 2.2 }],
            ['string', 'String', { kind: 'StringLiteral', value: 'Hello' }],
        ])('finds built in %s implementations', (_, calleeName, parameter) => {
            const emptyScope = constructors_1.scope();
            const value = {
                kind: 'DataValue',
                name: {
                    kind: 'SymbolLiteral',
                    name: calleeName,
                },
                parameters: [parameter],
            };
            const implementations = scope_utils_1.findMatchingImplementations(emptyScope, value);
            expect(implementations).toEqual([{
                    kind: 'ScopeBinding',
                    name: 'BUILT_IN',
                    type: value,
                    scope: emptyScope,
                }]);
        });
        it('finds built in implementations that are wrapped in dual bindings', () => {
            const emptyScope = constructors_1.scope();
            const value = {
                kind: 'DataValue',
                name: {
                    kind: 'SymbolLiteral',
                    name: 'Integer',
                },
                parameters: [{ kind: 'NumberLiteral', value: 2 }],
            };
            const wrapped = {
                kind: 'DualBinding',
                left: {
                    kind: 'FreeVariable',
                    name: 'a',
                },
                right: {
                    kind: 'DualBinding',
                    left: value,
                    right: {
                        kind: 'FreeVariable',
                        name: 'b',
                    },
                },
            };
            const implementations = scope_utils_1.findMatchingImplementations(emptyScope, wrapped);
            expect(implementations).toEqual([{
                    kind: 'ScopeBinding',
                    name: 'BUILT_IN',
                    scope: emptyScope,
                    type: value,
                }]);
        });
        it.each([
            ['integer', 'Integer', { kind: 'NumberLiteral', value: 2 }],
            ['float', 'Float', { kind: 'NumberLiteral', value: 2.2 }],
            ['string', 'String', { kind: 'StringLiteral', value: 'Hello' }],
        ])('finds built in %s implementations that have a free callee', (_, name, parameter) => {
            const emptyScope = constructors_1.scope();
            const value = {
                parameter,
                kind: 'ApplicationValue',
                callee: {
                    kind: 'FreeVariable',
                    name: 'a',
                },
            };
            const implementations = scope_utils_1.findMatchingImplementations(emptyScope, value);
            expect(implementations).toEqual([{
                    kind: 'ScopeBinding',
                    name: 'BUILT_IN',
                    scope: emptyScope,
                    type: {
                        kind: 'DataValue',
                        name: { name, kind: 'SymbolLiteral' },
                        parameters: [parameter],
                    },
                }]);
        });
    });
});
//# sourceMappingURL=scope-utils.test.js.map