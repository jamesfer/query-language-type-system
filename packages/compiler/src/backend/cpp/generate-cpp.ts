import { CoreNode } from '../..';
import {
  makePatternMatchDesugaredNodeIterator,
} from '../../desugar/desugar-pattern-match';
import { mapNode } from '../../type-checker/visitor-utils';
import { uniqueIdStream } from '../../utils/unique-id-generator';
import { convertNodeToAst } from './convert-node-to-ast';
import { CppExpression, CppStatement } from './cpp-ast';
import { ArrayState, CombinedState, FState, MapState, Monad } from './monad';
import { CppState } from './monad-state-operations';
import { printCppAst } from './print-cpp-ast';

export function nodeToAstIterator(node: CoreNode): Monad<CppState, CppExpression> {
  const internal = (node: CoreNode): Monad<CppState, CppExpression> => convertNodeToAst(mapNode(iterator, node));
  const iterator = makePatternMatchDesugaredNodeIterator(internal);
  return internal(node);
}

export function generateCpp(node: CoreNode): string {
  const state: CppState = new CombinedState({
    anonymousStructCache: new MapState<string, string>(),
    globalStatements: new ArrayState<CppStatement>(),
    localStatements: new ArrayState<CppStatement>(),
    makeUniqueId: new FState<[string], string>(uniqueIdStream()),
  });
  const expression = nodeToAstIterator(node).run(state);
  const statements: CppStatement[] = [
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
  return printCppAst(statements);
}
