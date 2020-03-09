import { compile } from '../src';

function compilerMessages(code: string) {
  const { messages } = compile(code);
  return messages;
}

describe('Scenarios', () => {
  it('compiles a single number', () => {
    expect(compilerMessages('5')).toEqual([]);
  });

  it('compiles a single string', () => {
    expect(compilerMessages('"Hello"')).toEqual([]);
  });

  it.each([true, false])('compiles a boolean %s', (value) => {
    expect(compilerMessages(`${value}`)).toEqual([]);
  });

  it('compiles a let binding', () => {
    expect(compilerMessages('let a = 10\n5')).toEqual([]);
  });

  it('lets you use let binding', () => {
    expect(compilerMessages('let a = 10\na')).toEqual([]);
  });

  it('compiles a record literal', () => {
    expect(compilerMessages('{ a = 1, b = 2, }')).toEqual([]);
  });

  it('compiles a dual binding expression', () => {
    expect(compilerMessages('123:a')).toEqual([]);
  });

  it('compiles a function', () => {
    expect(compilerMessages('a -> b -> 5')).toEqual([]);
  });

  it('lets you use a function parameter in its body', () => {
    expect(compilerMessages('a -> a')).toEqual([]);
  });

  it('compiles a function call', () => {
    expect(compilerMessages('let a = a -> b -> 5\na "Hello" "World"')).toEqual([]);
  });

  it('compiles a partial function call', () => {
    expect(compilerMessages('let a = a -> b -> 5\na "Hello"')).toEqual([]);
  });

  it('errors when a function is called too many times', () => {
    expect(compilerMessages('let a = a -> b -> 5\na "Hello" "World" 10')).toEqual([
      'Cannot call a NumberLiteral',
    ]);
  });

  it('compiles a function with a dual binding parameter', () => {
    expect(compilerMessages('a -> b:10 -> "Hello"')).toEqual([]);
  });

  it('lets you call a function with a dual binding parameter', () => {
    expect(compilerMessages('let f = a -> b:10 -> "Hello"\nf 1 10')).toEqual([]);
  });

  it('errors when you call a function with a dual binding parameter with a value that does not match the type', () => {
    expect(compilerMessages('let f = a -> b:10 -> "Hello"\nf 1 "Hello"')).toEqual([
      'Given parameter did not match expected shape',
    ]);
  });

  it('errors when you call a function with a dual binding parameter with a value that does not match the value', () => {
    expect(compilerMessages('let f = a -> b:10 -> "Hello"\nf 1 5')).toEqual([
      'Given parameter did not match expected shape',
    ]);
  });

  it('compiles an implicit function', () => {
    expect(compilerMessages('let x = 1\nlet f = implicit a -> b -> "Hello"\n5')).toEqual([]);
  });

  it('lets you call an implicit function', () => {
    expect(compilerMessages('let x = 1\nlet f = implicit a -> b -> "Hello"\nf "String"')).toEqual([]);
  });

  it('does not expect you to provide implicit parameters', () => {
    expect(compilerMessages('let x = 1\nlet f = implicit a -> b -> "Hello"\nf "String" "Word"')).toEqual([
      'Cannot call a StringLiteral',
    ]);
  });

  it('errors if it cannot find a value to fill an implicit parameter', () => {
    expect(compilerMessages('let f = implicit a:5 -> b -> a\nf "String"')).toEqual([
      'Could not find a valid set of replacements for implicits',
    ])
  });

  it('allows a let binding to have unfulfilled implicit parameters', () => {
    expect(compilerMessages('let f = implicit a -> b -> a\n123')).toEqual([]);
  });

  it('compiles a data declaration with no parameters', () => {
    expect(compilerMessages('data Color\n5')).toEqual([]);
  });

  it('compiles a data declaration with one parameter', () => {
    expect(compilerMessages('data Color = a\n5')).toEqual([]);
  });

  it('lets you call the data declaration', () => {
    expect(compilerMessages('data Color = c\ndata Red\nlet implementation = Color Red\n5')).toEqual([]);
  });

  it('compiles a data declaration implementation with a constraint', () => {
    expect(compilerMessages(
      `data Serial = s
data Color = implicit Serial t, t
data Red
let serialRedImpl = Serial Red
let colorRedImpl = Color Red
5
`
    )).toEqual([]);
  });

  it('errors if a data declaration parameter does not match its constraints', () => {
    expect(compilerMessages(
`data Serial = s
data Color = implicit Serial t, t
data Red
let colorRedImpl = Color Red
5
`
    )).toEqual(['Could not find a valid set of replacements for implicits']);
  });

  it('errors if a data declaration parameter does not match an existing implementation', () => {
    expect(compilerMessages(
`data Serial = s
data Color = implicit Serial t, t
data Red
data Green
let serialGreenImpl = Serial Green
let colorRedImpl = Color Red
5
`
    )).toEqual(['Could not find a valid set of replacements for implicits']);
  });

  it('errors when there are two data declarations with the same name', () => {
    expect(compilerMessages(
`data Serial
data Serial
5`
    )).toEqual(['A variable with the name Serial already exists']);
  });

  it('errors when there is a data declaration and a let binding with the same name', () => {
    expect(compilerMessages(
`data Serial
let Serial = 10
5`
    )).toEqual(['A variable with the name Serial already exists']);
  });

  it('errors when there is a let binding and a data declaration with the same name', () => {
    expect(compilerMessages(
`let Serial = 10
data Serial
5`
    )).toEqual(['A variable with the name Serial already exists']);
  });

  it('compiles a polymorphic function call', () => {
    expect(compilerMessages(
`data Color = c
data Red
let colorRedImpl = Color Red
let go = color -> 5
go Red`
    )).toEqual([]);
  });

  it('compiles a function call with a constraint on a parameter', () => {
    expect(compilerMessages(
`data Color = c
data Red
let colorRedImpl = Color Red
let go = implicit Color color -> color -> 5
go Red`
    )).toEqual([]);
  });

  it('errors on a function call with a constraint on a parameter that fails', () => {
    expect(compilerMessages(
`data Color = c
data Red
let go = implicit Color color -> color -> 5
go Red`
    )).toEqual(['Could not find a valid set of replacements for implicits']);
  });

  it('compiles a function call with a constraint that also takes a parameter', () => {
    expect(compilerMessages(
`data String
data Maybe = a
data Some = t
let a = Some String
let maybeSomeImpl = Maybe a
let go = implicit Maybe m -> m -> 5
go a`
    )).toEqual([]);
  });

  it('errors on a function call with a constraint that also takes a parameter that is incompatible', () => {
    expect(compilerMessages(
`data String
data Maybe = a
data Some = t
let go = implicit Maybe m -> m -> 5
let a = Some String
go a`
    )).toEqual(['Could not find a valid set of replacements for implicits']);
  });

  it.skip('compiles a real test', () => {

  });
});
