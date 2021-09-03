import {
  booleanLiteral,
  dataValue,
  freeVariable,
  functionType,
  numberLiteral, recordLiteral,
} from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { Value } from '../types/value';
import { InferredType } from './converge-types';
import { convergeValues } from './converge-values';

describe('convergeValues', () => {
  let messageState: StateRecorder<Message>;
  function converge(left: Value, right: Value) {
    return convergeValues(messageState, left, { kind: 'Identifier', name: 'A' }, right, { kind: 'Identifier', name: 'B' });
  }

  beforeEach(() => {
    messageState = new StateRecorder<Message>();
  });

  it('converges two of the exact same value', () => {
    expect(converge(booleanLiteral(true), booleanLiteral(true))).toEqual([]);
    expect(messageState.values).toEqual([]);
  });

  it('emits a message when the values do not converge', () => {
    expect(converge(booleanLiteral(false), booleanLiteral(true))).toEqual([]);
    expect(messageState.values).toEqual([expect.any(String)]); // TODO better assertion
  });

  it('allows functions to converge', () => {
    expect(converge(
      functionType(freeVariable('a'), [booleanLiteral(true)]),
      functionType(numberLiteral(7), [freeVariable('b')]),
    )).toEqual(expect.arrayContaining([
      expect.objectContaining({ from: 'a', to: numberLiteral(7) }),
      expect.objectContaining({ from: 'b', to: booleanLiteral(true) }),
    ]));
    expect(messageState.values).toEqual([]);
  });

  describe('when converging implicit functions', () => {
    function convergeWithShape(other: Value) {
      return converge(
        functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('x')]), true], freeVariable('x')]),
        other,
      );
    }

    it('allows functions with matching implicits to converge', () => {
      expect(convergeWithShape(
        functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('y')]), true], freeVariable('y')]),
      )).toContainEqual(expect.objectContaining({
        from: 'y',
        to: freeVariable('x'),
      }));
      expect(messageState.values).toEqual([]);
    });

    it('prevents functions with missing implicits to converge', () => {
      expect(convergeWithShape(
        functionType(booleanLiteral(true), [numberLiteral(7)]),
      )).toEqual([]);
      expect(messageState.values).toEqual([expect.any(String)]);
    });

    it('prevents a function with a more specific implicit parameter from converging', () => {
      convergeWithShape(
        functionType(booleanLiteral(true), [[dataValue('Num', [numberLiteral(7)]), true], numberLiteral(7)]),
      );
      expect(messageState.values).toEqual([expect.any(String)]);
    });

    it('infers a variable type containing an implicit parameter', () => {
      expect(convergeWithShape(freeVariable('p'))).toContainEqual(expect.objectContaining<Partial<InferredType>>({
        from: 'p',
        to: functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('x')]), true], freeVariable('x')]),
      }));
      expect(messageState.values).toHaveLength(0)
    })
  });

  describe('when converging complex types', () => {
    it('nested implicit args are not accepted', () => {
      converge(
        recordLiteral({ go: functionType(booleanLiteral(true), [numberLiteral(7)]) }),
        recordLiteral({ go: functionType(booleanLiteral(true), [[numberLiteral(7), true], numberLiteral(7)]) }),
      );
      expect(messageState.values).toEqual([expect.any(String)]);
    });

    it.skip('more specific nested implicit args are accepted', () => {
      converge(
        recordLiteral({
          go: functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('x')]), true], numberLiteral(7)]),
        }),
        recordLiteral({
          go: functionType(booleanLiteral(true), [[dataValue('Num', [numberLiteral(7)]), true], numberLiteral(7)]),
        }),
      );
      expect(messageState.values).toEqual([]);
    });

    it('less specific nested implicit args are accepted', () => {
      converge(
        recordLiteral({
          go: functionType(booleanLiteral(true), [[dataValue('Num', [numberLiteral(7)]), true], numberLiteral(7)]),
        }),
        recordLiteral({
          go: functionType(booleanLiteral(true), [[dataValue('Num', [freeVariable('x')]), true], numberLiteral(7)]),
        }),
      );
      expect(messageState.values).toEqual([]);
    });
  });
});
