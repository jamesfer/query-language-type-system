import { Application, BindingExpression, Expression, Node, NodeWithChild, TypedNode } from '../..';
import { zip, includes, mapValues, isEqual, sum, sortBy, flatMap, maxBy } from 'lodash';
import { dataValue } from '../../type-checker/constructors';
import { TypedDecoration } from '../../type-checker/type-check';
import {
  accumulateStates,
  accumulateStatesWithResult, accumulateStateWith,
  assertNever,
  checkedZip,
  permuteArrays, resultWithArg,
} from '../../type-checker/utils';
import {
  visitAndTransformExpression,
  visitAndTransformNode,
  visitNodes,
} from '../../type-checker/visitor-utils';
import {
  constructPath, getNodeAt,
  mapNodeAt,
  pathIsChild,
  pathIsEqual,
  prependPath, prependSegment,
  setPath,
} from './path-utils';

interface PatternIdentifier {
  kind: 'PatternIdentifier';
  name: string;
}

interface PatternPlaceholder {
  kind: 'PatternPlaceholder';
}

interface PatternLiteral {
  kind: 'PatternLiteral';
  value: any;
}

interface PatternData<T = void> {
  kind: 'PatternData';
  name: string;
  parameters: T[];
}

interface PatternFunction<T = void> {
  kind: 'PatternFunction';
  parameter: PatternIdentifier;
  body: T;
}

interface PatternApplication<T = void> {
  kind: 'PatternApplication';
  callee: T extends void ? PatternNode : T;
  parameter: T extends void ? PatternNode : T;
}

type PatternNode<T = void> =
  | PatternIdentifier
  | PatternPlaceholder
  | PatternLiteral
  | PatternData<T extends void ? PatternNode : T>
  | PatternFunction<T extends void ? PatternNode : T>
  | PatternApplication<T>;

interface PatternUsage {
  path: string[];
}

interface SinglePattern {
  node: PatternNode;
  path: string[];
}

interface Pattern {
  node: PatternNode;
  usages: PatternUsage[];
}

// function mergePatternIndexes(existingPatterns: Pattern[], newPatterns: Pattern[]): Pattern[] {
//
// }

export interface TypeAndPathDecoration {
  type: TypedDecoration;
  path: string[];
}

export type TypedNodeWithPath = Node<TypeAndPathDecoration>;

// function mapExpression<D, T>(node: NodeWithChild<D, T>, f: (expression: Expression<T>) => Expression<T>): NodeWithChild<D, T> {
//   const expression = f(node.expression);
//   if (expression !== node.expression) {
//     return { ...node, expression };
//   }
//   return node;
// }


// function attachPath(node: TypedNodeWithPath): TypedNodeWithPath {
//   const expression = constructPath(node.expression);
//   return setPath({ ...node, expression }, []);
// }

function convertExpressionToPatternNode(expression: Expression<PatternNode[]>): PatternNode[] {
  switch (expression.kind) {
    case 'Identifier':
      return [{
        kind: 'PatternIdentifier',
        name: expression.name,
      }];

    case 'BooleanExpression':
      return [{
        kind: 'PatternLiteral',
        value: expression.value,
      }];

    case 'NumberExpression':
      return [{
        kind: 'PatternLiteral',
        value: expression.value,
      }];

    case 'StringExpression':
      return [{
        kind: 'PatternLiteral',
        value: expression.value,
      }];

    case 'SymbolExpression':
      return [];

    case 'RecordExpression':
      return [];

    case 'Application':
      return permuteArrays([expression.callee, expression.parameter]).map(([callee, parameter]) => ({
        callee,
        parameter,
        kind: 'PatternApplication',
      }));

    case 'FunctionExpression':
      return [];

    case 'DataInstantiation':
      return [];

    case 'BindingExpression':
      return [];

    case 'DualExpression':
      return [];

    case 'ReadRecordPropertyExpression':
      return [];

    case 'ReadDataPropertyExpression':
      return [];

    case 'PatternMatchExpression':
      return [];

    case 'NativeExpression':
      return [];

    default:
      return assertNever(expression);
  }
}

function convertNodeToPatternNode(node: NodeWithChild<TypeAndPathDecoration, PatternNode[]>): PatternNode[] {
  return convertExpressionToPatternNode(node.expression);
}

function accumulateStatesWithMapper<I, O, S>(visitor: (input: I) => O[], f: (input: I, state: O[]) => S[]): [() => S[], (input: I) => O[]] {
  return accumulateStatesWithResult((input) => {
    const results = visitor(input);
    const states = f(input, results);
    return [states, results];
  });
}

