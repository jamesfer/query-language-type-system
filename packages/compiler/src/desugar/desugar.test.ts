import dedent from 'dedent-js';
import parse from '../parser/parse';
import { checkTypes } from '../type-checker';
import { BindingExpression } from '../type-checker/types/expression';
import { FreeVariable } from '../type-checker/types/value';
import { uniqueIdStream } from '../utils/unique-id-generator';
import { desugar } from './desugar';
import { SimpleFunctionExpression } from './desugar-destructuring';

function compileAndDesugar(code: string) {
  const { value: expression } = parse(code);
  if (!expression) {
    throw new Error(`Failed to parse code: ${code}`);
  }

  const makeUniqueId = uniqueIdStream();
  const [typeMessages, typedNode] = checkTypes(makeUniqueId, expression);
  if (typeMessages.length > 0) {
    throw new Error(`Failed to type code: ${typeMessages.join(', ')}`);
  }

  return desugar(makeUniqueId, typedNode);
}

describe('desugar', () => {
  describe('desugarDestructuring', () => {
    it('has no effect on functions with identifier parameters', () => {
      expect(compileAndDesugar(dedent`
        let f = c -> 1
        f
      `)).toMatchObject({
        kind: 'Node',
        expression: {
          kind: 'BindingExpression',
          name: 'f',
          value: {
            kind: 'Node',
            expression: {
              kind: 'SimpleFunctionExpression',
              parameter: expect.stringMatching(/^c\$.*/),
              body: {
                kind: 'Node',
                expression: {
                  kind: 'NumberExpression',
                  value: 1,
                },
              },
            },
          },
          body: {
            kind: 'Node',
            expression: {
              kind: 'Identifier',
              name: 'f',
            },
          },
        },
      });
    });

    it('replaces destructured parameters with an identifier', () => {
      expect(compileAndDesugar(dedent`
        let f = M a -> 1
        f
      `)).toMatchObject({
        kind: 'Node',
        expression: {
          kind: 'BindingExpression',
          name: 'f',
          value: {
            kind: 'Node',
            expression: {
              kind: 'SimpleFunctionExpression',
              parameter: expect.stringMatching(/^injectedParameter\$\d*/),
              body: {
                kind: 'Node',
                expression: {
                  kind: 'BindingExpression',
                  body: {
                    kind: 'Node',
                    expression: {
                      kind: 'NumberExpression',
                      value: 1,
                    },
                  },
                },
              },
            },
          },
          body: {
            kind: 'Node',
            expression: {
              kind: 'Identifier',
              name: 'f',
            },
          },
        },
      });
    });

    it('creates binding expressions for a data parameter', () => {
      expect(compileAndDesugar(dedent`
        let f = M a -> 1
        f
      `)).toMatchObject({
        kind: 'Node',
        expression: {
          kind: 'BindingExpression',
          name: 'f',
          value: {
            kind: 'Node',
            expression: {
              kind: 'SimpleFunctionExpression',
              parameter: expect.stringMatching(/^injectedParameter\$\d*/),
              body: {
                kind: 'Node',
                expression: {
                  kind: 'BindingExpression',
                  name: expect.stringMatching(/^a\$.*/),
                  value: {
                    kind: 'Node',
                    expression: {
                      kind: 'ReadDataPropertyExpression',
                      property: 0,
                      dataValue: {
                        kind: 'Node',
                        expression: {
                          kind: 'Identifier',
                          name: expect.stringMatching(/^injectedParameter\$\d*/),
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          body: {
            kind: 'Node',
            expression: {
              kind: 'Identifier',
              name: 'f',
            },
          },
        },
      });
    });

    it('creates bindings for dual expressions', () => {
      expect(compileAndDesugar(dedent`
        let f = a:b -> 1
        f
      `)).toMatchObject({
        kind: 'Node',
        expression: {
          kind: 'BindingExpression',
          name: 'f',
          value: {
            kind: 'Node',
            expression: {
              kind: 'SimpleFunctionExpression',
              parameter: expect.stringMatching(/^injectedParameter\$\d*/),
              body: {
                kind: 'Node',
                expression: {
                  kind: 'BindingExpression',
                  name: expect.stringMatching(/^b\$.*/),
                  value: {
                    kind: 'Node',
                    expression: {
                      kind: 'Identifier',
                      name: expect.stringMatching(/^injectedParameter\$\d*/),
                    },
                    decoration: {
                      type: {
                        kind: 'FreeVariable',
                        name: expect.stringMatching(/^dualExpression\$.*/),
                      },
                    },
                  },
                  body: {
                    kind: 'Node',
                    expression: {
                      kind: 'BindingExpression',
                      name: expect.stringMatching(/^a\$.*/),
                      value: {
                        kind: 'Node',
                        expression: {
                          kind: 'Identifier',
                          name: expect.stringMatching(/^injectedParameter\$\d*/),
                        },
                        decoration: {
                          type: {
                            kind: 'FreeVariable',
                            name: expect.stringMatching(/^dualExpression\$.*/),
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          body: {
            kind: 'Node',
            expression: {
              kind: 'Identifier',
              name: 'f',
            },
          },
        },
      });
    });
  });

  describe('desugarDualBindings', () => {
    it('removes dual bindings with an identifier on the left', () => {
      expect(compileAndDesugar(dedent`
        let a = b:1
        a
      `)).toMatchObject({
        kind: 'Node',
        expression: {
          kind: 'BindingExpression',
          name: 'a',
          value: {
            kind: 'Node',
            expression: {
              kind: 'NumberExpression',
              value: 1,
            },
          },
          body: {
            kind: 'Node',
            expression: {
              kind: 'Identifier',
              name: 'a',
            },
          },
        },
      });
    });

    it('removes dual bindings with an identifier on the right', () => {
      expect(compileAndDesugar(dedent`
        let a = 1:b
        a
      `)).toMatchObject({
        kind: 'Node',
        expression: {
          kind: 'BindingExpression',
          name: 'a',
          value: {
            kind: 'Node',
            expression: {
              kind: 'NumberExpression',
              value: 1,
            },
          },
          body: {
            kind: 'Node',
            expression: {
              kind: 'Identifier',
              name: 'a',
            },
          },
        },
      });
    });

    it('removes dual bindings with a native expression on the left', () => {
      expect(compileAndDesugar(dedent`
        let a = #{ prop = "value", }:1
        a
      `)).toMatchObject({
        kind: 'Node',
        expression: {
          kind: 'BindingExpression',
          name: 'a',
          value: {
            kind: 'Node',
            expression: {
              kind: 'NativeExpression',
              data: { prop: 'value' },
            },
          },
          body: {
            kind: 'Node',
            expression: {
              kind: 'Identifier',
              name: 'a',
            },
          },
        },
      });
    });

    it('removes dual bindings with a native expression on the right', () => {
      expect(compileAndDesugar(dedent`
        let a = 1:#{ prop = "value", }
        a
      `)).toMatchObject({
        kind: 'Node',
        expression: {
          kind: 'BindingExpression',
          name: 'a',
          value: {
            kind: 'Node',
            expression: {
              kind: 'NativeExpression',
              data: { prop: 'value' },
            },
          },
          body: {
            kind: 'Node',
            expression: {
              kind: 'Identifier',
              name: 'a',
            },
          },
        },
      });
    });
  });
});
