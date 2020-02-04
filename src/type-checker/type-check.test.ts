import { uniqueId } from 'lodash';
import { runTypePhase } from './run-type-phase';
import { stripNode } from './strip-nodes';
import { typeExpression } from './type-check';
import {
  apply,
  data,
  lambda,
  implement,
  record,
  numberExpression,
  evaluationScope,
  bind,
  dual, dataInstantiation, identifier, readRecordProperty,
} from './constructors';
import { evaluateExpression, simplify } from './evaluate';
import { pipe } from './utils';

describe('typeExpression', () => {
  const blank = numberExpression(1);

  it('typeExpressions a simple declaration', () => {
    const [messages] = runTypePhase(data('Color', ['c'])(blank));
    expect(messages).toEqual([]);
  });

  it('typeExpressions a declaration with children', () => {
    const [messages] = runTypePhase(pipe(
      data('Color', ['c']),
      data('Red'),
      implement('Color', ['Red']),
      blank,
    ));
    expect(messages).toEqual([]);
  });

  it('fails on an implement declaration when children do not match the constraints', () => {
    const [messages] = runTypePhase(pipe(
      data('Serial', ['s']),
      bind('Color', lambda([[apply('Serial', ['t']), true], 't'], dataInstantiation('Color', [identifier('t')]))),
      data('Red'),
      implement('Color', ['Red']),
      blank,
    ));
    expect(messages).toEqual([expect.any(String)]);
  });

  it('fails when children do not match an existing implementation', () => {
    const [messages] = runTypePhase(pipe(
      data('Serial', ['c']),
      // data('Color', ['c'], [apply('Serial', ['c']), 'c']),
      bind('Color', lambda([[apply('Serial', ['t']), true], 't'], dataInstantiation('Color', [identifier('t')]))),
      data('Red'),
      data('Green'),
      implement('Serial', ['Green']),
      implement('Color', ['Red']),
      blank,
    ));
    expect(messages).toEqual([expect.any(String)]);
  });

  it('fails when there are multiple data declarations with the same callee', () => {
    const [messages] = runTypePhase(pipe(
      data('Serial'),
      data('Serial'),
      blank,
    ));
    expect(messages).toEqual([expect.any(String)]);
  });

  it('fails when there is a data declaration and variable binding with the same callee', () => {
    const [messages] = runTypePhase(pipe(
      data('Serial'),
      bind('Serial', blank),
      blank,
    ));
    expect(messages).toEqual([expect.any(String)]);
  });

  it('fails when there is a variable binding and data declaration with the same callee', () => {
    const [messages] = runTypePhase(pipe(
      bind('Serial', blank),
      data('Serial'),
      blank,
    ));
    expect(messages).toEqual([expect.any(String)]);
  });

  it('typeExpressions a polymorphic function call', () => {
    const [messages] = runTypePhase(pipe(
      data('Color', ['c']),
      data('Red'),
      implement('Color', ['Red']),
      bind('go', lambda(['color'], 5)),
      apply('go', ['Red']),
    ));
    expect(messages).toEqual([]);
  });

  it('typeExpressions a function call with a constraint on a parameter', () => {
    const [messages] = runTypePhase(pipe(
      data('Color', ['c']),
      data('Red'),
      implement('Color', ['Red']),
      bind('go', lambda([[apply('Color', ['color']), true], 'color'], 5)),
      apply('go', ['Red']),
    ));
    expect(messages).toEqual([]);
  });

  it('fails a function call with parameter that does not match its constraint', () => {
    const [messages] = runTypePhase(pipe(
      data('Color', ['c']),
      data('Red'),
      bind('go', lambda([[apply('Color', ['color']), true], 'color'], 5)),
      apply('go', ['Red']),
    ));
    expect(messages).toEqual([expect.any(String)]);
  });

  it('passes a function call with a parameter that also takes a parameter', () => {
    const [messages] = runTypePhase(pipe(
      data('String'),
      data('Maybe', ['c']),
      data('Some', ['a']),
      implement('Maybe', [apply('Some', ['String'])]),
      bind('go', lambda([[apply('Maybe', ['maybe']), true], 'maybe'], 5)),
      apply('go', [apply('Some', ['String'])]),
    ));
    expect(messages).toEqual([]);
  });

  it('fails a function call with a parameter that also takes a parameter but it is incompatible', () => {
    const [messages] = runTypePhase(pipe(
      data('String'),
      data('Maybe', ['c']),
      data('Some', ['a']),
      bind('go', lambda([[apply('Maybe', ['maybe']), true], 'maybe'], 5)),
      apply('go', [apply('Some', ['String'])]),
    ));
    expect(messages).toEqual([expect.any(String)]);
  });

  describe('a real test', () => {
    const expression = pipe(
      data('Int', ['c']),
      // Declare type class
      bind('Serializable', lambda(
        [
          'a',
          dual('c', record({
            valueOf: lambda(
              [
                [dataInstantiation('Int', ['result']), true],
                [dataInstantiation('a', ['object']), true],
                'object',
              ],
              'result',
            ),
          })),
        ],
        dataInstantiation('Serializable', ['a', 'c']),
      )),
      // data('Serializable', ['a', 'c'], [
      //   'a',
      //   dual('c', record({
      //     valueOf: lambda(
      //       [
      //         [apply('Int', ['result']), true],
      //         [apply('a', ['object']), true],
      //         'object',
      //       ],
      //       'result',
      //     ),
      //   }))
      // ]),

      // Declare usable implementation of type class
      bind('valueOf', lambda(
        [
          [apply('Serializable', ['a', 'z']), true],
          [dataInstantiation('a', ['object']), true],
          // TODO if functions were correctly curried in all places, then we probably wouldn't need
          //      to accept an 'value' parameter here, which would mean this method acts kind of
          //      like a "summon" method which is cool.
          'object',
        ],
        apply(readRecordProperty('z', 'valueOf'), ['object']),
      )),
      // Implement type class
      data('Color', ['c']),
      data('Red'),
      implement('Color', ['Red']),
      implement('Serializable', [apply('Color', ['t']), record({
        valueOf: lambda(
          ['color'],
          10,
        ),
      })]),
      // bind(uniqueId(`SerializeImplementation`), apply(identifier('Serialize'), [apply('Color', ['t']), record({
      //   valueOf: lambda(
      //     ['color'],
      //     10,
      //   ),
      // })])),
      apply('valueOf', ['Red']),
    );

    it('type typeExpression', () => {
      const [messages] = runTypePhase(expression);
      expect(messages).toEqual([]);
    });

    it('real evaluate test', () => {
      const [, node] = runTypePhase(expression);
      expect(node).toBeDefined();

      const resolvedExpression = stripNode(node);
      const result = evaluateExpression(evaluationScope())(resolvedExpression);
      expect(result).toBeDefined();

      if (result) {
        expect(simplify(result)).toEqual({
          kind: 'NumberLiteral',
          value: 10,
        });
      }
    });
  });
});
