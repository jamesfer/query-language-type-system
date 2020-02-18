import { compile } from '../../api';
import { stripNode } from '../../type-checker/strip-nodes';
import { generateJavascript } from './generate-javascript';

describe('generateJavascript', () => {
  it('translates a number expression', () => {
    const node = compile('5');
    expect(node).toBeDefined();
    if (node) {
      expect(generateJavascript(stripNode(node))).toEqual('5');
    }
  });

  it('translates a boolean expression', () => {
    const node = compile('true');
    expect(node).toBeDefined();
    if (node) {
      expect(generateJavascript(stripNode(node))).toEqual('true');
    }
  });

  it.skip('translates a record expression', () => {
    const node = compile('{ a: 1, b: 2 }');
    expect(node).toBeDefined();
    if (node) {
      expect(generateJavascript(stripNode(node))).toEqual('true');
    }
  });

  it('translates a function expression', () => {
    const node = compile('a -> b -> 1');
    expect(node).toBeDefined();
    if (node) {
      expect(generateJavascript(stripNode(node))).toEqual('a$rename$1 => b$rename$2 => 1');
    }
  });

  it('translates a function expression with bindings', () => {
    const node = compile('a:b -> a');
    expect(node).toBeDefined();
    if (node) {
      const expected = `function ($PARAMETER$1) {
  const a$rename$3 = $PARAMETER$1;
  const b$rename$4 = $PARAMETER$1;
  return a$rename$3;
}`;
      expect(generateJavascript(stripNode(node))).toEqual(expected);
    }
  });

  it('translates a binding expression', () => {
    const node = compile('let a = 1 a');
    expect(node).toBeDefined();
    if (node) {
      expect(generateJavascript(stripNode(node))).toEqual('a = 1, a');
    }
  });

  it.skip('translates a read record property expression', () => {
    const node = compile('a.word');
    expect(node).toBeDefined();
    if (node) {
      expect(generateJavascript(stripNode(node))).toEqual('a.word');
    }
  });

  it.skip('translates a read data value property expression', () => {
    const node = compile('a#9');
    expect(node).toBeDefined();
    if (node) {
      expect(generateJavascript(stripNode(node))).toEqual('a[9]');
    }
  });

  it('translates a pattern match expression', () => {
    const node = compile('match 5 | 3 = true | 5 = true | _ = false');
    expect(node).toBeDefined();
    if (node) {
      expect(generateJavascript(stripNode(node))).toEqual('5 === 3 ? (true) : 5 === 5 ? (true) : false');
    }
  });
});
