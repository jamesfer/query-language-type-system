"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCpp = exports.nodeToAstIterator = void 0;
const desugar_pattern_match_1 = require("../../desugar/desugar-pattern-match");
const visitor_utils_1 = require("../../type-checker/visitor-utils");
const convert_node_to_ast_1 = require("./convert-node-to-ast");
const generate_cpp_state_1 = require("./generate-cpp-state");
const print_cpp_ast_1 = require("./print-cpp-ast");
function nodeToAstIterator(state, makeUniqueId, node) {
    const internal = (node) => convert_node_to_ast_1.convertNodeToAst(state, makeUniqueId, visitor_utils_1.mapNode(iterator, node));
    const iterator = desugar_pattern_match_1.makePatternMatchDesugaredNodeIterator(internal);
    return internal(node);
}
exports.nodeToAstIterator = nodeToAstIterator;
function generateCpp(makeUniqueId, node) {
    const state = new generate_cpp_state_1.GenerateCppState();
    const expression = nodeToAstIterator(state, makeUniqueId, node);
    const statements = [
        ...state.globalStatements.values,
        {
            kind: 'Function',
            name: 'main',
            returnType: {
                kind: 'Type',
                value: 'int',
            },
            parameters: [],
            body: {
                kind: 'Block',
                statements: [
                    ...state.localStatements.values,
                    {
                        kind: 'ExpressionStatement',
                        expression: expression,
                    },
                ]
            }
        }
    ];
    return print_cpp_ast_1.printCppAst(statements);
}
exports.generateCpp = generateCpp;
//# sourceMappingURL=generate-cpp.js.map