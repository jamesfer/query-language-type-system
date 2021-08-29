import {
  booleanLiteral,
  dataValue,
  freeVariable,
  functionType,
  numberLiteral, recordLiteral,
} from '../constructors';
import { Value } from '../types/value';
import { InferredType } from './converge-types';
import { convergeValues } from './converge-values';

describe('convergeValues', () => {
  function converge(left: Value, right: Value) {
    return convergeValues(left, { kind: 'Identifier', name: 'A' }, right, { kind: 'Identifier', name: 'B' });
  }

  it('converges two of the exact same value', () => {
    const [messages, inferredTypes] = converge(booleanLiteral(true), booleanLiteral(true));
    expect(messages).toEqual([]);
    expect(inferredTypes).toEqual([]);
  });

  it('emits a message when the values do not converge', () => {
    const [messages, inferredTypes] = converge(booleanLiteral(false), booleanLiteral(true));
    expect(messages).toHaveLength(1); // TODO better assertion
    expect(inferredTypes).toEqual([]);
  });

  it('allows functions to converge', () => {
    const [messages, inferredTypes] = converge(
      functionType(freeVariable('a'), [booleanLiteral(true)]),
      functionType(numberLiteral(7), [freeVariable('b')]),
    );
    expect(messages).toEqual([]);
    expect(inferredTypes).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'a', to: numberLiteral(7) }),
      expect.objectContaining({ from: 'b', to: booleanLiteral(true) }),
    ]));
  });

  describe('when converging implicit functions', () => {
    function convergeWithShape(other: Value) {
      return converge(
        functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('x')]), true], freeVariable('x')]),
        other,
      );
    }

    it('allows functions with matching implicits to converge', () => {
      const [messages, inferredTypes] = convergeWithShape(
        functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('y')]), true], freeVariable('y')]),
      );
      expect(messages).toEqual([]);
      expect(inferredTypes).toContainEqual(expect.objectContaining({
        from: 'y',
        to: freeVariable('x'),
      }));
    });

    it('prevents functions with missing implicits to converge', () => {
      const [messages, inferredTypes] = convergeWithShape(
        functionType(booleanLiteral(true), [numberLiteral(7)]),
      );
      expect(messages).toEqual([
        expect.any(String),
      ]);
      expect(inferredTypes).toEqual([]);
    });

    it('prevents a function with a more specific implicit parameter from converging', () => {
      const [messages] = convergeWithShape(
        functionType(booleanLiteral(true), [[dataValue('Num', [numberLiteral(7)]), true], numberLiteral(7)]),
      );
      expect(messages).toEqual([
        expect.any(String),
      ]);
    });

    it('infers a variable type containing an implicit parameter', () => {
      const [messages, inferredTypes] = convergeWithShape(freeVariable('p'));
      expect(messages).toHaveLength(0)
      expect(inferredTypes).toContainEqual(expect.objectContaining<Partial<InferredType>>({
        from: 'p',
        to: functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('x')]), true], freeVariable('x')]),
      }));
    })
  });

  describe('when converging complex types', () => {
    it('nested implicit args are not accepted', () => {
      const [messages] = converge(
        recordLiteral({ go: functionType(booleanLiteral(true), [numberLiteral(7)]) }),
        recordLiteral({ go: functionType(booleanLiteral(true), [[numberLiteral(7), true], numberLiteral(7)]) }),
      );
      expect(messages).toEqual([expect.any(String)]);
    });

    it.skip('more specific nested implicit args are accepted', () => {
      const [messages] = converge(
        recordLiteral({
          go: functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('x')]), true], numberLiteral(7)]),
        }),
        recordLiteral({
          go: functionType(booleanLiteral(true), [[dataValue('Num', [numberLiteral(7)]), true], numberLiteral(7)]),
        }),
      );
      expect(messages).toEqual([]);
    });

    it('less specific nested implicit args are accepted', () => {
      const [messages] = converge(
        recordLiteral({
          go: functionType(booleanLiteral(true), [[dataValue('Num', [numberLiteral(7)]), true], numberLiteral(7)]),
        }),
        recordLiteral({
          go: functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('x')]), true], numberLiteral(7)]),
        }),
      );
      expect(messages).toEqual([]);
    });
  });
});
