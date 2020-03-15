import { compile } from '../../api';
import { stripNode } from '../..';
import { generateJavascript } from './generate-javascript';

describe('generateJavascript', () => {
  it('translates a number expression', () => {
    const result = compile('5');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('export default 5;');
    }
  });

  it('translates a boolean expression', () => {
    const result = compile('true');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('export default true;');
    }
  });

  it('translates a record expression', () => {
    const result = compile('{ a = 1, b = 2, }');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual(`export default {
  a: 1,
  b: 2
};`);
    }
  });

  it('translates a function expression', () => {
    const result = compile('a -> b -> 1');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('export default (a$rename$1 => b$rename$2 => 1);');
    }
  });

  it('translates a function expression with bindings', () => {
    const result = compile('a:b -> a');
    expect(result.node).toBeDefined();
    if (result.node) {
      const expected = `export default ($PARAMETER$1 => {
  const a$rename$3 = $PARAMETER$1;
  const b$rename$4 = $PARAMETER$1;
  return a$rename$3;
});`;
      expect(generateJavascript(stripNode(result.node))).toEqual(expected);
    }
  });

  it('translates a binding expression', () => {
    const result = compile('let a = 1\na');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual('const a = 1;\nexport default a;');
    }
  });

  it('translates a record literal expression', () => {
    const result = compile('{ a = 1, b = 2, }');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual(`export default {
  a: 1,
  b: 2
};`);
    }
  });

  it('translates a read record property expression', () => {
    const result = compile('{ word = 10, }.word');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual(`export default {
  word: 10
}.word;`);
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
    const result = compile('match 5 | 3 = "three" | 5 = "five" | _ = "something else"');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual(`export default ($patternValue => {
  if ($patternValue === 3) {
    return "three";
  } else if ($patternValue === 5) {
    return "five";
  } else {
    const _$rename$6 = $patternValue;
    return "something else";
  }
})(5);`);
    }
  });

  it('translates a data declaration', () => {
    const result = compile('data a = x, y, z\na 1 2 3');
    expect(result.node).toBeDefined();
    if (result.node) {
      expect(generateJavascript(stripNode(result.node))).toEqual(`const a = x$rename$7 => y$rename$8 => z$rename$9 => ({
  $DATA_NAME$: "$SYMBOL$a",
  0: x$rename$7,
  1: y$rename$8,
  2: z$rename$9
});

export default a(1)(2)(3);`);
    }
  });

  describe('given a native expression', () => {
    it('translates it to a variable', () => {
      const result = compile('#{ name = "window", }');
      expect(result.node).toBeDefined();
      if (result.node) {
        expect(generateJavascript(stripNode(result.node))).toEqual(`export default window;`);
      }
    });

    it('translates it to a binary expression', () => {
      const result = compile('#{ kind = "binaryOperation", operator = "+", }');
      expect(result.node).toBeDefined();
      if (result.node) {
        expect(generateJavascript(stripNode(result.node)))
          .toEqual(`export default ($leftBinaryParam => $rightBinaryParam => $leftBinaryParam + $rightBinaryParam);`);
      }
    });

    it('translates it to a member call', () => {
      const result = compile('#{ kind = "memberCall", name = "delete", arity = 2, }');
      expect(result.node).toBeDefined();
      if (result.node) {
        expect(generateJavascript(stripNode(result.node)))
          .toEqual(`export default ($nativeObject => $nativeParameter$0 => $nativeParameter$1 => $nativeObject.delete($nativeParameter$0, $nativeParameter$1));`);
      }
    });

    it('translates it to a member', () => {
      const result = compile('#{ kind = "member", object = "document", name = "createElement", arity = 2, }');
      expect(result.node).toBeDefined();
      if (result.node) {
        expect(generateJavascript(stripNode(result.node)))
          .toEqual(`export default ($nativeParameter$0 => $nativeParameter$1 => document.createElement($nativeParameter$0, $nativeParameter$1));`);
      }
    });
  });
});
