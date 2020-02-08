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

  it('recognises a dual expression', () => {
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
    expect(parse('implicit a -> implicit b -> c').value).toEqual({
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
    expect(parse('let a = 5 a').value).toEqual({
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
});
