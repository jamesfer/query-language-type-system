import { scope } from './constructors';
import { findMatchingImplementations } from './scope-utils';
import { DualBinding, Value } from './types/value';

describe('scope-utils', () => {
  describe('findMatchingImplementations', () => {
    it.each<[string, string, Value]>([
      ['integer', 'Integer', { kind: 'NumberLiteral', value: 2 }],
      ['float', 'Float', { kind: 'NumberLiteral', value: 2.2 }],
      ['string', 'String', { kind: 'StringLiteral', value: 'Hello' }],
    ])('finds built in %s implementations', (_, calleeName, parameter) => {
      const emptyScope = scope();
      const value: Value = {
        kind: 'DataValue',
        name: {
          kind: 'SymbolLiteral',
          name: calleeName,
        },
        parameters: [parameter],
      };
      const implementations = findMatchingImplementations(emptyScope, value);
      expect(implementations).toEqual([{
        kind: 'ScopeBinding',
        name: 'BUILT_IN',
        type: value,
        scope: emptyScope,
      }]);
    });

    it('finds built in implementations that are wrapped in dual bindings', () => {
      const emptyScope = scope();
      const value: Value = {
        kind: 'DataValue',
        name: {
          kind: 'SymbolLiteral',
          name: 'Integer',
        },
        parameters: [{ kind: 'NumberLiteral', value: 2 }],
      };
      const wrapped: DualBinding = {
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
      const implementations = findMatchingImplementations(emptyScope, wrapped);
      expect(implementations).toEqual([{
        kind: 'ScopeBinding',
        name: 'BUILT_IN',
        scope: emptyScope,
        type: value,
      }]);
    });

    it.each<[string, string, Value]>([
      ['integer', 'Integer', { kind: 'NumberLiteral', value: 2 }],
      ['float', 'Float', { kind: 'NumberLiteral', value: 2.2 }],
      ['string', 'String', { kind: 'StringLiteral', value: 'Hello' }],
    ])('finds built in %s implementations that have a free callee', (_, name, parameter) => {
      const emptyScope = scope();
      const value: Value = {
        parameter,
        kind: 'ApplicationValue',
        callee: {
          kind: 'FreeVariable',
          name: 'a',
        },
      };
      const implementations = findMatchingImplementations(emptyScope, value);
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
