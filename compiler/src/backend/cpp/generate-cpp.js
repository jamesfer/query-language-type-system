"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCpp = exports.nodeToAstIterator = void 0;
const desugar_pattern_match_1 = require("../../desugar/desugar-pattern-match");
const visitor_utils_1 = require("../../type-checker/visitor-utils");
const unique_id_generator_1 = require("../../utils/unique-id-generator");
const convert_node_to_ast_1 = require("./convert-node-to-ast");
const monad_1 = require("./monad");
const print_cpp_ast_1 = require("./print-cpp-ast");
function nodeToAstIterator(node) {
    const internal = (node) => convert_node_to_ast_1.convertNodeToAst(visitor_utils_1.mapNode(iterator, node));
    const iterator = desugar_pattern_match_1.makePatternMatchDesugaredNodeIterator(internal);
    return internal(node);
}
exports.nodeToAstIterator = nodeToAstIterator;
function generateCpp(node) {
    const state = new monad_1.CombinedState({
        anonymousStructCache: new monad_1.MapState(),
        globalStatements: new monad_1.ArrayState(),
        localStatements: new monad_1.ArrayState(),
        makeUniqueId: new monad_1.FState(unique_id_generator_1.uniqueIdStream()),
    });
    const expression = nodeToAstIterator(node).run(state);
    const statements = [
        ...state.child('globalStatements').get(),
        {
            kind: 'Function',
            name: 'main',
            returnType: {
                kind: 'Type',
                value: 'void',
            },
            parameters: [],
            body: {
                kind: 'Block',
                statements: [
                    ...state.child('localStatements').get(),
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