function collectAndDedupPatterns(patterns: Pattern[], nodes: SinglePattern[]): Pattern[] {
  return nodes.reduce<Pattern[]>(
    (collection, { node, path }) => {
      const matchingIndex = collection.findIndex(pattern => isEqual(pattern.node, node));
      if (matchingIndex !== -1) {
        collection[matchingIndex].usages.push({ path });
      }

      collection.push({
        node,
        usages: [{ path }],
      });

      return collection;
    },
    patterns,
  );
}

function collectPatternUsages(visitor: (input: NodeWithChild<TypeAndPathDecoration, PatternNode[]>) => PatternNode[]): [() => Pattern[], (input: NodeWithChild<TypeAndPathDecoration, PatternNode[]>) => PatternNode[]] {
  const a = (input: NodeWithChild<TypeAndPathDecoration, PatternNode[]>): [SinglePattern[], PatternNode[]] => {
    const nodes = visitor(input);
    const patterns = nodes.map(node => ({ node, path: input.decoration.path }))
      .filter(({ node }) => !(
        node.kind === 'PatternIdentifier'
        || node.kind === 'PatternPlaceholder'
        || node.kind === 'PatternLiteral'
        || node.kind === 'PatternApplication'
        && node.callee.kind === 'PatternPlaceholder'
      ));
    return [patterns, nodes];
  };

  return accumulateStateWith<
    Pattern[],
    NodeWithChild<TypeAndPathDecoration, PatternNode[]>,
    PatternNode[],
    SinglePattern[]
  >([], collectAndDedupPatterns)(a);
}

function insertPlaceholders<T>(visitor: (expression: T) => PatternNode[]): (expression: T) => PatternNode[] {
  return (expression) => {
    const result = visitor(expression);
    return result.some(node => node.kind === 'PatternPlaceholder') ? result : [
      ...result,
      { kind: 'PatternPlaceholder' },
    ];
  }
}


function recordPatterns(node: TypedNodeWithPath): Pattern[] {
  // Iterate over node
  // Call `convertToPatternNode` at each step
  // On the side, record the results of each call
  // At each level insert a possibility that a node could be an identifier if it is not already so
  // By the end we would have collected all the possible trees in the node

  const [getResults, patternNodeConverter] = collectPatternUsages(convertNodeToPatternNode);
  const finalVisitor = insertPlaceholders(patternNodeConverter);
  visitAndTransformNode<TypeAndPathDecoration, PatternNode[]>(finalVisitor)(node);
  const strings = getResults().filter(s => s.usages.length > 1).map(s => `${s.usages.length}  ${toString(s.node)}`);
  console.log(sortBy(strings, 'length').join('\n'));

  const results = getResults();
  return results;
}

function visitAndTransformPatternNode<T>(visitor: (node: PatternNode<T>) => T extends void ? PatternNode : T): (node: PatternNode) => T extends void ? PatternNode : T {
  const recurse = (node: PatternNode): T extends void ? PatternNode : T => {
    switch (node.kind) {
      case 'PatternIdentifier':
      case 'PatternPlaceholder':
      case 'PatternLiteral':
        return visitor(node);

      case 'PatternData':
        return visitor({
          ...node,
          parameters: node.parameters.map(recurse),
        });

      case 'PatternFunction':
        return visitor({
          ...node,
          // parameter: recurse(node.parameter),
          body: recurse(node.body),
        });

      case 'PatternApplication':
        return visitor({
          ...node,
          callee: recurse(node.callee),
          parameter: recurse(node.parameter),
        });

      default:
        return assertNever(node);
    }
  };
  return recurse;
}

// function visitAndTransformPatternNodeBefore<T>(visitor: (node: PatternNode<T>) => PatternNode<T>): (node: PatternNode) => PatternNode {
//   const recurse = (node: PatternNode): T extends void ? PatternNode : T => {
//     switch (node.kind) {
//       case 'PatternIdentifier':
//       case 'PatternPlaceholder':
//       case 'PatternLiteral':
//         return visitor(node);
//
//       case 'PatternData':
//         return visitor({
//           ...node,
//           parameters: node.parameters.map(recurse),
//         });
//
//       case 'PatternFunction':
//         return visitor({
//           ...node,
//           // parameter: recurse(node.parameter),
//           body: recurse(node.body),
//         });
//
//       case 'PatternApplication':
//         return visitor({
//           ...node,
//           callee: recurse(node.callee),
//           parameter: recurse(node.parameter),
//         });
//
//       default:
//         return assertNever(node);
//     }
//   };
//   return recurse;
// }

