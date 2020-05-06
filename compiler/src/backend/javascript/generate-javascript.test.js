"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dedent_js_1 = tslib_1.__importDefault(require("dedent-js"));
const __1 = require("../..");
const api_1 = require("../../api");
const generate_javascript_1 = require("./generate-javascript");
function toJavascript(code) {
    const result = api_1.compile(code);
    return result.node
        ? generate_javascript_1.generateJavascript(__1.stripNode(result.node), { module: 'esm' })
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
        expect(toJavascript('{ a = 1, b = 2, }')).toEqual(dedent_js_1.default `
      export default {
        a: 1,
        b: 2
      };
    `);
    });
    it('translates a function expression', () => {
        expect(toJavascript('a -> b -> 1')).toEqual('export default (a$rename$79 => b$rename$80 => 1);');
    });
    it('translates a function expression with bindings', () => {
        expect(toJavascript('a:b -> a')).toEqual(dedent_js_1.default `
      export default ($PARAMETER$1 => {
        const a$rename$102 = $PARAMETER$1;
        const b$rename$103 = $PARAMETER$1;
        return a$rename$102;
      });
    `);
    });
    it('translates a binding expression', () => {
        expect(toJavascript('let a = 1\na')).toEqual(dedent_js_1.default `
      const a = 1;
      export default a;
    `);
    });
    it('translates a record literal expression', () => {
        expect(toJavascript('{ a = 1, b = 2, }')).toEqual(dedent_js_1.default `
      export default {
        a: 1,
        b: 2
      };
    `);
    });
    it('translates a read record property expression', () => {
        expect(toJavascript('{ word = 10, }.word')).toEqual(dedent_js_1.default `
      export default {
        word: 10
      }.word;
    `);
    });
    it.skip('translates a read data value property expression', () => {
        expect(toJavascript('a#9')).toEqual('a[9]');
    });
    it('translates a pattern match expression', () => {
        expect(toJavascript('match 5 | 3 = "three" | 5 = "five" | _ = "something else"')).toEqual(dedent_js_1.default `
      export default ($patternValue => {
        if ($patternValue === 3) {
          return "three";
        } else if ($patternValue === 5) {
          return "five";
        } else {
          const _$rename$188 = $patternValue;
          return "something else";
        }
      })(5);
    `);
    });
    it('translates a data declaration', () => {
        expect(toJavascript('data a = x, y, z\na 1 2 3')).toEqual(dedent_js_1.default `
      const a = x$rename$210 => y$rename$211 => z$rename$212 => ({
        $DATA_NAME$: "$SYMBOL$a",
        0: x$rename$210,
        1: y$rename$211,
        2: z$rename$212
      });

      export default a(1)(2)(3);
    `);
    });
    describe('given a native expression', () => {
        it('translates it to a variable', () => {
            expect(toJavascript('#{ name = "window", }')).toEqual(`export default window;`);
        });
        it('translates it to a binary expression', () => {
            expect(toJavascript('#{ kind = "binaryOperation", operator = "+", }'))
                .toEqual(`export default ($leftBinaryParam => $rightBinaryParam => $leftBinaryParam + $rightBinaryParam);`);
        });
        it('translates it to a member call', () => {
            expect(toJavascript('#{ kind = "memberCall", name = "delete", arity = 2, }'))
                .toEqual(`export default ($nativeObject => $nativeParameter$0 => $nativeParameter$1 => $nativeObject.delete($nativeParameter$0, $nativeParameter$1));`);
        });
        it('translates it to a member', () => {
            expect(toJavascript('#{ kind = "member", object = "document", name = "createElement", arity = 2, }'))
                .toEqual(`export default ($nativeParameter$0 => $nativeParameter$1 => document.createElement($nativeParameter$0, $nativeParameter$1));`);
        });
    });
});
//# sourceMappingURL=generate-javascript.test.js.map