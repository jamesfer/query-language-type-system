"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("./constructors");
const type_utils_1 = require("./type-utils");
describe('type-utils', () => {
    describe('canSatisfyShape', () => {
        it('is successful for two dual bindings', () => {
            const bindingValue = {
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
            const value = {
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
            expect(type_utils_1.canSatisfyShape(constructors_1.scope(), value, bindingValue)).toBeDefined();
        });
        it('is successful for two dual bindings with a value in the scope', () => {
            const bindingValue = {
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
            const value = {
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
            const s = constructors_1.scope({
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
                        scope: constructors_1.scope(),
                    }],
            });
            expect(type_utils_1.canSatisfyShape(s, value, bindingValue)).toBeDefined();
        });
        // it('blah', () => {
        //   const s: Scope = {
        //     'bindings': [
        //       {
        //         'name': 'Serial',
        //         'type': {
        //           'body': {
        //             'parameters': [
        //               {
        //                 'name': 's$rename$4',
        //                 'kind': 'FreeVariable',
        //               },
        //             ],
        //             'name': {
        //               'name': 'Serial',
        //               'kind': 'SymbolLiteral',
        //             },
        //             'kind': 'DataValue',
        //           },
        //           'kind': 'FunctionLiteral',
        //           'parameter': {
        //             'name': 's$rename$4',
        //             'kind': 'FreeVariable',
        //           },
        //         },
        //         'scope': {
        //           'bindings': [],
        //         },
        //         'expression': {
        //           'body': {
        //             'kind': 'DataInstantiation',
        //             'callee': {
        //               'name': 'Serial',
        //               'kind': 'SymbolExpression',
        //             },
        //             parameterShapes: [
        //               [{
        //                 'name': 's$rename$4',
        //                 'kind': 'Identifier',
        //               }, false],
        //             ],
        //             'parameters': [
        //               {
        //                 'name': 's$rename$4',
        //                 'kind': 'Identifier',
        //               },
        //             ],
        //           },
        //           'parameter': {
        //             'name': 's$rename$4',
        //             'kind': 'Identifier',
        //           },
        //           'kind': 'FunctionExpression',
        //           'implicit': false,
        //         },
        //         'kind': 'ScopeBinding',
        //       },
        //       {
        //         'name': 'Color',
        //         'type': {
        //           'body': {
        //             'body': {
        //               'parameters': [
        //                 {
        //                   'name': 't$rename$5',
        //                   'kind': 'FreeVariable',
        //                 },
        //               ],
        //               'name': {
        //                 'name': 'Color',
        //                 'kind': 'SymbolLiteral',
        //               },
        //               'kind': 'DataValue',
        //             },
        //             'kind': 'FunctionLiteral',
        //             'parameter': {
        //               'name': 't$rename$5',
        //               'kind': 'FreeVariable',
        //             },
        //           },
        //           'kind': 'ImplicitFunctionLiteral',
        //           'parameter': {
        //             'left': {
        //               'name': 'implicitBinding$8',
        //               'kind': 'FreeVariable',
        //             },
        //             'right': {
        //               'parameters': [
        //                 {
        //                   'name': 't$rename$5',
        //                   'kind': 'FreeVariable',
        //                 },
        //               ],
        //               'kind': 'DataValue',
        //               'name': {
        //                 'kind': 'SymbolLiteral',
        //                 'name': 'Serial',
        //               },
        //             },
        //             'kind': 'DualBinding',
        //           },
        //         },
        //         'scope': {
        //           'bindings': [
        //             {
        //               'name': 'Serial',
        //               'type': {
        //                 'body': {
        //                   'parameters': [
        //                     {
        //                       'name': 's$rename$4',
        //                       'kind': 'FreeVariable',
        //                     },
        //                   ],
        //                   'name': {
        //                     'name': 'Serial',
        //                     'kind': 'SymbolLiteral',
        //                   },
        //                   'kind': 'DataValue',
        //                 },
        //                 'kind': 'FunctionLiteral',
        //                 'parameter': {
        //                   'name': 's$rename$4',
        //                   'kind': 'FreeVariable',
        //                 },
        //               },
        //               'scope': {
        //                 'bindings': [],
        //               },
        //               'expression': {
        //                 'body': {
        //                   'kind': 'DataInstantiation',
        //                   'callee': {
        //                     'name': 'Serial',
        //                     'kind': 'SymbolExpression',
        //                   },
        //                   'parameters': [
        //                     {
        //                       'name': 's$rename$4',
        //                       'kind': 'Identifier',
        //                     },
        //                   ],
        //                 },
        //                 'parameter': {
        //                   'name': 's$rename$4',
        //                   'kind': 'Identifier',
        //                 },
        //                 'kind': 'FunctionExpression',
        //                 'implicit': false,
        //               },
        //               'kind': 'ScopeBinding',
        //             },
        //             {
        //               'name': 'implicitBinding$8',
        //               'type': {
        //                 'parameters': [
        //                   {
        //                     'name': 't$rename$5',
        //                     'kind': 'FreeVariable',
        //                   },
        //                 ],
        //                 'kind': 'DataValue',
        //                 'name': {
        //                   'kind': 'SymbolLiteral',
        //                   'name': 'Serial',
        //                 },
        //               },
        //               'scope': {
        //                 'bindings': [
        //                   {
        //                     'name': 'Serial',
        //                     'type': {
        //                       'body': {
        //                         'parameters': [
        //                           {
        //                             'name': 's$rename$4',
        //                             'kind': 'FreeVariable',
        //                           },
        //                         ],
        //                         'name': {
        //                           'name': 'Serial',
        //                           'kind': 'SymbolLiteral',
        //                         },
        //                         'kind': 'DataValue',
        //                       },
        //                       'kind': 'FunctionLiteral',
        //                       'parameter': {
        //                         'name': 's$rename$4',
        //                         'kind': 'FreeVariable',
        //                       },
        //                     },
        //                     'scope': {
        //                       'bindings': [],
        //                     },
        //                     'expression': {
        //                       'body': {
        //                         'kind': 'DataInstantiation',
        //                         'callee': {
        //                           'name': 'Serial',
        //                           'kind': 'SymbolExpression',
        //                         },
        //                         'parameters': [
        //                           {
        //                             'name': 's$rename$4',
        //                             'kind': 'Identifier',
        //                           },
        //                         ],
        //                       },
        //                       'parameter': {
        //                         'name': 's$rename$4',
        //                         'kind': 'Identifier',
        //                       },
        //                       'kind': 'FunctionExpression',
        //                       'implicit': false,
        //                     },
        //                     'kind': 'ScopeBinding',
        //                   },
        //                 ],
        //               },
        //               'kind': 'ScopeBinding',
        //             },
        //           ],
        //         },
        //         'expression': {
        //           'body': {
        //             'body': {
        //               'kind': 'DataInstantiation',
        //               'callee': {
        //                 'name': 'Color',
        //                 'kind': 'SymbolExpression',
        //               },
        //               'parameters': [
        //                 {
        //                   'name': 't$rename$5',
        //                   'kind': 'Identifier',
        //                 },
        //               ],
        //             },
        //             'parameter': {
        //               'name': 't$rename$5',
        //               'kind': 'Identifier',
        //             },
        //             'kind': 'FunctionExpression',
        //             'implicit': false,
        //           },
        //           'kind': 'FunctionExpression',
        //           'implicit': true,
        //           'parameter': {
        //             'kind': 'Application',
        //             'callee': {
        //               'name': 'Serial',
        //               'kind': 'Identifier',
        //             },
        //             'parameter': {
        //               'name': 't$rename$5',
        //               'kind': 'Identifier',
        //             },
        //           },
        //         },
        //         'kind': 'ScopeBinding',
        //       },
        //       {
        //         'name': 'Red',
        //         'type': {
        //           'parameters': [],
        //           'name': {
        //             'name': 'Red',
        //             'kind': 'SymbolLiteral',
        //           },
        //           'kind': 'DataValue',
        //         },
        //         'scope': {
        //           'bindings': [
        //             {
        //               'name': 'Serial',
        //               'type': {
        //                 'body': {
        //                   'parameters': [
        //                     {
        //                       'name': 's$rename$4',
        //                       'kind': 'FreeVariable',
        //                     },
        //                   ],
        //                   'name': {
        //                     'name': 'Serial',
        //                     'kind': 'SymbolLiteral',
        //                   },
        //                   'kind': 'DataValue',
        //                 },
        //                 'kind': 'FunctionLiteral',
        //                 'parameter': {
        //                   'name': 's$rename$4',
        //                   'kind': 'FreeVariable',
        //                 },
        //               },
        //               'scope': {
        //                 'bindings': [],
        //               },
        //               'expression': {
        //                 'body': {
        //                   'kind': 'DataInstantiation',
        //                   'callee': {
        //                     'name': 'Serial',
        //                     'kind': 'SymbolExpression',
        //                   },
        //                   'parameters': [
        //                     {
        //                       'name': 's$rename$4',
        //                       'kind': 'Identifier',
        //                     },
        //                   ],
        //                 },
        //                 'parameter': {
        //                   'name': 's$rename$4',
        //                   'kind': 'Identifier',
        //                 },
        //                 'kind': 'FunctionExpression',
        //                 'implicit': false,
        //               },
        //               'kind': 'ScopeBinding',
        //             },
        //             {
        //               'name': 'Color',
        //               'type': {
        //                 'body': {
        //                   'body': {
        //                     'parameters': [
        //                       {
        //                         'name': 't$rename$5',
        //                         'kind': 'FreeVariable',
        //                       },
        //                     ],
        //                     'name': {
        //                       'name': 'Color',
        //                       'kind': 'SymbolLiteral',
        //                     },
        //                     'kind': 'DataValue',
        //                   },
        //                   'kind': 'FunctionLiteral',
        //                   'parameter': {
        //                     'name': 't$rename$5',
        //                     'kind': 'FreeVariable',
        //                   },
        //                 },
        //                 'kind': 'ImplicitFunctionLiteral',
        //                 'parameter': {
        //                   'left': {
        //                     'name': 'implicitBinding$8',
        //                     'kind': 'FreeVariable',
        //                   },
        //                   'right': {
        //                     'parameters': [
        //                       {
        //                         'name': 't$rename$5',
        //                         'kind': 'FreeVariable',
        //                       },
        //                     ],
        //                     'kind': 'DataValue',
        //                     'name': {
        //                       'kind': 'SymbolLiteral',
        //                       'name': 'Serial',
        //                     },
        //                   },
        //                   'kind': 'DualBinding',
        //                 },
        //               },
        //               'scope': {
        //                 'bindings': [
        //                   {
        //                     'name': 'Serial',
        //                     'type': {
        //                       'body': {
        //                         'parameters': [
        //                           {
        //                             'name': 's$rename$4',
        //                             'kind': 'FreeVariable',
        //                           },
        //                         ],
        //                         'name': {
        //                           'name': 'Serial',
        //                           'kind': 'SymbolLiteral',
        //                         },
        //                         'kind': 'DataValue',
        //                       },
        //                       'kind': 'FunctionLiteral',
        //                       'parameter': {
        //                         'name': 's$rename$4',
        //                         'kind': 'FreeVariable',
        //                       },
        //                     },
        //                     'scope': {
        //                       'bindings': [],
        //                     },
        //                     'expression': {
        //                       'body': {
        //                         'kind': 'DataInstantiation',
        //                         'callee': {
        //                           'name': 'Serial',
        //                           'kind': 'SymbolExpression',
        //                         },
        //                         'parameters': [
        //                           {
        //                             'name': 's$rename$4',
        //                             'kind': 'Identifier',
        //                           },
        //                         ],
        //                       },
        //                       'parameter': {
        //                         'name': 's$rename$4',
        //                         'kind': 'Identifier',
        //                       },
        //                       'kind': 'FunctionExpression',
        //                       'implicit': false,
        //                     },
        //                     'kind': 'ScopeBinding',
        //                   },
        //                   {
        //                     'name': 'implicitBinding$8',
        //                     'type': {
        //                       'parameters': [
        //                         {
        //                           'name': 't$rename$5',
        //                           'kind': 'FreeVariable',
        //                         },
        //                       ],
        //                       'kind': 'DataValue',
        //                       'name': {
        //                         'kind': 'SymbolLiteral',
        //                         'name': 'Serial',
        //                       },
        //                     },
        //                     'scope': {
        //                       'bindings': [
        //                         {
        //                           'name': 'Serial',
        //                           'type': {
        //                             'body': {
        //                               'parameters': [
        //                                 {
        //                                   'name': 's$rename$4',
        //                                   'kind': 'FreeVariable',
        //                                 },
        //                               ],
        //                               'name': {
        //                                 'name': 'Serial',
        //                                 'kind': 'SymbolLiteral',
        //                               },
        //                               'kind': 'DataValue',
        //                             },
        //                             'kind': 'FunctionLiteral',
        //                             'parameter': {
        //                               'name': 's$rename$4',
        //                               'kind': 'FreeVariable',
        //                             },
        //                           },
        //                           'scope': {
        //                             'bindings': [],
        //                           },
        //                           'expression': {
        //                             'body': {
        //                               'kind': 'DataInstantiation',
        //                               'callee': {
        //                                 'name': 'Serial',
        //                                 'kind': 'SymbolExpression',
        //                               },
        //                               'parameters': [
        //                                 {
        //                                   'name': 's$rename$4',
        //                                   'kind': 'Identifier',
        //                                 },
        //                               ],
        //                             },
        //                             'parameter': {
        //                               'name': 's$rename$4',
        //                               'kind': 'Identifier',
        //                             },
        //                             'kind': 'FunctionExpression',
        //                             'implicit': false,
        //                           },
        //                           'kind': 'ScopeBinding',
        //                         },
        //                       ],
        //                     },
        //                     'kind': 'ScopeBinding',
        //                   },
        //                 ],
        //               },
        //               'expression': {
        //                 'body': {
        //                   'body': {
        //                     'kind': 'DataInstantiation',
        //                     'callee': {
        //                       'name': 'Color',
        //                       'kind': 'SymbolExpression',
        //                     },
        //                     'parameters': [
        //                       {
        //                         'name': 't$rename$5',
        //                         'kind': 'Identifier',
        //                       },
        //                     ],
        //                   },
        //                   'parameter': {
        //                     'name': 't$rename$5',
        //                     'kind': 'Identifier',
        //                   },
        //                   'kind': 'FunctionExpression',
        //                   'implicit': false,
        //                 },
        //                 'kind': 'FunctionExpression',
        //                 'implicit': true,
        //                 'parameter': {
        //                   'kind': 'Application',
        //                   'callee': {
        //                     'name': 'Serial',
        //                     'kind': 'Identifier',
        //                   },
        //                   'parameter': {
        //                     'name': 't$rename$5',
        //                     'kind': 'Identifier',
        //                   },
        //                 },
        //               },
        //               'kind': 'ScopeBinding',
        //             },
        //           ],
        //         },
        //         'expression': {
        //           'kind': 'DataInstantiation',
        //           'callee': {
        //             'name': 'Red',
        //             'kind': 'SymbolExpression',
        //           },
        //           'parameters': [],
        //         },
        //         'kind': 'ScopeBinding',
        //       },
        //       {
        //         'name': 'implicitBinding$13',
        //         'type': {
        //           'left': {
        //             'name': 'implicitBinding$8$copy$9',
        //             'kind': 'FreeVariable',
        //           },
        //           'right': {
        //             'parameters': [
        //               {
        //                 'name': 't$rename$5$copy$10',
        //                 'kind': 'FreeVariable',
        //               },
        //             ],
        //             'kind': 'DataValue',
        //             'name': {
        //               'kind': 'SymbolLiteral',
        //               'name': 'Serial',
        //             },
        //           },
        //           'kind': 'DualBinding',
        //         },
        //         'scope': {
        //           'bindings': [
        //             {
        //               'name': 'Serial',
        //               'type': {
        //                 'body': {
        //                   'parameters': [
        //                     {
        //                       'name': 's$rename$4',
        //                       'kind': 'FreeVariable',
        //                     },
        //                   ],
        //                   'name': {
        //                     'name': 'Serial',
        //                     'kind': 'SymbolLiteral',
        //                   },
        //                   'kind': 'DataValue',
        //                 },
        //                 'kind': 'FunctionLiteral',
        //                 'parameter': {
        //                   'name': 's$rename$4',
        //                   'kind': 'FreeVariable',
        //                 },
        //               },
        //               'scope': {
        //                 'bindings': [],
        //               },
        //               'expression': {
        //                 'body': {
        //                   'kind': 'DataInstantiation',
        //                   'callee': {
        //                     'name': 'Serial',
        //                     'kind': 'SymbolExpression',
        //                   },
        //                   'parameters': [
        //                     {
        //                       'name': 's$rename$4',
        //                       'kind': 'Identifier',
        //                     },
        //                   ],
        //                 },
        //                 'parameter': {
        //                   'name': 's$rename$4',
        //                   'kind': 'Identifier',
        //                 },
        //                 'kind': 'FunctionExpression',
        //                 'implicit': false,
        //               },
        //               'kind': 'ScopeBinding',
        //             },
        //             {
        //               'name': 'Color',
        //               'type': {
        //                 'body': {
        //                   'body': {
        //                     'parameters': [
        //                       {
        //                         'name': 't$rename$5',
        //                         'kind': 'FreeVariable',
        //                       },
        //                     ],
        //                     'name': {
        //                       'name': 'Color',
        //                       'kind': 'SymbolLiteral',
        //                     },
        //                     'kind': 'DataValue',
        //                   },
        //                   'kind': 'FunctionLiteral',
        //                   'parameter': {
        //                     'name': 't$rename$5',
        //                     'kind': 'FreeVariable',
        //                   },
        //                 },
        //                 'kind': 'ImplicitFunctionLiteral',
        //                 'parameter': {
        //                   'left': {
        //                     'name': 'implicitBinding$8',
        //                     'kind': 'FreeVariable',
        //                   },
        //                   'right': {
        //                     'parameters': [
        //                       {
        //                         'name': 't$rename$5',
        //                         'kind': 'FreeVariable',
        //                       },
        //                     ],
        //                     'kind': 'DataValue',
        //                     'name': {
        //                       'kind': 'SymbolLiteral',
        //                       'name': 'Serial',
        //                     },
        //                   },
        //                   'kind': 'DualBinding',
        //                 },
        //               },
        //               'scope': {
        //                 'bindings': [
        //                   {
        //                     'name': 'Serial',
        //                     'type': {
        //                       'body': {
        //                         'parameters': [
        //                           {
        //                             'name': 's$rename$4',
        //                             'kind': 'FreeVariable',
        //                           },
        //                         ],
        //                         'name': {
        //                           'name': 'Serial',
        //                           'kind': 'SymbolLiteral',
        //                         },
        //                         'kind': 'DataValue',
        //                       },
        //                       'kind': 'FunctionLiteral',
        //                       'parameter': {
        //                         'name': 's$rename$4',
        //                         'kind': 'FreeVariable',
        //                       },
        //                     },
        //                     'scope': {
        //                       'bindings': [],
        //                     },
        //                     'expression': {
        //                       'body': {
        //                         'kind': 'DataInstantiation',
        //                         'callee': {
        //                           'name': 'Serial',
        //                           'kind': 'SymbolExpression',
        //                         },
        //                         'parameters': [
        //                           {
        //                             'name': 's$rename$4',
        //                             'kind': 'Identifier',
        //                           },
        //                         ],
        //                       },
        //                       'parameter': {
        //                         'name': 's$rename$4',
        //                         'kind': 'Identifier',
        //                       },
        //                       'kind': 'FunctionExpression',
        //                       'implicit': false,
        //                     },
        //                     'kind': 'ScopeBinding',
        //                   },
        //                   {
        //                     'name': 'implicitBinding$8',
        //                     'type': {
        //                       'parameters': [
        //                         {
        //                           'name': 't$rename$5',
        //                           'kind': 'FreeVariable',
        //                         },
        //                       ],
        //                       'kind': 'DataValue',
        //                       'name': {
        //                         'kind': 'SymbolLiteral',
        //                         'name': 'Serial',
        //                       },
        //                     },
        //                     'scope': {
        //                       'bindings': [
        //                         {
        //                           'name': 'Serial',
        //                           'type': {
        //                             'body': {
        //                               'parameters': [
        //                                 {
        //                                   'name': 's$rename$4',
        //                                   'kind': 'FreeVariable',
        //                                 },
        //                               ],
        //                               'name': {
        //                                 'name': 'Serial',
        //                                 'kind': 'SymbolLiteral',
        //                               },
        //                               'kind': 'DataValue',
        //                             },
        //                             'kind': 'FunctionLiteral',
        //                             'parameter': {
        //                               'name': 's$rename$4',
        //                               'kind': 'FreeVariable',
        //                             },
        //                           },
        //                           'scope': {
        //                             'bindings': [],
        //                           },
        //                           'expression': {
        //                             'body': {
        //                               'kind': 'DataInstantiation',
        //                               'callee': {
        //                                 'name': 'Serial',
        //                                 'kind': 'SymbolExpression',
        //                               },
        //                               'parameters': [
        //                                 {
        //                                   'name': 's$rename$4',
        //                                   'kind': 'Identifier',
        //                                 },
        //                               ],
        //                             },
        //                             'parameter': {
        //                               'name': 's$rename$4',
        //                               'kind': 'Identifier',
        //                             },
        //                             'kind': 'FunctionExpression',
        //                             'implicit': false,
        //                           },
        //                           'kind': 'ScopeBinding',
        //                         },
        //                       ],
        //                     },
        //                     'kind': 'ScopeBinding',
        //                   },
        //                 ],
        //               },
        //               'expression': {
        //                 'body': {
        //                   'body': {
        //                     'kind': 'DataInstantiation',
        //                     'callee': {
        //                       'name': 'Color',
        //                       'kind': 'SymbolExpression',
        //                     },
        //                     'parameters': [
        //                       {
        //                         'name': 't$rename$5',
        //                         'kind': 'Identifier',
        //                       },
        //                     ],
        //                   },
        //                   'parameter': {
        //                     'name': 't$rename$5',
        //                     'kind': 'Identifier',
        //                   },
        //                   'kind': 'FunctionExpression',
        //                   'implicit': false,
        //                 },
        //                 'kind': 'FunctionExpression',
        //                 'implicit': true,
        //                 'parameter': {
        //                   'kind': 'Application',
        //                   'callee': {
        //                     'name': 'Serial',
        //                     'kind': 'Identifier',
        //                   },
        //                   'parameter': {
        //                     'name': 't$rename$5',
        //                     'kind': 'Identifier',
        //                   },
        //                 },
        //               },
        //               'kind': 'ScopeBinding',
        //             },
        //             {
        //               'name': 'Red',
        //               'type': {
        //                 'parameters': [],
        //                 'name': {
        //                   'name': 'Red',
        //                   'kind': 'SymbolLiteral',
        //                 },
        //                 'kind': 'DataValue',
        //               },
        //               'scope': {
        //                 'bindings': [
        //                   {
        //                     'name': 'Serial',
        //                     'type': {
        //                       'body': {
        //                         'parameters': [
        //                           {
        //                             'name': 's$rename$4',
        //                             'kind': 'FreeVariable',
        //                           },
        //                         ],
        //                         'name': {
        //                           'name': 'Serial',
        //                           'kind': 'SymbolLiteral',
        //                         },
        //                         'kind': 'DataValue',
        //                       },
        //                       'kind': 'FunctionLiteral',
        //                       'parameter': {
        //                         'name': 's$rename$4',
        //                         'kind': 'FreeVariable',
        //                       },
        //                     },
        //                     'scope': {
        //                       'bindings': [],
        //                     },
        //                     'expression': {
        //                       'body': {
        //                         'kind': 'DataInstantiation',
        //                         'callee': {
        //                           'name': 'Serial',
        //                           'kind': 'SymbolExpression',
        //                         },
        //                         'parameters': [
        //                           {
        //                             'name': 's$rename$4',
        //                             'kind': 'Identifier',
        //                           },
        //                         ],
        //                       },
        //                       'parameter': {
        //                         'name': 's$rename$4',
        //                         'kind': 'Identifier',
        //                       },
        //                       'kind': 'FunctionExpression',
        //                       'implicit': false,
        //                     },
        //                     'kind': 'ScopeBinding',
        //                   },
        //                   {
        //                     'name': 'Color',
        //                     'type': {
        //                       'body': {
        //                         'body': {
        //                           'parameters': [
        //                             {
        //                               'name': 't$rename$5',
        //                               'kind': 'FreeVariable',
        //                             },
        //                           ],
        //                           'name': {
        //                             'name': 'Color',
        //                             'kind': 'SymbolLiteral',
        //                           },
        //                           'kind': 'DataValue',
        //                         },
        //                         'kind': 'FunctionLiteral',
        //                         'parameter': {
        //                           'name': 't$rename$5',
        //                           'kind': 'FreeVariable',
        //                         },
        //                       },
        //                       'kind': 'ImplicitFunctionLiteral',
        //                       'parameter': {
        //                         'left': {
        //                           'name': 'implicitBinding$8',
        //                           'kind': 'FreeVariable',
        //                         },
        //                         'right': {
        //                           'parameters': [
        //                             {
        //                               'name': 't$rename$5',
        //                               'kind': 'FreeVariable',
        //                             },
        //                           ],
        //                           'kind': 'DataValue',
        //                           'name': {
        //                             'kind': 'SymbolLiteral',
        //                             'name': 'Serial',
        //                           },
        //                         },
        //                         'kind': 'DualBinding',
        //                       },
        //                     },
        //                     'scope': {
        //                       'bindings': [
        //                         {
        //                           'name': 'Serial',
        //                           'type': {
        //                             'body': {
        //                               'parameters': [
        //                                 {
        //                                   'name': 's$rename$4',
        //                                   'kind': 'FreeVariable',
        //                                 },
        //                               ],
        //                               'name': {
        //                                 'name': 'Serial',
        //                                 'kind': 'SymbolLiteral',
        //                               },
        //                               'kind': 'DataValue',
        //                             },
        //                             'kind': 'FunctionLiteral',
        //                             'parameter': {
        //                               'name': 's$rename$4',
        //                               'kind': 'FreeVariable',
        //                             },
        //                           },
        //                           'scope': {
        //                             'bindings': [],
        //                           },
        //                           'expression': {
        //                             'body': {
        //                               'kind': 'DataInstantiation',
        //                               'callee': {
        //                                 'name': 'Serial',
        //                                 'kind': 'SymbolExpression',
        //                               },
        //                               'parameters': [
        //                                 {
        //                                   'name': 's$rename$4',
        //                                   'kind': 'Identifier',
        //                                 },
        //                               ],
        //                             },
        //                             'parameter': {
        //                               'name': 's$rename$4',
        //                               'kind': 'Identifier',
        //                             },
        //                             'kind': 'FunctionExpression',
        //                             'implicit': false,
        //                           },
        //                           'kind': 'ScopeBinding',
        //                         },
        //                         {
        //                           'name': 'implicitBinding$8',
        //                           'type': {
        //                             'parameters': [
        //                               {
        //                                 'name': 't$rename$5',
        //                                 'kind': 'FreeVariable',
        //                               },
        //                             ],
        //                             'kind': 'DataValue',
        //                             'name': {
        //                               'kind': 'SymbolLiteral',
        //                               'name': 'Serial',
        //                             },
        //                           },
        //                           'scope': {
        //                             'bindings': [
        //                               {
        //                                 'name': 'Serial',
        //                                 'type': {
        //                                   'body': {
        //                                     'parameters': [
        //                                       {
        //                                         'name': 's$rename$4',
        //                                         'kind': 'FreeVariable',
        //                                       },
        //                                     ],
        //                                     'name': {
        //                                       'name': 'Serial',
        //                                       'kind': 'SymbolLiteral',
        //                                     },
        //                                     'kind': 'DataValue',
        //                                   },
        //                                   'kind': 'FunctionLiteral',
        //                                   'parameter': {
        //                                     'name': 's$rename$4',
        //                                     'kind': 'FreeVariable',
        //                                   },
        //                                 },
        //                                 'scope': {
        //                                   'bindings': [],
        //                                 },
        //                                 'expression': {
        //                                   'body': {
        //                                     'kind': 'DataInstantiation',
        //                                     'callee': {
        //                                       'name': 'Serial',
        //                                       'kind': 'SymbolExpression',
        //                                     },
        //                                     'parameters': [
        //                                       {
        //                                         'name': 's$rename$4',
        //                                         'kind': 'Identifier',
        //                                       },
        //                                     ],
        //                                   },
        //                                   'parameter': {
        //                                     'name': 's$rename$4',
        //                                     'kind': 'Identifier',
        //                                   },
        //                                   'kind': 'FunctionExpression',
        //                                   'implicit': false,
        //                                 },
        //                                 'kind': 'ScopeBinding',
        //                               },
        //                             ],
        //                           },
        //                           'kind': 'ScopeBinding',
        //                         },
        //                       ],
        //                     },
        //                     'expression': {
        //                       'body': {
        //                         'body': {
        //                           'kind': 'DataInstantiation',
        //                           'callee': {
        //                             'name': 'Color',
        //                             'kind': 'SymbolExpression',
        //                           },
        //                           'parameters': [
        //                             {
        //                               'name': 't$rename$5',
        //                               'kind': 'Identifier',
        //                             },
        //                           ],
        //                         },
        //                         'parameter': {
        //                           'name': 't$rename$5',
        //                           'kind': 'Identifier',
        //                         },
        //                         'kind': 'FunctionExpression',
        //                         'implicit': false,
        //                       },
        //                       'kind': 'FunctionExpression',
        //                       'implicit': true,
        //                       'parameter': {
        //                         'kind': 'Application',
        //                         'callee': {
        //                           'name': 'Serial',
        //                           'kind': 'Identifier',
        //                         },
        //                         'parameter': {
        //                           'name': 't$rename$5',
        //                           'kind': 'Identifier',
        //                         },
        //                       },
        //                     },
        //                     'kind': 'ScopeBinding',
        //                   },
        //                 ],
        //               },
        //               'expression': {
        //                 'kind': 'DataInstantiation',
        //                 'callee': {
        //                   'name': 'Red',
        //                   'kind': 'SymbolExpression',
        //                 },
        //                 'parameters': [],
        //               },
        //               'kind': 'ScopeBinding',
        //             },
        //           ],
        //         },
        //         'kind': 'ScopeBinding',
        //       },
        //     ],
        //   };
        //   const value: Value = {
        //     'left': {
        //       'name': 'implicitBinding$13',
        //       'kind': 'FreeVariable',
        //     },
        //     'right': {
        //       'left': {
        //         'name': 'implicitBinding$8$copy$9',
        //         'kind': 'FreeVariable',
        //       },
        //       'right': {
        //         'parameters': [
        //           {
        //             'name': 't$rename$5$copy$10',
        //             'kind': 'FreeVariable',
        //           },
        //         ],
        //         'kind': 'DataValue',
        //         'name': {
        //           'kind': 'SymbolLiteral',
        //           'name': 'Serial',
        //         },
        //       },
        //       'kind': 'DualBinding',
        //     },
        //     'kind': 'DualBinding',
        //   };
        //   const bindingValue: Value = {
        //     'left': {
        //       'name': 'implicitBinding$8$copy$9',
        //       'kind': 'FreeVariable',
        //     },
        //     'right': {
        //       'parameters': [
        //         {
        //           'name': 't$rename$5$copy$10',
        //           'kind': 'FreeVariable',
        //         },
        //       ],
        //       'kind': 'DataValue',
        //       'name': {
        //         'kind': 'SymbolLiteral',
        //         'name': 'Serial',
        //       },
        //     },
        //     'kind': 'DualBinding',
        //   };
        //   expect(canSatisfyShape(s, value, bindingValue)).toBeDefined();
        // });
    });
});
//# sourceMappingURL=type-utils.test.js.map