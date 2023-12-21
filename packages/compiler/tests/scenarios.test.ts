import dedentJs from 'dedent-js';
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
    expect(compilerMessages(dedentJs`
      let a = 10
      5
    `)).toEqual([]);
  });

  it('lets you use let binding', () => {
    expect(compilerMessages(dedentJs`
      let a = 10
      a
    `)).toEqual([]);
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
    expect(compilerMessages(dedentJs`
      let a = x -> y -> 5
      a "Hello" "World"
    `)).toEqual([]);
  });

  it('compiles a partial function call', () => {
    expect(compilerMessages(dedentJs`
      let a = x -> y -> 5
      a "Hello"
    `)).toEqual([]);
  });

  it('errors when a function is called too many times', () => {
    expect(compilerMessages(dedentJs`
      let a = x -> y -> 5
      a "Hello" "World" 10
    `)).toEqual(['Types are different']);
    // `)).toEqual(['Cannot call a NumberLiteral']);
  });

  it('compiles a function with a dual binding parameter', () => {
    expect(compilerMessages('a -> b:10 -> "Hello"')).toEqual([]);
  });

  it('lets you call a function with a dual binding parameter', () => {
    expect(compilerMessages(dedentJs`
      let f = a -> b:10 -> "Hello"
      f 1 10
    `)).toEqual([]);
  });

  it('errors when you call a function with a dual binding parameter with a value that does not match the type', () => {
    expect(compilerMessages(dedentJs`
      let f = a -> b:10 -> "Hello"
      f 1 "Hello"
    `)).toEqual(['Types are different']);
    // `)).toEqual(['Given parameter did not match expected shape']);
  });

  it('errors when you call a function with a dual binding parameter with a value that does not match the value', () => {
    expect(compilerMessages(dedentJs`
      let f = a -> b:10 -> "Hello"
      f 1 5
    `)).toEqual(['Type values are different']);
    // `)).toEqual(['Given parameter did not match expected shape']);
  });

  it('compiles an implicit function', () => {
    expect(compilerMessages(dedentJs`
      data X = x
      let x1 = X 1
      let f = implicit X a -> b -> "Hello"
      5
    `)).toEqual([]);
  });

  it('lets you call an implicit function', () => {
    expect(compilerMessages(dedentJs`
      data X = x
      let x1 = X 1
      let f = implicit X a -> b -> "Hello"
      f 1
    `)).toEqual([]);
  });

  it('does not expect you to provide implicit parameters', () => {
    expect(compilerMessages(dedentJs`
      data X = x
      let x1 = X 1
      let f = implicit X a -> b -> "Hello"
      f "String" "Word"
    `)).toEqual(['Types are different']);
    // `)).toEqual(['Cannot call a StringLiteral']);
  });

  it('errors if it cannot find a value to fill an implicit parameter', () => {
    expect(compilerMessages(dedentJs`
      let f = implicit i:5 -> a -> a
      f "String"
    `)).toEqual(['Could not find a valid set of replacements for implicits']);
  });

  it('allows a let binding to have unfulfilled implicit parameters', () => {
    expect(compilerMessages(dedentJs`
      let f = implicit a -> b -> a
      123
    `)).toEqual([]);
  });

  it('compiles a data declaration with no parameters', () => {
    expect(compilerMessages(dedentJs`
      data Color
      5
    `)).toEqual([]);
  });

  it('compiles a data declaration with one parameter', () => {
    expect(compilerMessages(dedentJs`
      data Color = a
      5
    `)).toEqual([]);
  });

  it('lets you call the data declaration', () => {
    expect(compilerMessages(dedentJs`
      data Color = c
      data Red
      let implementation = Color Red
      5
    `)).toEqual([]);
  });

  it('compiles a data declaration implementation with a constraint', () => {
    expect(compilerMessages(dedentJs`
      data Serial = s
      data Color = implicit Serial t, t
      data Red
      let serialRedImpl = Serial Red
      let colorRedImpl = Color Red
      5
    `)).toEqual([]);
  });

  it('errors if a data declaration parameter does not match its constraints', () => {
    expect(compilerMessages(dedentJs`
      data Serial = s
      data Color = implicit Serial t, t
      data Red
      let colorRedImpl = Color Red
      5
    `)).toEqual(['Could not find a valid set of replacements for implicits']);
  });

  it('errors if a data declaration parameter does not match an existing implementation', () => {
    expect(compilerMessages(dedentJs`
      data Serializable = s
      data Color = implicit Serial t, t
      data Red
      data Green
      let serialGreenImpl = Serializable Green
      let colorRedImpl = Color Red
      5
    `)).toEqual(['Could not find a valid set of replacements for implicits']);
  });

  it.skip('errors when there are two data declarations with the same name', () => {
    expect(compilerMessages(dedentJs`
      data Serial
      data Serial
      5
    `)).toEqual(['A variable with the name Serial already exists']);
  });

  it('errors when there is a data declaration and a let binding with the same name', () => {
    expect(compilerMessages(dedentJs`
      data Serial
      let Serial = 10
      5
    `)).toEqual(['Types are different']);
    // `)).toEqual(['A variable with the name Serial already exists']);
  });

  it('errors when there is a let binding and a data declaration with the same name', () => {
    expect(compilerMessages(dedentJs`
      let Serial = 10
      data Serial
      5
    `)).toEqual(['Types are different']);
    // `)).toEqual(['A variable with the name Serial already exists']);
  });

  it('compiles a polymorphic function call', () => {
    expect(compilerMessages(dedentJs`
      data Color = c
      data Red
      let colorRedImpl = Color Red
      let go = color -> 5
      go Red
    `)).toEqual([]);
  });

  it('compiles a function call with a constraint on a parameter', () => {
    expect(compilerMessages(dedentJs`
      data Color = c
      data Red
      let colorRedImpl = Color Red
      let go = implicit Color color -> color -> 5
      go Red
    `)).toEqual([]);
  });

  it('errors on a function call with a constraint on a parameter that fails', () => {
    expect(compilerMessages(dedentJs`
      data Color = c
      data Red
      let go = implicit Color color -> color -> 5
      go Red
    `)).toEqual(['Could not find a valid set of replacements for implicits']);
  });

  it('compiles a function call with a constraint that also takes a parameter', () => {
    expect(compilerMessages(dedentJs`
      data X
      data Maybe = a
      data Some = t
      let a = Some X
      let maybeSomeImpl = Maybe a
      let go = implicit Maybe m -> m -> 5
      go a
    `)).toEqual([]);
  });

  it('errors on a function call with a constraint that also takes a parameter that is incompatible', () => {
    expect(compilerMessages(dedentJs`
      data X
      data Maybe = a
      data Some = t
      let go = implicit Maybe m -> m -> 5
      let a = Some X
      go a
    `)).toEqual(['Could not find a valid set of replacements for implicits']);
  });

  describe('the built in Integer type', () => {
    it('allows an integer number literal', () => {
      expect(compilerMessages(dedentJs`
        let integerOnly = implicit Integer a -> a -> a
        integerOnly 95
      `)).toEqual([]);
    });

    it('disallows a random data value', () => {
      expect(compilerMessages(dedentJs`
        data T
        let integerOnly = implicit Integer a -> a -> a
        integerOnly T
      `)).toEqual(['Could not find a valid set of replacements for implicits']);
    });

    it('disallows a non-integer number literal', () => {
      expect(compilerMessages(dedentJs`
        let integerOnly = implicit Integer a -> a -> a
        integerOnly 9.5
      `)).toEqual(['Could not find a valid set of replacements for implicits']);
    });
  });

  describe('the built in Float type', () => {
    it('allows an integer number literal', () => {
      expect(compilerMessages(dedentJs`
        let integerOnly = implicit Float a -> a -> a
        95
      `)).toEqual([]);
    });

    it('allows a decimal number literal', () => {
      expect(compilerMessages(dedentJs`
        let floatOnly = implicit Float a -> a -> a
        floatOnly 9.5
      `)).toEqual([]);
    });

    it('disallows a random data value', () => {
      expect(compilerMessages(dedentJs`
        data T
        let floatOnly = implicit Float a -> a -> a
        floatOnly T
      `)).toEqual(['Could not find a valid set of replacements for implicits']);
    });
  });

  describe('the built in String type', () => {
    it('allows a string literal', () => {
      expect(compilerMessages(dedentJs`
        let stringOnly = implicit String a -> a -> a
        stringOnly "Hello"
      `)).toEqual([]);
    });

    it('disallows a number literal', () => {
      expect(compilerMessages(dedentJs`
        let stringOnly = implicit String a -> a -> a
        stringOnly 95
      `)).toEqual(['Could not find a valid set of replacements for implicits']);
    });

    it('disallows a random data value', () => {
      expect(compilerMessages(dedentJs`
        data T
        let stringOnly = implicit String a -> a -> a
        stringOnly T
      `)).toEqual(['Could not find a valid set of replacements for implicits']);
    });
  });

  describe('the built in equals function', () => {
    // This is blocked on allowing a function to "return" implicits. The equals function
    // returns "a" which is a Boolean, but there is no way for the function to provide
    // the implicits to the outer world.
    it.skip('allows partial application', () => {
      expect(compilerMessages(dedentJs`
        let partialEquals = equals 5
        partialEquals 3
      `)).toEqual([]);
    });
  });
});
