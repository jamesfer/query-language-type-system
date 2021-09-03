import { identifier, freeVariable, stringLiteral } from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { convergeStrings } from './converge-strings';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeStrings', () => {
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

    it('returns no messages when strings are equal', () => {
      expect(convergeStrings(messageState, state, stringLiteral('hello'), stringLiteral('hello'))).toEqual([]);
      expect(messageState.values).toEqual([]);
    });

    it('returns a message when strings are not equal', () => {
      expect(convergeStrings(
        messageState,
        state,
        stringLiteral('hello'),
        stringLiteral('hEllo')
      )).toEqual([]);
      expect(messageState.values).toEqual([expect.any(String)]);
    });
  });
});
