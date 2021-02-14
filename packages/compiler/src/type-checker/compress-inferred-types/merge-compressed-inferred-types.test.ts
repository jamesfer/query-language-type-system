import { booleanLiteral, dataValue, freeVariable, functionType, identifier, numberLiteral, stringLiteral } from '../constructors';
import { Value } from '../types/value';
import { CompressedInferredType, mergeCompressedInferredTypes } from './merge-compressed-inferred-types';

describe('mergeCompressedInferredTypes', () => {
  function makeCIT(expressionName: string, to: Value): CompressedInferredType {
    return {
      to,
      sources: [{
        to,
        originatingExpression: identifier(`${name}Originating`),
        inferringExpression: identifier(`${name}Inferring`),
      }],
    };
  }

  it('appends inferred types for different variables', () => {
    const a: CompressedInferredType = {
      to: booleanLiteral(true),
      sources: [{
        to: booleanLiteral(true),
        originatingExpression: identifier('originating'),
        inferringExpression: identifier('inferring'),
      }],
    };
    const b: CompressedInferredType = {
      to: numberLiteral(7),
      sources: [{
        to: numberLiteral(7),
        originatingExpression: identifier('originating'),
        inferringExpression: identifier('inferring'),
      }],
    };
    const [messages, compressed] = mergeCompressedInferredTypes([{ a }, { b }]);
    expect(messages).toEqual([]);
    expect(compressed).toEqual({ a, b });
  });

  it('merges inferred types for the same variable', () => {
    const a1: CompressedInferredType = {
      to: functionType(freeVariable('x'), [booleanLiteral(true)]),
      sources: [{
        to: functionType(freeVariable('x'), [booleanLiteral(true)]),
        originatingExpression: identifier('originating'),
        inferringExpression: identifier('inferring'),
      }],
    };
    const a2: CompressedInferredType = {
      to: functionType(booleanLiteral(false), [freeVariable('y')]),
      sources: [{
        to: functionType(booleanLiteral(false), [freeVariable('y')]),
        originatingExpression: identifier('originating'),
        inferringExpression: identifier('inferring'),
      }],
    };
    const [messages, compressed] = mergeCompressedInferredTypes([{ a: a1 }, { a: a2 }]);
    expect(messages).toEqual([]);
    expect(compressed).toHaveProperty('a', expect.objectContaining({
      to: functionType(booleanLiteral(false), [booleanLiteral(true)]),
    }));
  });

  it('applies new inferred types to existing types', () => {
    const a: CompressedInferredType = {
      to: freeVariable('b'),
      sources: [{
        to: freeVariable('b'),
        originatingExpression: identifier('originating'),
        inferringExpression: identifier('inferring'),
      }],
    };
    const b: CompressedInferredType = {
      to: numberLiteral(7),
      sources: [{
        to: numberLiteral(7),
        originatingExpression: identifier('originating'),
        inferringExpression: identifier('inferring'),
      }],
    };
    const [messages, compressed] = mergeCompressedInferredTypes([{ a }, { b }]);
    expect(messages).toEqual([]);
    expect(compressed).toHaveProperty('a', expect.objectContaining({
      to: numberLiteral(7),
    }));
  });

  it('applies existing replacements to new inferred types', () => {
    const a: CompressedInferredType = {
      to: numberLiteral(7),
      sources: [{
        to: numberLiteral(7),
        originatingExpression: identifier('originating'),
        inferringExpression: identifier('inferring'),
      }],
    };
    const b: CompressedInferredType = {
      to: freeVariable('a'),
      sources: [{
        to: freeVariable('a'),
        originatingExpression: identifier('originating'),
        inferringExpression: identifier('inferring'),
      }],
    };
    const [messages, compressed] = mergeCompressedInferredTypes([{ a }, { b }]);
    expect(messages).toEqual([]);
    expect(compressed).toHaveProperty('b', expect.objectContaining({
      to: numberLiteral(7),
    }));
  });

  describe('when compressing simple compatible inferred types for the same variable', () => {
    const a1: CompressedInferredType = {
      to: numberLiteral(7),
      sources: [{
        to: numberLiteral(7),
        originatingExpression: identifier('a1Originating'),
        inferringExpression: identifier('a1Inferring'),
      }],
    };
    const a2: CompressedInferredType = {
      to: numberLiteral(7),
      sources: [{
        to: numberLiteral(7),
        originatingExpression: identifier('a2Originating'),
        inferringExpression: identifier('a2Inferring'),
      }],
    };

    it('combines them into a single entry', () => {
      const [messages, compressed] = mergeCompressedInferredTypes([{ a: a1 }, { a: a2 }]);
      expect(messages).toEqual([]);
      expect(compressed).toHaveProperty('a', expect.objectContaining({ to: a2.to }));
    });

    it('appends their sources', () => {
      const [messages, compressed] = mergeCompressedInferredTypes([{ a: a1 }, { a: a2 }]);
      expect(messages).toEqual([]);
      expect(compressed.a.sources).toEqual([...a1.sources, ...a2.sources]);
    });
  });

  describe('when compressing inferred types with free variables for the same variable', () => {
    const a1: CompressedInferredType = {
      to: dataValue('X', [freeVariable('q')]),
      sources: [
        {
          to: dataValue('X', [freeVariable('u')]),
          originatingExpression: identifier('a1Originating1'),
          inferringExpression: identifier('a1Inferring1'),
        },
        {
          to: dataValue('X', [freeVariable('q')]),
          originatingExpression: identifier('a1Originating2'),
          inferringExpression: identifier('a1Inferring2'),
        },
      ],
    };
    const a2: CompressedInferredType = {
      to: dataValue('X', [numberLiteral(7)]),
      sources: [
        {
          to: dataValue('X', [freeVariable('u')]),
          originatingExpression: identifier('a2Originating1'),
          inferringExpression: identifier('a2Inferring1'),
        },
        {
          to: dataValue('X', [numberLiteral(7)]),
          originatingExpression: identifier('a2Originating2'),
          inferringExpression: identifier('a2Inferring2'),
        },
      ],
    };

    it('emits no messages', () => {
      const [messages] = mergeCompressedInferredTypes([{ a: a1 }, { a: a2 }]);
      expect(messages).toEqual([]);
    })

    it('combines them into a single entry', () => {
      const [, compressed] = mergeCompressedInferredTypes([{ a: a1 }, { a: a2 }]);
      expect(compressed).toHaveProperty('a', expect.objectContaining({ to: a2.to }));
    });

    it('adds a new inferred type for the free variable', () => {
      const [, compressed] = mergeCompressedInferredTypes([{ a: a1 }, { a: a2 }]);
      expect(compressed).toHaveProperty<CompressedInferredType>('q', {
        to: numberLiteral(7),
        sources: [{
          to: numberLiteral(7),
          originatingExpression: identifier('a1Inferring2'),
          inferringExpression: identifier('a2Inferring2')
        }],
      });
    });
  });

  describe('when compressing non compatible types', () => {
    const a1: CompressedInferredType = {
      to: dataValue('X', [numberLiteral(7), booleanLiteral(true)]),
      sources: [{
        to: dataValue('X', [numberLiteral(7), booleanLiteral(true)]),
        originatingExpression: identifier('a1Originating'),
        inferringExpression: identifier('a1Inferring'),
      }],
    };
    const a2: CompressedInferredType = {
      to: dataValue('X', [numberLiteral(7), booleanLiteral(false)]),
      sources: [{
        to: dataValue('X', [numberLiteral(7), booleanLiteral(false)]),
        originatingExpression: identifier('a2Originating'),
        inferringExpression: identifier('a2Inferring'),
      }],
    };

    it('leaves the first entry in the result', () => {
      const [, compressed] = mergeCompressedInferredTypes([{ a: a1 }, { a: a2 }]);
      expect(compressed).toHaveProperty('a', expect.objectContaining({ to: a1.to }));
    });

    it('emits an error message', () => {
      const [messages] = mergeCompressedInferredTypes([{ a: a1 }, { a: a2 }]);
      expect(messages).toEqual([
        'Type mismatch between true and false in context :X:<7, true> and :X:<7, false>',
      ]);
    });
  });

  describe('when merging types with an infinite loop', () => {
    it.todo('')
  });

  it('removes implicits from inferred types to fit known types', () => {
    const a1 = makeCIT('a1', functionType(booleanLiteral(true), [
      functionType(numberLiteral(1), [numberLiteral(7)]),
    ]));
    const a2 = makeCIT('a2', freeVariable('b'));
    const b = makeCIT('b', functionType(freeVariable('d'), [freeVariable('c')]))
    const c = makeCIT('c', functionType(numberLiteral(1), [
      [stringLiteral('implicitParam'), true],
      numberLiteral(7),
    ]));
    const [messages, result] = mergeCompressedInferredTypes([
      { a: a1 },
      { a: a2 },
      { b },
      { c },
    ]);
    expect(messages).toEqual([]);
    expect(result).toHaveProperty('a', expect.objectContaining({
      to: a1.to,
    }));
    expect(result).toHaveProperty('c', expect.objectContaining({
      to: functionType(numberLiteral(1), [
        numberLiteral(7),
      ]),
    }));
  });
});