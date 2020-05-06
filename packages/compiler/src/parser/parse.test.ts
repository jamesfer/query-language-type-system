import {
  Application,
  Expression,
  FunctionExpression,
  NativeExpression,
  PatternMatchExpression,
} from '..';
import { identifier } from '../type-checker/constructors';
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

  it('recognises a very long function', () => {
    const actual = parse('a -> b -> c -> d -> e -> f -> g -> h -> 1');
    expect(actual.value).toEqual(
      {
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
            kind: 'FunctionExpression',
            implicit: false,
            parameter: {
              kind: 'Identifier',
              name: 'c',
            },
            body: {
              kind: 'FunctionExpression',
              implicit: false,
              parameter: {
                kind: 'Identifier',
                name: 'd',
              },
              body: {
                kind: 'FunctionExpression',
                implicit: false,
                parameter: {
                  kind: 'Identifier',
                  name: 'e',
                },
                body: {
                  kind: 'FunctionExpression',
                  implicit: false,
                  parameter: {
                    kind: 'Identifier',
                    name: 'f',
                  },
                  body: {
                    kind: 'FunctionExpression',
                    implicit: false,
                    parameter: {
                      kind: 'Identifier',
                      name: 'g',
                    },
                    body: {
                      kind: 'FunctionExpression',
                      implicit: false,
                      parameter: {
                        kind: 'Identifier',
                        name: 'h',
                      },
                      body: {
                        kind: 'NumberExpression',
                        value: 1,
                      },
                    }
                  }
                }
              }
            }
          }
        }
      }
    )
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

  it('recognises a record literal', () => {
    expect(parse('{ a = 1, b = 2, }').value).toEqual({
      kind: 'RecordExpression',
      properties: {
        a: {
          kind: 'NumberExpression',
          value: 1,
        },
        b: {
          kind: 'NumberExpression',
          value: 2,
        },
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

  it.skip('recognises a data value property', () => {
    const withMessages = parse('a.10');
    expect(withMessages.value).toEqual({
      kind: 'ReadDataPropertyExpression',
      property: 'a',
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

  it('parses a native expression', () => {
    const result = parse('let a = #{ name = "window", }\na');
    const expected: Expression = {
      kind: 'BindingExpression',
      name: 'a',
      value: {
        kind: 'NativeExpression',
        data: {
          name: 'window',
        },
      },
      body: {
        kind: 'Identifier',
        name: 'a',
      },
    };
    expect(result.value).toEqual(expected);
  });

  it('parses a data expression', () => {
    const result = parse('data T = implicit a, b, c\n5');
    const expected: Expression = {
      kind: 'BindingExpression',
      name: 'T',
      value: {
        kind: 'FunctionExpression',
        implicit: true,
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
            kind: 'FunctionExpression',
            implicit: false,
            parameter: {
              kind: 'Identifier',
              name: 'c',
            },
            body: {
              kind: 'DataInstantiation',
              callee: {
                kind: 'SymbolExpression',
                name: 'T',
              },
              parameters: [
                identifier('b'),
                identifier('c'),
              ],
              parameterShapes: [
                [identifier('a'), true],
                [identifier('b'), false],
                [identifier('c'), false],
              ],
            },
          },
        },
      },
      body: {
        kind: 'NumberExpression',
        value: 5,
      },
    };
    expect(result.value).toEqual(expected);
  });

  it('parses a data expression with no parameters', () => {
    const result = parse('data T\n5');
    const expected: Expression = {
      kind: 'BindingExpression',
      name: 'T',
      value: {
        kind: 'DataInstantiation',
        callee: {
          kind: 'SymbolExpression',
          name: 'T',
        },
        parameters: [
        ],
        parameterShapes: [
        ],
      },
      body: {
        kind: 'NumberExpression',
        value: 5,
      },
    };
    expect(result.value).toEqual(expected);
  });

  it('parses a parenthesis expression', () => {
    const result = parse('a (b c)');
    const expected: Application = {
      kind: 'Application',
      callee: {
        kind: 'Identifier',
        name: 'a',
      },
      parameter: {
        kind: 'Application',
        callee: {
          kind: 'Identifier',
          name: 'b',
        },
        parameter: {
          kind: 'Identifier',
          name: 'c',
        },
      },
    };
    expect(result.value).toEqual(expected);
  });
});
