import { findMatchingImplementations } from './find-matching-implementation';
import { dataValue, numberLiteral } from '../constructors';
import { Scope } from '../build-scoped-node';

describe('findMatchingImplementation', () => {
  it('can find a matching data type', () => {
    const scope: Scope = {
      bindings: {
        x1: dataValue('X', [numberLiteral(1)]),
      },
    };
    const results = findMatchingImplementations(scope, dataValue('X', [numberLiteral(1)]));
    expect(results).toEqual([
      ['x1', dataValue('X', [numberLiteral(1)])],
    ]);
  });
});
