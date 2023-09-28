import { identifier, freeVariable, numberLiteral } from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { convergeNumbers } from './converge-numbers';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeNumbers', () => {
  describe.each<ConvergeDirection>(['either', 'leftSpecific'])('when the direction is %s', (direction) => {
    let messageState: StateRecorder<Message>;
    const state: ConvergeState = {
      direction,
      leftExpression: identifier('leftExpression'),
      leftEntireValue: freeVariable('left'),
      rightExpression: identifier('rightExpression'),
      rightEntireValue: freeVariable('right'),
    };

    beforeEach(() => {
      messageState = new StateRecorder<Message>();
    });

    it('returns no messages when numbers are equal', () => {
      expect(convergeNumbers(messageState, state, numberLiteral(7), numberLiteral(7))).toEqual([]);
      expect(messageState.values).toEqual([]);
    });

    it('returns a message when numbers are not equal', () => {
      expect(convergeNumbers(messageState, state, numberLiteral(7), numberLiteral(8))).toEqual([]);
      expect(messageState.values).toEqual([expect.any(String)]);
    });
  });
});
