import dedentJs from 'dedent-js';
import { compile } from '../../api';
import { stripCoreNode } from '../../desugar/desugar';
import { generateJavascript } from './generate-javascript';

function toJavascript(code: string) {
  const result = compile(code);
  return result.node
    ? generateJavascript(stripCoreNode(result.node), { module: 'esm' })
    : undefined;
}

describe('generateJavascript', () => {
  it('translates a number expression', () => {
    expect(toJavascript('5')).toEqual('export default 5;');
  });

  it('translates a boolean expression', () => {
    expect(toJavascript('true')).toEqual('export default true;');
  });

  it('translates a record expression', () => {
    expect(toJavascript('{ a = 1, b = 2, }')).toEqual(dedentJs`
      export default {
        a: 1,
        b: 2
      };
    `);
  });

  it('translates a function expression', () => {
    expect(toJavascript('a -> b -> 1')).toEqual(
      'export default (a$rename$25 => b$rename$26 => 1);',
    );
  });

  it('translates a function expression with bindings', () => {
    expect(toJavascript('a:b -> a')).toEqual(dedentJs`
      export default (injectedParameter$155 => {
        const a$rename$25 = injectedParameter$155;
        return a$rename$25;
      });
    `);
  });

  it('translates a binding expression', () => {
    expect(toJavascript('let a = 1\na')).toEqual(dedentJs`
      const a = 1;
      export default a;
    `);
  });

  it('translates a record literal expression', () => {
    expect(toJavascript('{ a = 1, b = 2, }')).toEqual(dedentJs`
      export default {
        a: 1,
        b: 2
      };
    `);
  });

  it('translates a read record property expression', () => {
    expect(toJavascript('{ word = 10, }.word')).toEqual(dedentJs`
      export default {
        word: 10
      }.word;
    `);
  });

  it.skip('translates a read data value property expression', () => {
    expect(toJavascript('a#9')).toEqual('a[9]');
  });

  it.skip('translates a pattern match expression', () => {
    expect(toJavascript('match 5 | 3 = "three" | 5 = "five" | _ = "something else"'))
      .toEqual(dedentJs`
        export default ($patternValue => {
          if ($patternValue === 3) {
            return "three";
          } else if ($patternValue === 5) {
            return "five";
          } else {
            const _$rename$16 = $patternValue;
            return "something else";
          }
        })(5);
      `);
  });

  it('translates a data declaration', () => {
    expect(toJavascript('data a = x, y, z\na 1 2 3')).toEqual(dedentJs`
      const a = x$rename$25 => y$rename$26 => z$rename$27 => ({
        $DATA_NAME$: "$SYMBOL$a",
        0: x$rename$25,
        1: y$rename$26,
        2: z$rename$27
      });
      export default a(1)(2)(3);
    `);
  });

  it('does not use reserved keywords', () => {
    expect(toJavascript(dedentJs`
      let for = 1
      let return = 2
      add for return
    `)).toEqual(dedentJs`
      const add = $leftBinaryParam => $rightBinaryParam => $leftBinaryParam + $rightBinaryParam;
      const for_ = 1;
      const return_ = 2;
      export default add(for_)(return_);
    `);
  });

  describe('given a native expression', () => {
    it('translates it to a variable', () => {
      expect(toJavascript('#{ javascript = { name = "window", }, }'))
        .toEqual('export default window;');
    });

    it('translates it to a binary expression', () => {
      expect(toJavascript('#{ javascript = { kind = "binaryOperation", operator = "+", }, }'))
        .toEqual('export default ($leftBinaryParam => $rightBinaryParam =>'
          + ' $leftBinaryParam + $rightBinaryParam);');
    });

    it('translates it to a member call', () => {
      expect(toJavascript(
        '#{ javascript = { kind = "memberCall", name = "delete", arity = 2, }, }',
      )).toEqual('export default ($nativeObject => $nativeParameter$0 => $nativeParameter$1 =>'
        + ' $nativeObject.delete($nativeParameter$0, $nativeParameter$1));');
    });

    it('translates it to a member', () => {
      expect(toJavascript('#{ javascript = { kind = "member", object = "document", name = "createElement", arity = 2, }, }'))
        .toEqual('export default ($nativeParameter$0 => $nativeParameter$1 =>'
           + ' document.createElement($nativeParameter$0, $nativeParameter$1));');
    });
  });
});
