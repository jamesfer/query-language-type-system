import { desugar } from '../desugar/desugar';
import { stripDesugaredNodeWithoutPatternMatch } from '../desugar/desugar-pattern-match';
import parse from '../parser/parse';
import { attachPrelude } from '../prelude/attach-prelude';
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
  dual,
  readRecordProperty,
} from './constructors';
import { evaluateExpression, simplify } from './evaluate';
import { pipe } from './utils';
import dedent from 'dedent-js';

function parseAndType(code: string) {
  const { value: expression } = parse(code);
  if (!expression) {
    throw new Error('Failed to parse code');
  }

  return runTypePhase(expression);
}

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
      data('Color', ['t'], [[apply('Serial', ['t']), true], 't']),
      // bind('Color', lambda([[apply('Serial', ['t']), true], 't'], dataInstantiation('Color', [identifier('t')]))),
      data('Red'),
      implement('Color', ['Red']),
      blank,
    ));
    expect(messages).toEqual([expect.any(String)]);
  });

  it('fails when children do not match an existing implementation', () => {
    const [messages] = runTypePhase(pipe(
      data('Serial', ['c']),
      data('Color', ['t'], [[apply('Serial', ['t']), true], 't']),
      // bind('Color', lambda([[apply('Serial', ['t']), true], 't'], dataInstantiation('Color', [identifier('t')]))),
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

  it('fails if a parameter is filled with two distinct types', () => {
    // data List = a c
    // data ListElement = implicit elementType element, element, implicit List elementType tail, tail
    // data ListEmpty
    // let listElementImpl = implicit elementType -> implicit elementType element -> element -> implicit List elementType tail -> tail -> List elementType (ListElement element tail)
    // let listEmptyImpl = implicit elementType -> List elementType ListEmpty
    // ListElement 5 (ListElement true ListEmpty)
    const [messages] = runTypePhase(pipe(
      data('A', ['a', 'a']),
      apply('A', [true, 1]),
    ));
    expect(messages).toEqual([expect.any(String)]);
  });

  it('passes when there are two dependent implicit parameters', () => {
    const [messages] = parseAndType(dedent`
      data X = c
      data XValue
      data XValue2
      let xImpl = X XValue
      let xImpl2 = X XValue2
      data Example = implicit F a, implicit F b, a, b
      Example XValue XValue2
    `);
    expect(messages).toEqual([]);
  });

  it('fails if a value cannot be found to match two dependent implicit parameters', () => {
    const [messages] = parseAndType(dedent`
      data X = c
      data XValue
      data Y = c
      data YValue
      let xImpl = X XValue
      let yImpl = Y YValue
      data Example = implicit F a, implicit F b, a, b
      Example XValue YValue
    `);
    expect(messages).toEqual([expect.any(String)]);
  });

  it('creates a list from the same types', () => {
    const [messages] = parseAndType(dedent`
      data List = elementType, child
      data ListElement = implicit elementType element, implicit List elementType tail, element, tail
      data ListEmpty
      let listElementImpl = implicit elementType -> implicit elementType element -> implicit List elementType tail -> implicit element -> implicit tail -> List elementType (ListElement element tail)
      let listEmptyImpl = implicit elementType -> List elementType ListEmpty
      ListElement 5 (ListElement 2 ListEmpty) 
    `);
    expect(messages).toEqual([]);
  });

  it('fails to create a list from different types', () => {
    const [messages] = parseAndType(dedent`
      data List = elementType, child
      data ListElement = implicit elementType element, implicit List elementType tail, element, tail
      data ListEmpty
      let listElementImpl = implicit elementType -> implicit elementType element -> implicit List elementType tail -> implicit element -> implicit tail -> List elementType (ListElement element tail)
      let listEmptyImpl = implicit elementType -> List elementType ListEmpty
      ListElement 5 (ListElement true ListEmpty) 
    `);
    expect(messages).toEqual([expect.any(String)]);
  });

  it('infers the type of a destructured parameter', () => {
    const [messages] = parseAndType(dedent`
      data Struct = { value = implicit Int n -> n, }
      let valueOf = Struct z -> z.value
      1
    `);
    expect(messages).toEqual([]);
  });

  describe('a real test', () => {


    // data Int = c
    // data Serializable = a, { valueOf = implicit Int result -> implicit a object -> object -> result, }
    // let valueOf = implicit Serializable (a object) z -> a object -> object -> z.valueOf object
    // data Color = c
    // data Red
    // let colorRedImpl = Color Red
    // let SerializableColorImpl = Serializable (Color t) { valueOf = color -> 10, }
    // valueOf Red

    // const code = dedent`
    //   data Serializable = a, b
    //   data Color = c
    //   let b = Serializable (Color t) { valueOf = f -> 10, }
    //   5
    // `;


    // const expression = pipe(
    //   data('Int', ['c']),
    //   // Declare type class
    //   data('Serializable', ['a', 'c'], ['a', dual('c', record({
    //     valueOf: lambda(
    //       [
    //         [apply('Int', ['result']), true],
    //         [apply('a', ['object']), true],
    //         'object',
    //       ],
    //       'result',
    //     ),
    //   }))]),
    //   // bind('Serializable', lambda(
    //   //   [
    //   //     'a',
    //   //     dual('c', record({
    //   //       valueOf: lambda(
    //   //         [
    //   //           [apply('Int', ['result']), true],
    //   //           [apply('a', ['object']), true],
    //   //           'object',
    //   //         ],
    //   //         'result',
    //   //       ),
    //   //     })),
    //   //   ],
    //   //   apply('Serializable', ['a', 'c']),
    //   // )),
    //   // Declare usable implementation of type class
    //   bind('valueOf', lambda(
    //     [
    //       [apply('Serializable', [apply('a', ['object']), 'z']), true],
    //       [apply('a', ['object']), true],
    //       // TODO if functions were correctly curried in all places, then we probably wouldn't need
    //       //      to accept an 'value' parameter here, which would mean this method acts kind of
    //       //      like a "summon" method which is cool.
    //       'object',
    //     ],
    //     apply(readRecordProperty('z', 'valueOf'), ['object']),
    //   )),
    //   // Implement type class
    //   data('Color', ['c']),
    //   data('Red'),
    //   implement('Color', ['Red']),
    //   implement('Serializable', [apply('Color', ['t']), record({
    //     valueOf: lambda(
    //       ['color'],
    //       10,
    //     ),
    //   })]),
    //   apply('valueOf', ['Red']),
    // );

    // TODO I think "Serializable (Color t) ..." needs to be "Serializable Color ..."
    const code = dedent`
      data Int = c
      data Serializable = a, { valueOf = implicit Int result -> implicit a object -> object -> result, }
      let valueOf = implicit Serializable (a object) z -> implicit a object -> object -> z.valueOf object
      data Color = c
      data Red
      let colorRedImpl = Color Red
      let SerializableColorImpl = Serializable (Color t) { valueOf = color -> 10, }
      valueOf Red
    `;

    it('type typeExpression', () => {
      const { value: expression } = parse(code);
      expect(expression).toBeDefined();
      const [messages] = runTypePhase(expression!);
      expect(messages).toEqual([]);
    });

    it('real evaluate test', () => {
      const { value: expression } = parse(code);
      expect(expression).toBeDefined();
      const [, node] = runTypePhase(expression!);
      expect(node).toBeDefined();

      const resolvedExpression = stripDesugaredNodeWithoutPatternMatch(desugar(node));
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
