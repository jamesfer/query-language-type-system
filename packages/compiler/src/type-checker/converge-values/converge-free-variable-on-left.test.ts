import { freeVariable, identifier, numberLiteral } from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { convergeFreeVariableOnLeft } from './converge-free-variable-on-left';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeFreeVariableOnLeft', () => {
  let messageState: StateRecorder<Message>;
  const partialState = {
    leftExpression: identifier('leftExpression'),
    leftEntireValue: freeVariable('left'),
    rightExpression: identifier('rightExpression'),
    rightEntireValue: freeVariable('right'),
  };

  beforeEach(() => {
    messageState = new StateRecorder<Message>();
  });

  describe.each<ConvergeDirection>(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
    const state = { ...partialState, direction };

    it('returns nothing if both sides are the same free variable', () => {
      expect(convergeFreeVariableOnLeft(messageState, state, freeVariable('x'), freeVariable('x'))).toEqual([]);
      expect(messageState.values).toEqual([]);
    });
  });

  describe('when the right is a different value', () => {
    const right = numberLiteral(7);

    it('converges if the direction is either', () => {
      const state: ConvergeState = { ...partialState, direction: 'either' };
      expect(convergeFreeVariableOnLeft(messageState, state, freeVariable('x'), right)).toEqual([expect.objectContaining({
        from: 'x',
        to: right,
      })]);
      expect(messageState.values).toEqual([]);
    });

    it('returns an error message if the direction is not either', () => {
      const state: ConvergeState = { ...partialState, direction: 'leftSpecific' };
      expect(convergeFreeVariableOnLeft(messageState, state, freeVariable('x'), right)).toEqual([]);
      expect(messageState.values).toEqual([expect.any(String)]);
    });
  });
});
