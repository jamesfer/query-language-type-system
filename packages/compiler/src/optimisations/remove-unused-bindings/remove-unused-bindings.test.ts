import dedent from "dedent-js";
import { stripNode, Expression } from '../..';
import { compile } from '../../api';

describe('removeUnusedBindings', () => {
  it('removes binding expressions that are not used', () => {
    const result = compile(dedent`
      let a = 1
      let b = 2
      a
    `);
    expect(result.node).toBeDefined();
    if (result.node) {
      const expected: Expression = {
        kind: 'BindingExpression',
        name: 'a',
        value: {
          kind: 'NumberExpression',
          value: 1,
        },
        body: {
          kind: 'Identifier',
          name: 'a',
        },
      };
      expect(stripNode(result.node)).toEqual(expected);
    }
  });
});
