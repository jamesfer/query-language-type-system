import { scope } from './constructors';
import { canSatisfyShape } from './type-utils';
import { Scope } from './types/scope';
import { DualBinding, Value } from './types/value';

describe('type-utils', () => {
  describe('canSatisfyShape', () => {
    it('is successful for two dual bindings', () => {
      const bindingValue: DualBinding = {
        kind: 'DualBinding',
        left: {
          kind: 'FreeVariable',
          name: 'implicitBinding$9',
        },
        right: {
          kind: 'DataValue',
          name: {
            kind: 'SymbolLiteral',
            name: 'Serial',
          },
          parameters: [
            {
              kind: 'FreeVariable',
              name: 't$10',
            },
          ],
        },
      };
      const value: DualBinding = {
        kind: 'DualBinding',
        left: {
          kind: 'FreeVariable',
          name: 'implicitBinding$13',
        },
        right: {
          kind: 'DualBinding',
          left: {
            kind: 'FreeVariable',
            name: 'implicitBinding$8',
          },
          right: {
            kind: 'DataValue',
            name: {
              kind: 'SymbolLiteral',
              name: 'Serial',
            },
            parameters: [
              {
                kind: 'FreeVariable',
                name: 't$10',
              },
            ],
          },
        },
      };
      expect(canSatisfyShape(scope(), value, bindingValue)).toBeDefined();
    });

    it('is successful for two dual bindings with a value in the scope', () => {
      const bindingValue: DualBinding = {
        kind: 'DualBinding',
        left: {
          kind: 'FreeVariable',
          name: 'implicitBinding$9',
        },
        right: {
          kind: 'DataValue',
          name: {
            kind: 'SymbolLiteral',
            name: 'Serial',
          },
          parameters: [
            {
              kind: 'FreeVariable',
              name: 't$10',
            },
          ],
        },
      };
      const value: DualBinding = {
        kind: 'DualBinding',
        left: {
          kind: 'FreeVariable',
          name: 'implicitBinding$13',
        },
        right: {
          kind: 'DualBinding',
          left: {
            kind: 'FreeVariable',
            name: 'implicitBinding$8',
          },
          right: {
            kind: 'DataValue',
            name: {
              kind: 'SymbolLiteral',
              name: 'Serial',
            },
            parameters: [
              {
                kind: 'FreeVariable',
                name: 't$10',
              },
            ],
          },
        },
      };
      const s = scope({
        bindings: [{
          kind: 'ScopeBinding',
          name: 'implicitBinding$13',
          type: {
            kind: 'DualBinding',
            left: {
              kind: 'FreeVariable',
              name: 'implicitBinding$8',
            },
            right: {
              kind: 'DataValue',
              name: {
                kind: 'SymbolLiteral',
                name: 'Serial',
              },
              parameters: [
                {
                  kind: 'FreeVariable',
                  name: 't$10',
                },
              ],
            },
          },
          scope: scope(),
        }],
      });
      expect(canSatisfyShape(s, value, bindingValue)).toBeDefined();
    });

    it('blah', () => {
      const s: Scope = {
        'bindings': [
          {
            'name': 'Serial',
            'type': {
              'body': {
                'parameters': [
                  {
                    'name': 's$rename$4',
                    'kind': 'FreeVariable',
                  },
                ],
                'name': {
                  'name': 'Serial',
                  'kind': 'SymbolLiteral',
                },
                'kind': 'DataValue',
              },
              'kind': 'FunctionLiteral',
              'parameter': {
                'name': 's$rename$4',
                'kind': 'FreeVariable',
              },
            },
            'scope': {
              'bindings': [],
            },
            'expression': {
              'body': {
                'kind': 'DataInstantiation',
                'callee': {
                  'name': 'Serial',
                  'kind': 'SymbolExpression',
                },
                'parameters': [
                  {
                    'name': 's$rename$4',
                    'kind': 'Identifier',
                  },
                ],
              },
              'parameter': {
                'name': 's$rename$4',
                'kind': 'Identifier',
              },
              'kind': 'FunctionExpression',
              'implicit': false,
            },
            'kind': 'ScopeBinding',
          },
          {
            'name': 'Color',
            'type': {
              'body': {
                'body': {
                  'parameters': [
                    {
                      'name': 't$rename$5',
                      'kind': 'FreeVariable',
                    },
                  ],
                  'name': {
                    'name': 'Color',
                    'kind': 'SymbolLiteral',
                  },
                  'kind': 'DataValue',
                },
                'kind': 'FunctionLiteral',
                'parameter': {
                  'name': 't$rename$5',
                  'kind': 'FreeVariable',
                },
              },
              'kind': 'ImplicitFunctionLiteral',
              'parameter': {
                'left': {
                  'name': 'implicitBinding$8',
                  'kind': 'FreeVariable',
                },
                'right': {
                  'parameters': [
                    {
                      'name': 't$rename$5',
                      'kind': 'FreeVariable',
                    },
                  ],
                  'kind': 'DataValue',
                  'name': {
                    'kind': 'SymbolLiteral',
                    'name': 'Serial',
                  },
                },
                'kind': 'DualBinding',
              },
            },
            'scope': {
              'bindings': [
                {
                  'name': 'Serial',
                  'type': {
                    'body': {
                      'parameters': [
                        {
                          'name': 's$rename$4',
                          'kind': 'FreeVariable',
                        },
                      ],
                      'name': {
                        'name': 'Serial',
                        'kind': 'SymbolLiteral',
                      },
                      'kind': 'DataValue',
                    },
                    'kind': 'FunctionLiteral',
                    'parameter': {
                      'name': 's$rename$4',
                      'kind': 'FreeVariable',
                    },
                  },
                  'scope': {
                    'bindings': [],
                  },
                  'expression': {
                    'body': {
                      'kind': 'DataInstantiation',
                      'callee': {
                        'name': 'Serial',
                        'kind': 'SymbolExpression',
                      },
                      'parameters': [
                        {
                          'name': 's$rename$4',
                          'kind': 'Identifier',
                        },
                      ],
                    },
                    'parameter': {
                      'name': 's$rename$4',
                      'kind': 'Identifier',
                    },
                    'kind': 'FunctionExpression',
                    'implicit': false,
                  },
                  'kind': 'ScopeBinding',
                },
                {
                  'name': 'implicitBinding$8',
                  'type': {
                    'parameters': [
                      {
                        'name': 't$rename$5',
                        'kind': 'FreeVariable',
                      },
                    ],
                    'kind': 'DataValue',
                    'name': {
                      'kind': 'SymbolLiteral',
                      'name': 'Serial',
                    },
                  },
                  'scope': {
                    'bindings': [
                      {
                        'name': 'Serial',
                        'type': {
                          'body': {
                            'parameters': [
                              {
                                'name': 's$rename$4',
                                'kind': 'FreeVariable',
                              },
                            ],
                            'name': {
                              'name': 'Serial',
                              'kind': 'SymbolLiteral',
                            },
                            'kind': 'DataValue',
                          },
                          'kind': 'FunctionLiteral',
                          'parameter': {
                            'name': 's$rename$4',
                            'kind': 'FreeVariable',
                          },
                        },
                        'scope': {
                          'bindings': [],
                        },
                        'expression': {
                          'body': {
                            'kind': 'DataInstantiation',
                            'callee': {
                              'name': 'Serial',
                              'kind': 'SymbolExpression',
                            },
                            'parameters': [
                              {
                                'name': 's$rename$4',
                                'kind': 'Identifier',
                              },
                            ],
                          },
                          'parameter': {
                            'name': 's$rename$4',
                            'kind': 'Identifier',
                          },
                          'kind': 'FunctionExpression',
                          'implicit': false,
                        },
                        'kind': 'ScopeBinding',
                      },
                    ],
                  },
                  'kind': 'ScopeBinding',
                },
              ],
            },
            'expression': {
              'body': {
                'body': {
                  'kind': 'DataInstantiation',
                  'callee': {
                    'name': 'Color',
                    'kind': 'SymbolExpression',
                  },
                  'parameters': [
                    {
                      'name': 't$rename$5',
                      'kind': 'Identifier',
                    },
                  ],
                },
                'parameter': {
                  'name': 't$rename$5',
                  'kind': 'Identifier',
                },
                'kind': 'FunctionExpression',
                'implicit': false,
              },
              'kind': 'FunctionExpression',
              'implicit': true,
              'parameter': {
                'kind': 'Application',
                'callee': {
                  'name': 'Serial',
                  'kind': 'Identifier',
                },
                'parameter': {
                  'name': 't$rename$5',
                  'kind': 'Identifier',
                },
              },
            },
            'kind': 'ScopeBinding',
          },
          {
            'name': 'Red',
            'type': {
              'parameters': [],
              'name': {
                'name': 'Red',
                'kind': 'SymbolLiteral',
              },
              'kind': 'DataValue',
            },
            'scope': {
              'bindings': [
                {
                  'name': 'Serial',
                  'type': {
                    'body': {
                      'parameters': [
                        {
                          'name': 's$rename$4',
                          'kind': 'FreeVariable',
                        },
                      ],
                      'name': {
                        'name': 'Serial',
                        'kind': 'SymbolLiteral',
                      },
                      'kind': 'DataValue',
                    },
                    'kind': 'FunctionLiteral',
                    'parameter': {
                      'name': 's$rename$4',
                      'kind': 'FreeVariable',
                    },
                  },
                  'scope': {
                    'bindings': [],
                  },
                  'expression': {
                    'body': {
                      'kind': 'DataInstantiation',
                      'callee': {
                        'name': 'Serial',
                        'kind': 'SymbolExpression',
                      },
                      'parameters': [
                        {
                          'name': 's$rename$4',
                          'kind': 'Identifier',
                        },
                      ],
                    },
                    'parameter': {
                      'name': 's$rename$4',
                      'kind': 'Identifier',
                    },
                    'kind': 'FunctionExpression',
                    'implicit': false,
                  },
                  'kind': 'ScopeBinding',
                },
                {
                  'name': 'Color',
                  'type': {
                    'body': {
                      'body': {
                        'parameters': [
                          {
                            'name': 't$rename$5',
                            'kind': 'FreeVariable',
                          },
                        ],
                        'name': {
                          'name': 'Color',
                          'kind': 'SymbolLiteral',
                        },
                        'kind': 'DataValue',
                      },
                      'kind': 'FunctionLiteral',
                      'parameter': {
                        'name': 't$rename$5',
                        'kind': 'FreeVariable',
                      },
                    },
                    'kind': 'ImplicitFunctionLiteral',
                    'parameter': {
                      'left': {
                        'name': 'implicitBinding$8',
                        'kind': 'FreeVariable',
                      },
                      'right': {
                        'parameters': [
                          {
                            'name': 't$rename$5',
                            'kind': 'FreeVariable',
                          },
                        ],
                        'kind': 'DataValue',
                        'name': {
                          'kind': 'SymbolLiteral',
                          'name': 'Serial',
                        },
                      },
                      'kind': 'DualBinding',
                    },
                  },
                  'scope': {
                    'bindings': [
                      {
                        'name': 'Serial',
                        'type': {
                          'body': {
                            'parameters': [
                              {
                                'name': 's$rename$4',
                                'kind': 'FreeVariable',
                              },
                            ],
                            'name': {
                              'name': 'Serial',
                              'kind': 'SymbolLiteral',
                            },
                            'kind': 'DataValue',
                          },
                          'kind': 'FunctionLiteral',
                          'parameter': {
                            'name': 's$rename$4',
                            'kind': 'FreeVariable',
                          },
                        },
                        'scope': {
                          'bindings': [],
                        },
                        'expression': {
                          'body': {
                            'kind': 'DataInstantiation',
                            'callee': {
                              'name': 'Serial',
                              'kind': 'SymbolExpression',
                            },
                            'parameters': [
                              {
                                'name': 's$rename$4',
                                'kind': 'Identifier',
                              },
                            ],
                          },
                          'parameter': {
                            'name': 's$rename$4',
                            'kind': 'Identifier',
                          },
                          'kind': 'FunctionExpression',
                          'implicit': false,
                        },
                        'kind': 'ScopeBinding',
                      },
                      {
                        'name': 'implicitBinding$8',
                        'type': {
                          'parameters': [
                            {
                              'name': 't$rename$5',
                              'kind': 'FreeVariable',
                            },
                          ],
                          'kind': 'DataValue',
                          'name': {
                            'kind': 'SymbolLiteral',
                            'name': 'Serial',
                          },
                        },
                        'scope': {
                          'bindings': [
                            {
                              'name': 'Serial',
                              'type': {
                                'body': {
                                  'parameters': [
                                    {
                                      'name': 's$rename$4',
                                      'kind': 'FreeVariable',
                                    },
                                  ],
                                  'name': {
                                    'name': 'Serial',
                                    'kind': 'SymbolLiteral',
                                  },
                                  'kind': 'DataValue',
                                },
                                'kind': 'FunctionLiteral',
                                'parameter': {
                                  'name': 's$rename$4',
                                  'kind': 'FreeVariable',
                                },
                              },
                              'scope': {
                                'bindings': [],
                              },
                              'expression': {
                                'body': {
                                  'kind': 'DataInstantiation',
                                  'callee': {
                                    'name': 'Serial',
                                    'kind': 'SymbolExpression',
                                  },
                                  'parameters': [
                                    {
                                      'name': 's$rename$4',
                                      'kind': 'Identifier',
                                    },
                                  ],
                                },
                                'parameter': {
                                  'name': 's$rename$4',
                                  'kind': 'Identifier',
                                },
                                'kind': 'FunctionExpression',
                                'implicit': false,
                              },
                              'kind': 'ScopeBinding',
                            },
                          ],
                        },
                        'kind': 'ScopeBinding',
                      },
                    ],
                  },
                  'expression': {
                    'body': {
                      'body': {
                        'kind': 'DataInstantiation',
                        'callee': {
                          'name': 'Color',
                          'kind': 'SymbolExpression',
                        },
                        'parameters': [
                          {
                            'name': 't$rename$5',
                            'kind': 'Identifier',
                          },
                        ],
                      },
                      'parameter': {
                        'name': 't$rename$5',
                        'kind': 'Identifier',
                      },
                      'kind': 'FunctionExpression',
                      'implicit': false,
                    },
                    'kind': 'FunctionExpression',
                    'implicit': true,
                    'parameter': {
                      'kind': 'Application',
                      'callee': {
                        'name': 'Serial',
                        'kind': 'Identifier',
                      },
                      'parameter': {
                        'name': 't$rename$5',
                        'kind': 'Identifier',
                      },
                    },
                  },
                  'kind': 'ScopeBinding',
                },
              ],
            },
            'expression': {
              'kind': 'DataInstantiation',
              'callee': {
                'name': 'Red',
                'kind': 'SymbolExpression',
              },
              'parameters': [],
            },
            'kind': 'ScopeBinding',
          },
          {
            'name': 'implicitBinding$13',
            'type': {
              'left': {
                'name': 'implicitBinding$8$copy$9',
                'kind': 'FreeVariable',
              },
              'right': {
                'parameters': [
                  {
                    'name': 't$rename$5$copy$10',
                    'kind': 'FreeVariable',
                  },
                ],
                'kind': 'DataValue',
                'name': {
                  'kind': 'SymbolLiteral',
                  'name': 'Serial',
                },
              },
              'kind': 'DualBinding',
            },
            'scope': {
              'bindings': [
                {
                  'name': 'Serial',
                  'type': {
                    'body': {
                      'parameters': [
                        {
                          'name': 's$rename$4',
                          'kind': 'FreeVariable',
                        },
                      ],
                      'name': {
                        'name': 'Serial',
                        'kind': 'SymbolLiteral',
                      },
                      'kind': 'DataValue',
                    },
                    'kind': 'FunctionLiteral',
                    'parameter': {
                      'name': 's$rename$4',
                      'kind': 'FreeVariable',
                    },
                  },
                  'scope': {
                    'bindings': [],
                  },
                  'expression': {
                    'body': {
                      'kind': 'DataInstantiation',
                      'callee': {
                        'name': 'Serial',
                        'kind': 'SymbolExpression',
                      },
                      'parameters': [
                        {
                          'name': 's$rename$4',
                          'kind': 'Identifier',
                        },
                      ],
                    },
                    'parameter': {
                      'name': 's$rename$4',
                      'kind': 'Identifier',
                    },
                    'kind': 'FunctionExpression',
                    'implicit': false,
                  },
                  'kind': 'ScopeBinding',
                },
                {
                  'name': 'Color',
                  'type': {
                    'body': {
                      'body': {
                        'parameters': [
                          {
                            'name': 't$rename$5',
                            'kind': 'FreeVariable',
                          },
                        ],
                        'name': {
                          'name': 'Color',
                          'kind': 'SymbolLiteral',
                        },
                        'kind': 'DataValue',
                      },
                      'kind': 'FunctionLiteral',
                      'parameter': {
                        'name': 't$rename$5',
                        'kind': 'FreeVariable',
                      },
                    },
                    'kind': 'ImplicitFunctionLiteral',
                    'parameter': {
                      'left': {
                        'name': 'implicitBinding$8',
                        'kind': 'FreeVariable',
                      },
                      'right': {
                        'parameters': [
                          {
                            'name': 't$rename$5',
                            'kind': 'FreeVariable',
                          },
                        ],
                        'kind': 'DataValue',
                        'name': {
                          'kind': 'SymbolLiteral',
                          'name': 'Serial',
                        },
                      },
                      'kind': 'DualBinding',
                    },
                  },
                  'scope': {
                    'bindings': [
                      {
                        'name': 'Serial',
                        'type': {
                          'body': {
                            'parameters': [
                              {
                                'name': 's$rename$4',
                                'kind': 'FreeVariable',
                              },
                            ],
                            'name': {
                              'name': 'Serial',
                              'kind': 'SymbolLiteral',
                            },
                            'kind': 'DataValue',
                          },
                          'kind': 'FunctionLiteral',
                          'parameter': {
                            'name': 's$rename$4',
                            'kind': 'FreeVariable',
                          },
                        },
                        'scope': {
                          'bindings': [],
                        },
                        'expression': {
                          'body': {
                            'kind': 'DataInstantiation',
                            'callee': {
                              'name': 'Serial',
                              'kind': 'SymbolExpression',
                            },
                            'parameters': [
                              {
                                'name': 's$rename$4',
                                'kind': 'Identifier',
                              },
                            ],
                          },
                          'parameter': {
                            'name': 's$rename$4',
                            'kind': 'Identifier',
                          },
                          'kind': 'FunctionExpression',
                          'implicit': false,
                        },
                        'kind': 'ScopeBinding',
                      },
                      {
                        'name': 'implicitBinding$8',
                        'type': {
                          'parameters': [
                            {
                              'name': 't$rename$5',
                              'kind': 'FreeVariable',
                            },
                          ],
                          'kind': 'DataValue',
                          'name': {
                            'kind': 'SymbolLiteral',
                            'name': 'Serial',
                          },
                        },
                        'scope': {
                          'bindings': [
                            {
                              'name': 'Serial',
                              'type': {
                                'body': {
                                  'parameters': [
                                    {
                                      'name': 's$rename$4',
                                      'kind': 'FreeVariable',
                                    },
                                  ],
                                  'name': {
                                    'name': 'Serial',
                                    'kind': 'SymbolLiteral',
                                  },
                                  'kind': 'DataValue',
                                },
                                'kind': 'FunctionLiteral',
                                'parameter': {
                                  'name': 's$rename$4',
                                  'kind': 'FreeVariable',
                                },
                              },
                              'scope': {
                                'bindings': [],
                              },
                              'expression': {
                                'body': {
                                  'kind': 'DataInstantiation',
                                  'callee': {
                                    'name': 'Serial',
                                    'kind': 'SymbolExpression',
                                  },
                                  'parameters': [
                                    {
                                      'name': 's$rename$4',
                                      'kind': 'Identifier',
                                    },
                                  ],
                                },
                                'parameter': {
                                  'name': 's$rename$4',
                                  'kind': 'Identifier',
                                },
                                'kind': 'FunctionExpression',
                                'implicit': false,
                              },
                              'kind': 'ScopeBinding',
                            },
                          ],
                        },
                        'kind': 'ScopeBinding',
                      },
                    ],
                  },
                  'expression': {
                    'body': {
                      'body': {
                        'kind': 'DataInstantiation',
                        'callee': {
                          'name': 'Color',
                          'kind': 'SymbolExpression',
                        },
                        'parameters': [
                          {
                            'name': 't$rename$5',
                            'kind': 'Identifier',
                          },
                        ],
                      },
                      'parameter': {
                        'name': 't$rename$5',
                        'kind': 'Identifier',
                      },
                      'kind': 'FunctionExpression',
                      'implicit': false,
                    },
                    'kind': 'FunctionExpression',
                    'implicit': true,
                    'parameter': {
                      'kind': 'Application',
                      'callee': {
                        'name': 'Serial',
                        'kind': 'Identifier',
                      },
                      'parameter': {
                        'name': 't$rename$5',
                        'kind': 'Identifier',
                      },
                    },
                  },
                  'kind': 'ScopeBinding',
                },
                {
                  'name': 'Red',
                  'type': {
                    'parameters': [],
                    'name': {
                      'name': 'Red',
                      'kind': 'SymbolLiteral',
                    },
                    'kind': 'DataValue',
                  },
                  'scope': {
                    'bindings': [
                      {
                        'name': 'Serial',
                        'type': {
                          'body': {
                            'parameters': [
                              {
                                'name': 's$rename$4',
                                'kind': 'FreeVariable',
                              },
                            ],
                            'name': {
                              'name': 'Serial',
                              'kind': 'SymbolLiteral',
                            },
                            'kind': 'DataValue',
                          },
                          'kind': 'FunctionLiteral',
                          'parameter': {
                            'name': 's$rename$4',
                            'kind': 'FreeVariable',
                          },
                        },
                        'scope': {
                          'bindings': [],
                        },
                        'expression': {
                          'body': {
                            'kind': 'DataInstantiation',
                            'callee': {
                              'name': 'Serial',
                              'kind': 'SymbolExpression',
                            },
                            'parameters': [
                              {
                                'name': 's$rename$4',
                                'kind': 'Identifier',
                              },
                            ],
                          },
                          'parameter': {
                            'name': 's$rename$4',
                            'kind': 'Identifier',
                          },
                          'kind': 'FunctionExpression',
                          'implicit': false,
                        },
                        'kind': 'ScopeBinding',
                      },
                      {
                        'name': 'Color',
                        'type': {
                          'body': {
                            'body': {
                              'parameters': [
                                {
                                  'name': 't$rename$5',
                                  'kind': 'FreeVariable',
                                },
                              ],
                              'name': {
                                'name': 'Color',
                                'kind': 'SymbolLiteral',
                              },
                              'kind': 'DataValue',
                            },
                            'kind': 'FunctionLiteral',
                            'parameter': {
                              'name': 't$rename$5',
                              'kind': 'FreeVariable',
                            },
                          },
                          'kind': 'ImplicitFunctionLiteral',
                          'parameter': {
                            'left': {
                              'name': 'implicitBinding$8',
                              'kind': 'FreeVariable',
                            },
                            'right': {
                              'parameters': [
                                {
                                  'name': 't$rename$5',
                                  'kind': 'FreeVariable',
                                },
                              ],
                              'kind': 'DataValue',
                              'name': {
                                'kind': 'SymbolLiteral',
                                'name': 'Serial',
                              },
                            },
                            'kind': 'DualBinding',
                          },
                        },
                        'scope': {
                          'bindings': [
                            {
                              'name': 'Serial',
                              'type': {
                                'body': {
                                  'parameters': [
                                    {
                                      'name': 's$rename$4',
                                      'kind': 'FreeVariable',
                                    },
                                  ],
                                  'name': {
                                    'name': 'Serial',
                                    'kind': 'SymbolLiteral',
                                  },
                                  'kind': 'DataValue',
                                },
                                'kind': 'FunctionLiteral',
                                'parameter': {
                                  'name': 's$rename$4',
                                  'kind': 'FreeVariable',
                                },
                              },
                              'scope': {
                                'bindings': [],
                              },
                              'expression': {
                                'body': {
                                  'kind': 'DataInstantiation',
                                  'callee': {
                                    'name': 'Serial',
                                    'kind': 'SymbolExpression',
                                  },
                                  'parameters': [
                                    {
                                      'name': 's$rename$4',
                                      'kind': 'Identifier',
                                    },
                                  ],
                                },
                                'parameter': {
                                  'name': 's$rename$4',
                                  'kind': 'Identifier',
                                },
                                'kind': 'FunctionExpression',
                                'implicit': false,
                              },
                              'kind': 'ScopeBinding',
                            },
                            {
                              'name': 'implicitBinding$8',
                              'type': {
                                'parameters': [
                                  {
                                    'name': 't$rename$5',
                                    'kind': 'FreeVariable',
                                  },
                                ],
                                'kind': 'DataValue',
                                'name': {
                                  'kind': 'SymbolLiteral',
                                  'name': 'Serial',
                                },
                              },
                              'scope': {
                                'bindings': [
                                  {
                                    'name': 'Serial',
                                    'type': {
                                      'body': {
                                        'parameters': [
                                          {
                                            'name': 's$rename$4',
                                            'kind': 'FreeVariable',
                                          },
                                        ],
                                        'name': {
                                          'name': 'Serial',
                                          'kind': 'SymbolLiteral',
                                        },
                                        'kind': 'DataValue',
                                      },
                                      'kind': 'FunctionLiteral',
                                      'parameter': {
                                        'name': 's$rename$4',
                                        'kind': 'FreeVariable',
                                      },
                                    },
                                    'scope': {
                                      'bindings': [],
                                    },
                                    'expression': {
                                      'body': {
                                        'kind': 'DataInstantiation',
                                        'callee': {
                                          'name': 'Serial',
                                          'kind': 'SymbolExpression',
                                        },
                                        'parameters': [
                                          {
                                            'name': 's$rename$4',
                                            'kind': 'Identifier',
                                          },
                                        ],
                                      },
                                      'parameter': {
                                        'name': 's$rename$4',
                                        'kind': 'Identifier',
                                      },
                                      'kind': 'FunctionExpression',
                                      'implicit': false,
                                    },
                                    'kind': 'ScopeBinding',
                                  },
                                ],
                              },
                              'kind': 'ScopeBinding',
                            },
                          ],
                        },
                        'expression': {
                          'body': {
                            'body': {
                              'kind': 'DataInstantiation',
                              'callee': {
                                'name': 'Color',
                                'kind': 'SymbolExpression',
                              },
                              'parameters': [
                                {
                                  'name': 't$rename$5',
                                  'kind': 'Identifier',
                                },
                              ],
                            },
                            'parameter': {
                              'name': 't$rename$5',
                              'kind': 'Identifier',
                            },
                            'kind': 'FunctionExpression',
                            'implicit': false,
                          },
                          'kind': 'FunctionExpression',
                          'implicit': true,
                          'parameter': {
                            'kind': 'Application',
                            'callee': {
                              'name': 'Serial',
                              'kind': 'Identifier',
                            },
                            'parameter': {
                              'name': 't$rename$5',
                              'kind': 'Identifier',
                            },
                          },
                        },
                        'kind': 'ScopeBinding',
                      },
                    ],
                  },
                  'expression': {
                    'kind': 'DataInstantiation',
                    'callee': {
                      'name': 'Red',
                      'kind': 'SymbolExpression',
                    },
                    'parameters': [],
                  },
                  'kind': 'ScopeBinding',
                },
              ],
            },
            'kind': 'ScopeBinding',
          },
        ],
      };
      const value: Value = {
        'left': {
          'name': 'implicitBinding$13',
          'kind': 'FreeVariable',
        },
        'right': {
          'left': {
            'name': 'implicitBinding$8$copy$9',
            'kind': 'FreeVariable',
          },
          'right': {
            'parameters': [
              {
                'name': 't$rename$5$copy$10',
                'kind': 'FreeVariable',
              },
            ],
            'kind': 'DataValue',
            'name': {
              'kind': 'SymbolLiteral',
              'name': 'Serial',
            },
          },
          'kind': 'DualBinding',
        },
        'kind': 'DualBinding',
      };
      const bindingValue: Value = {
        'left': {
          'name': 'implicitBinding$8$copy$9',
          'kind': 'FreeVariable',
        },
        'right': {
          'parameters': [
            {
              'name': 't$rename$5$copy$10',
              'kind': 'FreeVariable',
            },
          ],
          'kind': 'DataValue',
          'name': {
            'kind': 'SymbolLiteral',
            'name': 'Serial',
          },
        },
        'kind': 'DualBinding',
      };
      console.log(canSatisfyShape(s, value, bindingValue));
      expect(canSatisfyShape(s, value, bindingValue)).toBeDefined();
    });

    it('blah 2', () => {
      const left: Value = {
        'kind': 'DualBinding',
        'left': {
          'name': 'implicitBinding$21$copy$26',
          'kind': 'FreeVariable',
        },
        'right': {
          'kind': 'DataValue',
          'name': {
            'kind': 'SymbolLiteral',
            'name': 'Serializable',
          },
          'parameters': [
            {
              'kind': 'SymbolLiteral',
              'name': 'Color',
            },
            {
              'kind': 'FreeVariable',
              'name': 'z$rename$9$copy$27',
            },
          ],
        },
      };
      const valueOf: Value = {
        'body': {
          'name': 'result$rename$6$copy$14$copy$19',
          'kind': 'FreeVariable',
        },
        'parameter': {
          'name': 'object$rename$7$copy$15$copy$18',
          'kind': 'FreeVariable',
        },
        'kind': 'FunctionLiteral',
      };
      const right: Value = {
        'kind': 'DataValue',
        'name': {
          'name': 'Serializable',
          'kind': 'SymbolLiteral',
        },
        'parameters': [
          {
            'kind': 'DataValue',
            'parameters': [
              {
                'kind': 'FreeVariable',
                'name': 't$rename$12',
              },
            ],
            'name': {
              'kind': 'SymbolLiteral',
              'name': 'Color',
            },
          },
          {
            'kind': 'RecordLiteral',
            'properties': {
              'valueOf': valueOf,
            },
          },
        ],
      };
      expect(canSatisfyShape(scope(), left, right)).toBeDefined();
    });
  });
});
