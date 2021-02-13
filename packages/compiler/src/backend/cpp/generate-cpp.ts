import { CoreNode } from '../..';
import { makePatternMatchDesugaredNodeIterator } from '../../desugar/desugar-pattern-match';
import { mapNode } from '../../type-checker/visitor-utils';
import { UniqueIdGenerator } from '../../utils/unique-id-generator';
import { convertNodeToAst } from './convert-node-to-ast';
import { CppExpression, CppStatement } from './cpp-ast';
import { GenerateCppState } from './generate-cpp-state';
import { printCppAst } from './print-cpp-ast';

export function nodeToAstIterator(state: GenerateCppState, makeUniqueId: UniqueIdGenerator, node: CoreNode): CppExpression {
  const internal = (node: CoreNode): CppExpression => convertNodeToAst(state, makeUniqueId, mapNode(iterator, node));
  const iterator = makePatternMatchDesugaredNodeIterator(internal);
  return internal(node);
}

export function generateCpp(makeUniqueId: UniqueIdGenerator, node: CoreNode): string {
  const state = new GenerateCppState();
  const expression = nodeToAstIterator(state, makeUniqueId, node);
  const statements: CppStatement[] = [
    ...state.globalStatements.values,
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
          ...state.localStatements.values,
          {
            kind: 'ExpressionStatement',
            expression: expression,
          },
        ]
      }
    }
  ];
  return printCppAst(statements);
}
