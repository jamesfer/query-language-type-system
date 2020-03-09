import { compile } from '../../api';
import { stripNode } from '../..';
import { generateJavascript } from './generate-javascript';

describe('generateJavascript', () => {
  it('translates a number expression', () => {
    const result = compile('5');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('5');
    }
  });

  it('translates a boolean expression', () => {
    const result = compile('true');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('true');
    }
  });

  it.skip('translates a record expression', () => {
    const result = compile('{ a: 1, b: 2 }');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('true');
    }
  });

  it('translates a function expression', () => {
    const result = compile('a -> b -> 1');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('a$rename$1 => b$rename$2 => 1');
    }
  });

  it('translates a function expression with bindings', () => {
    const result = compile('a:b -> a');
    expect(result.node).toBeDefined();
    if (result.node) {
      const expected = `function ($PARAMETER$1) {
  const a$rename$3 = $PARAMETER$1;
  const b$rename$4 = $PARAMETER$1;
  return a$rename$3;
}`;
      expect(generateJavascript(stripNode(result.node))).toEqual(expected);
    }
  });

  it('translates a binding expression', () => {
    const result = compile('let a = 1\na');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('a = 1, a');
    }
  });

  it('translates a record literal expression', () => {
    const result = compile('{ a = 1, b = 2, }');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual(`{
  a: 1,
  b: 2
}`);
    }
  });

  it('translates a read record property expression', () => {
    const result = compile('{ word = 10, }.word');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual(`{
  word: 10
}.word`);
    }
  });

  it.skip('translates a read data value property expression', () => {
    const result = compile('a#9');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('a[9]');
    }
  });

  it('translates a pattern match expression', () => {
    const result = compile('match 5 | 3 = true | 5 = true | _ = false');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('5 === 3 ? (true) : 5 === 5 ? (true) : false');
    }
  });

  it('translates a data declaration', () => {
    const result = compile('data a = x, y, z\na 1 2 3');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual(`a = x$rename$7 => y$rename$8 => z$rename$9 => ({
  $DATA_NAME$: "$SYMBOL$a",
  0: x$rename$7,
  1: y$rename$8,
  2: z$rename$9
}), a(1)(2)(3)`);
    }
  });
});
