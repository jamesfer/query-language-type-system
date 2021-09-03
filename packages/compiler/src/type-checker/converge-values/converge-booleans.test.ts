import { identifier, booleanLiteral, freeVariable } from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import { Message } from '../types/message';
import { convergeBooleans } from './converge-booleans';
import { ConvergeDirection, ConvergeState } from './converge-types';

describe('convergeBooleans', () => {
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

    it('returns no messages when booleans are equal', () => {
      expect(convergeBooleans(messageState, state, booleanLiteral(true), booleanLiteral(true))).toEqual([]);
      expect(messageState.values).toEqual([]);
    });

    it('returns a message when booleans are not equal', () => {
      expect(convergeBooleans(messageState, state, booleanLiteral(true), booleanLiteral(false))).toEqual([]);
      expect(messageState.values).toEqual([expect.any(String)]);
    });
  });
});