const patternCost = visitAndTransformPatternNode<number>((node) => {
  switch (node.kind) {
    case 'PatternIdentifier':
      return 1;

    case 'PatternPlaceholder':
      return 0;

    case 'PatternLiteral':
      return `${node.value}`.length;

    case 'PatternData':
      return 5 + sum(node.parameters);

    case 'PatternFunction':
      return 5 + node.body;

    case 'PatternApplication':
      return 2 + node.callee + node.parameter;

    default:
      return assertNever(node);
  }
});

function findBestPattern(patterns: Pattern[]): [Pattern, Pattern[]] {
  const costed = patterns.map(({ node, usages }) => {
    return ({ node, usages, cost: patternCost(node) * usages.length });
  });
  const best = maxBy(costed, 'cost');
  if (!best) {
    throw new Error('Failed to find best pattern');
  }

  const removedCost = costed.filter(a => a !== best).map(({ node, usages }) => ({ node, usages }));
  return [{ node: best.node, usages: best.usages }, removedCost];
}

// function reindexNode(patterns: Pattern[], node: TypedNode): Pattern[] {
//   // TODO make sure the paths are all correct of the new node after the base has been transformed
//   //  with a new let binding
// }

function prependPatternPath<T>(segment: string): (x: [string[], T]) => [string[], T] {
  return ([path, value]) => [[segment, ...path], value];
}

function findPlaceholderPaths(patternNode: PatternNode): string[][] {
  return visitAndTransformPatternNode<string[][]>((node) => {
    switch (node.kind) {
      case 'PatternIdentifier':
      case 'PatternLiteral':
        return [];

      case 'PatternPlaceholder':
        return [[]];

      case 'PatternData':
        return flatMap(node.parameters, (parameter, index) => (
          parameter.map(prependSegment(`${index}`))
        ));

      case 'PatternFunction':
        return node.body.map(prependSegment('body'));

      case 'PatternApplication':
        return [
          ...node.callee.map(prependSegment('callee')),
          ...node.parameter.map(prependSegment('parameter')),
        ];
    }
  })(patternNode);
}

function makePlaceholdersGeneric(placeholderPaths: [string[], string][], node: TypedNodeWithPath): TypedNodeWithPath {
  // Replace all the locations that contained placeholders with identifiers
  const nodeWithoutPlaceholders = placeholderPaths.reduce<TypedNodeWithPath>(
    (node, [path, identifier]) => {
      return mapNodeAt(node, path, (node) => ({
        ...node,
        expression: {
          kind: 'Identifier',
          name: identifier,
        },
      }));
    },
    node,
  );

  // Wrap the node with functions that contain all of the placeholders
  return placeholderPaths.reduceRight<TypedNodeWithPath>(
    (node, [, identifier]): TypedNodeWithPath => {
      return {
        kind: 'Node',
        expression: {
          kind: 'FunctionExpression',
          implicit: false,
          body: prependPath(node, 'body'),
          parameter: {
            kind: 'Identifier',
            name: identifier,
          },
        },
        decoration: node.decoration,
      };
    },
    nodeWithoutPlaceholders,
  );
}

function extractPattern(pattern: Pattern, identifier: string, node: TypedNodeWithPath): { extracted: TypedNodeWithPath, base: TypedNodeWithPath } {
  // Transform all occurrences of a pattern into an identifier and return the extracted block along
  // with the new base node
  const placeholderPaths = findPlaceholderPaths(pattern.node);
  const pathsWithIdentifiers = placeholderPaths.map<[string[], string]>((path, index) => [path, `${identifier}$placeholder$${index}`]);

  let extracted: TypedNodeWithPath | undefined = undefined;
  const base = pattern.usages.reduce<TypedNodeWithPath>(
    (node, usage) => {
      extracted = node;
      return mapNodeAt(node, usage.path, node => ({
        ...node,
        expression: pathsWithIdentifiers.reduce<Expression<TypedNodeWithPath>>(
          (callee, [path]): Application<TypedNodeWithPath> => {
            return {
              callee: {
                kind: 'Node',
                expression: callee,
                decoration: node.decoration,
              },
              kind: 'Application',
              parameter: getNodeAt(node, path),
            };
          },
          {
            kind: 'Identifier',
            name: identifier,
          },
        ),
      }));
    },
    node,
  );

  if (!extracted) {
    throw new Error('Could not extract pattern because there were no usages of it');
  }

  return { extracted: makePlaceholdersGeneric(pathsWithIdentifiers, extracted), base };
}

