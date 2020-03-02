import { FunctionExpression, PatternMatchExpression } from '..';
import parse from './parse';

describe('parse', () => {
  it('recognises a number expression', () => {
    expect(parse('5').value).toEqual({
      kind: 'NumberExpression',
      value: 5,
    });
  });

  it.each([
    ['true', true],
    ['false', false],
  ])('recognises a %s boolean expression', (code, value) => {
    expect(parse(code).value).toEqual({
      value,
      kind: 'BooleanExpression',
    });
  });

  it('recognises an identifier', () => {
    expect(parse('a').value).toEqual({
      kind: 'Identifier',
      name: 'a',
    });
  });

  it('recognises a function expression', () => {
    expect(parse('a -> b -> c').value).toEqual({
      kind: 'FunctionExpression',
      implicit: false,
      parameter: {
        kind: 'Identifier',
        name: 'a',
      },
      body: {
        kind: 'FunctionExpression',
        implicit: false,
        parameter: {
          kind: 'Identifier',
          name: 'b',
        },
        body: {
          kind: 'Identifier',
          name: 'c',
        },
      },
    });
  });

  it('recognises an implicit function expression', () => {
    const withMessages = parse('implicit a -> b');
    expect(withMessages.value).toEqual({
      kind: 'FunctionExpression',
      implicit: true,
      parameter: {
        kind: 'Identifier',
        name: 'a',
      },
      body: {
        kind: 'Identifier',
        name: 'b',
      },
    });
  });

  it('recognises an implicit function expression inside an implicit function', () => {
    const withMessages = parse('implicit a -> implicit b -> c');
    expect(withMessages.value).toEqual({
      kind: 'FunctionExpression',
      implicit: true,
      parameter: {
        kind: 'Identifier',
        name: 'a',
      },
      body: {
        kind: 'FunctionExpression',
        implicit: true,
        parameter: {
          kind: 'Identifier',
          name: 'b',
        },
        body: {
          kind: 'Identifier',
          name: 'c',
        },
      },
    });
  });

  it('recognises a binding expression', () => {
    expect(parse('let a = 5\na').value).toEqual({
      kind: 'BindingExpression',
      name: 'a',
      value: {
        kind: 'NumberExpression',
        value: 5,
      },
      body: {
        kind: 'Identifier',
        name: 'a',
      },
    });
  });

  it('recognises a function application in a binding expression', () => {
    const actual = parse('let a = add 5 6\na');
    expect(actual.value).toEqual({
      kind: 'BindingExpression',
      name: 'a',
      value: {
        kind: 'Application',
        callee: {
          kind: 'Application',
          callee: {
            kind: 'Identifier',
            name: 'add',
          },
          parameter: {
            kind: 'NumberExpression',
            value: 5,
          },
        },
        parameter: {
          kind: 'NumberExpression',
          value: 6,
        },
      },
      body: {
        kind: 'Identifier',
        name: 'a',
      },
    });
  });

  it('recognises a dual expression', () => {
    expect(parse('a:10').value).toEqual({
      kind: 'DualExpression',
      left: {
        kind: 'Identifier',
        name: 'a',
      },
      right: {
        kind: 'NumberExpression',
        value: 10,
      },
    });
  });

  it('recognises a record property', () => {
    expect(parse('10.property').value).toEqual({
      kind: 'ReadRecordPropertyExpression',
      property: 'property',
      record: {
        kind: 'NumberExpression',
        value: 10,
      },
    });
  });

  it('recognises a data value property', () => {
    const withMessages = parse('10#10');
    expect(withMessages.value).toEqual({
      kind: 'ReadDataPropertyExpression',
      property: 10,
      dataValue: {
        kind: 'NumberExpression',
        value: 10,
      },
    });
  });

  it('recognises a pattern match expression', () => {
    const withMessages = parse('match 10 | 5 = true | 10 = true | _ = false');
    const expected: PatternMatchExpression = {
      kind: 'PatternMatchExpression',
      value: {
        kind: 'NumberExpression',
        value: 10,
      },
      patterns: [
        {
          test: {
            kind: 'NumberExpression',
            value: 5,
          },
          value: {
            kind: 'BooleanExpression',
            value: true,
          },
        },
        {
          test: {
            kind: 'NumberExpression',
            value: 10,
          },
          value: {
            kind: 'BooleanExpression',
            value: true,
          },
        },
        {
          test: {
            kind: 'Identifier',
            name: '_',
          },
          value: {
            kind: 'BooleanExpression',
            value: false,
          },
        },
      ],
    };
    expect(withMessages.value).toEqual(expected);
  });

  it('correctly applies precedence', () => {
    const expected: FunctionExpression = {
      kind: 'FunctionExpression',
      implicit: false,
      parameter: {
        kind: 'DualExpression',
        left: {
          kind: 'Identifier',
          name: 'a',
        },
        right: {
          kind: 'Identifier',
          name: 'b',
        },
      },
      body: {
        kind: 'NumberExpression',
        value: 1,
      },
    };
    const result = parse('a:b -> 1');
    expect(result.value).toEqual(expected);
  });
});