function updatePatternIndex(usedPattern: Pattern, patterns: Pattern[]): Pattern[] {
  // Update or remove any usages in patterns that are now invalid after usedPattern has been extracted
  return flatMap(patterns, (pattern) => {
    // Only keep usages that occur outside the used pattern
    const remainingUsages = pattern.usages.filter(usage => (
      usedPattern.usages.every(consumedUsage => !pathIsChild(consumedUsage.path, usage.path))
    ));

    return remainingUsages.length === 0 ? [] : [{
      ...pattern,
      usages: remainingUsages,
    }];
  });
}

function insertPattern(identifier: string, base: TypedNodeWithPath, extracted: TypedNodeWithPath, patterns: Pattern[]): [TypedNodeWithPath, Pattern[]] {
  // Insert the extracted expression into the base and then update all the paths of the pattern so
  // they remain correct
  const baseWithCorrectPath = visitAndTransformNode<TypeAndPathDecoration, TypedNodeWithPath>((node) => prependPath(node, 'body'))(base);
  const newNode: TypedNodeWithPath = {
    kind: 'Node',
    expression: {
      kind: 'BindingExpression',
      name: identifier,
      value: extracted,
      body: baseWithCorrectPath,
    },
    decoration: {
      type: base.decoration.type,
      path: [],
    },
  };

  const updatedIndex = patterns.map(pattern => ({
    ...pattern,
    usages: pattern.usages.map(usage => ({ path: ['body', ...usage.path] })),
  }));

  return [newNode, updatedIndex];
}

function applyBestPattern(identifier: string, node: TypedNodeWithPath, patterns: Pattern[]): [TypedNodeWithPath, Pattern[]] {
  const [bestPattern, otherPatterns] = findBestPattern(patterns);
  const reindexedPatterns = updatePatternIndex(bestPattern, otherPatterns);
  const { extracted, base } = extractPattern(bestPattern, identifier, node);
  return insertPattern(identifier, base, extracted, reindexedPatterns);
}

function toString(patternNode: PatternNode): string {
  switch (patternNode.kind) {
    case 'PatternIdentifier':
      return patternNode.name;

    case 'PatternPlaceholder':
      return '_';

    case 'PatternLiteral':
      return patternNode.value;

    case 'PatternData':
      return `${patternNode.name}[${patternNode.parameters.map(toString).join(', ')}]`;

    case 'PatternFunction':
      return `${toString(patternNode.parameter)} -> ${toString(patternNode.body)}`;

    case 'PatternApplication':
      return ['PatternIdentifier', 'PatternLiteral', 'PatternPlaceholder'].includes(patternNode.parameter.kind)
        ? `${toString(patternNode.callee)} ${toString(patternNode.parameter)}`
        : `${toString(patternNode.callee)} (${toString(patternNode.parameter)})`;

    default:
      return assertNever(patternNode);
  }
}

function removeIrrelevantPatterns(patterns: Pattern[]): Pattern[] {
  return patterns.filter((pattern) => pattern.usages.length > 1)
}

function nameGenerator(prefix: string): () => string {
  let index = 0;
  return () => `${prefix}${index++}`;
}

export function dedup(node: TypedNode): TypedNode {
  const nodeWithEmptyPath = visitAndTransformNode<TypedDecoration, TypedNodeWithPath>(node => setPath(node, []))(node);
  let nodeWithPath = visitNodes<TypeAndPathDecoration>({
    before(node) {
      return {
        ...node,
        expression: constructPath(node.decoration.path, node.expression),
      };
    },
  })(nodeWithEmptyPath);

  // Iterate over the tree and record every combination of each tree.
  const patterns1 = recordPatterns(nodeWithPath);
  let patterns = removeIrrelevantPatterns(patterns1);

  // const costed = patterns.map(({ node, usages }) => {
  //   return ({ node, usages, cost: patternCost(node) * usages.length });
  // });
  // const sorted = sortBy(costed, 'cost');
  // console.log(sorted.map((pattern) => `Usages ${`${pattern.usages.length}`.padEnd(4, ' ')} Cost ${`${pattern.cost}`.padEnd(3, ' ')} ${toString(pattern.node)}`).join('\n'));


  // Find the most valuable tree to extract
  //  - Extract it into a binding and replace every usage with its identifier
  //  - Update the index with the usages that were removed
  //  - Reindex the newly inserted binging
  const nextName = nameGenerator('$extracted$');
  while (patterns.length > 0) {
    ([nodeWithPath, patterns] = applyBestPattern(nextName(), nodeWithPath, patterns));
  }

  // Remove path decoration
  return visitAndTransformNode<TypeAndPathDecoration, TypedNode>(node => ({
    ...node,
    decoration: node.decoration.type,
  }))(nodeWithPath);
}
