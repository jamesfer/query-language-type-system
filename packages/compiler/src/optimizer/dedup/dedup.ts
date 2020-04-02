import { flatMap, fromPairs, isEqual, map, maxBy, partition, sortBy, sum, zipObject, mapValues } from 'lodash';
import {
  Application,
  BindingExpression,
  Expression,
  Node,
  NodeWithChild,
  stripNode,
  TypedNode,
} from '../..';
import { evaluationScope, scope } from '../../type-checker/constructors';
import { evaluateExpression } from '../../type-checker/evaluate';
import { TypedDecoration } from '../../type-checker/type-check';
import {
  accumulateStates,
  accumulateStatesWithResult,
  accumulateStateWith,
  assertNever,
  permuteArrays,
} from '../../type-checker/utils';
import { getBindingsFromValue, usesVariable } from '../../type-checker/variable-utils';
import { visitAndTransformNode, visitNodes } from '../../type-checker/visitor-utils';
import {
  constructPath,
  getNodeAt,
  mapNodeAt,
  pathIsChild,
  prependPath,
  prependSegment,
  setPath,
} from './path-utils';

interface Dictionary<T> {
  [k: string]: T;
}

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

export interface TypeAndPathDecoration {
  type: TypedDecoration;
  path: string[];
}

export type TypedNodeWithPath = Node<TypeAndPathDecoration>;

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

function collectAndDedupPatterns(patternIndex: Dictionary<Pattern>, nodes: SinglePattern[]): Dictionary<Pattern> {
  return nodes.reduce<Dictionary<Pattern>>(
    (collection, { node, path }) => {
      const key = JSON.stringify(node);
      if (key in collection) {
        collection[key].usages.push({ path });
      } else {
        collection[key] = {
          node,
          usages: [{ path }],
        };
      }
      return collection;
    },
    patternIndex,
  );
}

const calculatePatternHeight = visitAndTransformPatternNode<number>((node) => {
  switch (node.kind) {
    case 'PatternPlaceholder':
      return 0;

    case 'PatternIdentifier':
    case 'PatternLiteral':
      return 1;

    case 'PatternData':
      return 1 + Math.max(...node.parameters);

    case 'PatternFunction':
      return 1 + node.body;

    case 'PatternApplication':
      return 1 + Math.max(node.callee, node.parameter);
  }
});

const findPlaceholderHeights = visitAndTransformPatternNode<number[]>((node) => {
  switch (node.kind) {
    case 'PatternPlaceholder':
      return [0];

    case 'PatternIdentifier':
    case 'PatternLiteral':
      return [];

    case 'PatternData':
      return flatMap(node.parameters, heights => heights.map(x => x + 1));

    case 'PatternFunction':
      return [...node.body.map(x => x + 1)];

    case 'PatternApplication':
      return [...node.callee.map(x => x + 1), ...node.parameter.map(x => x + 1)];
  }
});

function pickPatternsOfHeight(height: number): (patterns: PatternNode[]) => PatternNode[] {
  return patterns => patterns.filter(node => (
    calculatePatternHeight(node) === height
      && findPlaceholderHeights(node).every(placeholder => placeholder === height)
  ));
}

function pickSensiblePatterns(patterns: PatternNode[]): PatternNode[] {
  return patterns.filter(node => !(
    node.kind === 'PatternIdentifier'
    || node.kind === 'PatternPlaceholder'
    || node.kind === 'PatternLiteral'
    || node.kind === 'PatternApplication'
    && node.callee.kind === 'PatternPlaceholder'
  ));
}

function selectPatternsWith(
  selector: (inputs: PatternNode[]) => PatternNode[],
  visitor: (input: NodeWithChild<TypeAndPathDecoration, PatternNode[]>) => PatternNode[],
): (input: NodeWithChild<TypeAndPathDecoration, PatternNode[]>) => [SinglePattern[], PatternNode[]] {
  return (input) => {
    const nodes = visitor(input);
    const patterns = selector(nodes).map(node => ({ node, path: input.decoration.path }));
    return [patterns, nodes];
  };
}

function collectPatternUsages(
  selector: (input: PatternNode[]) => PatternNode[],
  visitor: (input: NodeWithChild<TypeAndPathDecoration, PatternNode[]>) => PatternNode[],
): [() => Dictionary<Pattern>, (input: NodeWithChild<TypeAndPathDecoration, PatternNode[]>) => PatternNode[]] {
  return accumulateStateWith<
    Dictionary<Pattern>,
    NodeWithChild<TypeAndPathDecoration, PatternNode[]>,
    PatternNode[],
    SinglePattern[]
  >({}, collectAndDedupPatterns)(selectPatternsWith(selector, visitor));
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

function shallowConvertNodeToPattern(expression: Expression<unknown>): [PatternNode<null>, string[]] | undefined {
  switch (expression.kind) {
    case 'Identifier':
      return [
        {
          kind: 'PatternIdentifier',
          name: expression.name,
        },
        [],
      ];

    case 'BooleanExpression':
      return [
        {
          kind: 'PatternLiteral',
          value: expression.value,
        },
        [],
      ];

    case 'NumberExpression':
      return [
        {
          kind: 'PatternLiteral',
          value: expression.value,
        },
      [],
    ];

    case 'StringExpression':
      return [
        {
          kind: 'PatternLiteral',
          value: expression.value,
        },
        [],
      ];

    case 'Application':
      return [
        {
          kind: 'PatternApplication',
          callee: null,
          parameter: null,
        },
        ['callee', 'parameter'],
      ];


    case 'SymbolExpression':
    case 'RecordExpression':
    case 'FunctionExpression':
    case 'DataInstantiation':
    case 'BindingExpression':
    case 'DualExpression':
    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'PatternMatchExpression':
    case 'NativeExpression':
      return undefined;

    default:
      return assertNever(expression);
  }
}

function nodesShallowMatch<T>(left: Expression<T>, right: Expression<T>): boolean {
  switch (left.kind) {
    case 'Identifier':
      return left.kind === right.kind && left.name === right.name;

    case 'BooleanExpression':
    case 'NumberExpression':
    case 'StringExpression':
      return left.kind === right.kind && left.value === right.value;

    case 'SymbolExpression':
      return left.kind === right.kind && left.name === right.name;

    case 'RecordExpression':
    case 'Application':
    case 'FunctionExpression':
    case 'DataInstantiation':
    case 'BindingExpression':
    case 'DualExpression':
    case 'ReadRecordPropertyExpression':
    case 'ReadDataPropertyExpression':
    case 'PatternMatchExpression':
    case 'NativeExpression':
      return left.kind === right.kind;

    default:
      return assertNever(left);
  }
}

function findCommonPatternsAtPath(nodesWithPaths: [string[], TypedNodeWithPath][], subpath: string[]) {
  const continuingChildren: [string[], TypedNodeWithPath][] = (
    nodesWithPaths.map(([path, node]) => [path, getNodeAt(node, subpath)])
  );
  return findCommonPatterns(continuingChildren);
}

function findChildPatternPermutations(path: string[], possiblePatternsPerSegment: Dictionary<[PatternNode, string[][]][]>): Dictionary<number>[] {
  const possibilitiesPerPathPerSegment: [string, number][][] = map(possiblePatternsPerSegment, (possibilities, segment) => {
    return possibilities
      .map(([pattern, paths], index): [string[][], number] => [paths, index])
      .filter(([paths]) => paths.some(possiblePath => isEqual(path, possiblePath)))
      .map(([, index]) => [segment, index])
  });
  return map(permuteArrays(possibilitiesPerPathPerSegment), fromPairs)
}

function groupChildPossibilities(possibilitiesPerPath: [string[], Dictionary<number>[]][]) {
  return possibilitiesPerPath.reduce<[Dictionary<number>, string[][]][]>(
    (collection, [path, possibilities]) => {
      possibilities.forEach((possibility) => {
        const index = collection.findIndex(([combination]) => {
          return isEqual(possibility, combination);
        });

        if (index === -1) {
          collection.push([possibility, [path]]);
        } else {
          collection[index][1].push(path);
        }
      });

      return collection;
    },
    [],
  );
}

function resolvePossibilityIndexes(possiblity: Dictionary<number>, possiblePatternsPerSegment: Dictionary<[PatternNode, string[][]][]>): Dictionary<PatternNode> {
  return mapValues(possiblity, (index, key) => {
    console.log(key, 1, index, 0);
    const pattern = possiblePatternsPerSegment[key];
    if (!pattern) {
      throw new Error(`Could not find key ${key} in possibilities`);
    }
    return pattern[index][0];
  });
}

function findCommonPatternsFromChildSegments(nodesWithPaths: [string[], TypedNodeWithPath][], segmentsToFill: string[]): [Dictionary<PatternNode>, string[][]][] {
  const possiblePatternsPerSegment: Dictionary<[PatternNode, string[][]][]> = zipObject(
    segmentsToFill,
    segmentsToFill.map(segment => findCommonPatternsAtPath(nodesWithPaths, [segment])),
  );
  console.log('possiblePattensPerSegment', JSON.stringify(possiblePatternsPerSegment, undefined, 2));

  // Permute the possible combinations in each path
  const possibleIndexesPerPath = nodesWithPaths.map<[string[], Dictionary<number>[]]>(([path]) => (
    [path, findChildPatternPermutations(path, possiblePatternsPerSegment)]
  ));
  console.log('possibleIndexesPerPath', JSON.stringify(possibleIndexesPerPath, undefined, 2));

  // Dedup combinations of paths and indexes
  const childPossibilities = groupChildPossibilities(possibleIndexesPerPath);
  console.log('childPossibilities', JSON.stringify(childPossibilities, undefined, 2));

  // Convert the array based segments to an object
  return childPossibilities.map(([possiblity, paths]) => {
    return [resolvePossibilityIndexes(possiblity, possiblePatternsPerSegment), paths];
  });
}

function findCommonPatterns(nodes: [string[], TypedNodeWithPath][]): [PatternNode, string[][]][] {
  let queue: [string[], TypedNodeWithPath][][] = [nodes];
  let includePlaceholder = false;
  const patterns: [PatternNode, string[][]][] = [];
  while (queue.length > 0) {
    const next = queue.shift()!;
    const [[path, first], ...others] = next;

    const [matching, nonMatching] = partition(others, ([, other]) => nodesShallowMatch(first.expression, other.expression));

    if (nonMatching.length > 0) {
      // Some of the nodes did not match, we also need to add a placeholder to the list of patterns
      includePlaceholder = true;

      // Requeue the non matching nodes to see if they have any commonalities
      queue.push(nonMatching);
    }

    if (matching.length > 0) {
      // Convert this expression to a pattern and recursively call to generate child nodes
      const convertedResult = shallowConvertNodeToPattern(first.expression);
      if (convertedResult) {
        // The node can be converted to a pattern
        const [nodeTemplate, segmentsToFill] = convertedResult;

        if (segmentsToFill.length === 0) {
          patterns.push([nodeTemplate as PatternNode, [path, ...matching.map(([path]) => path)]]);
        } else {
          const continuingNodes: [string[], TypedNodeWithPath][] = [[path, first], ...matching];
          const childPossibilities = findCommonPatternsFromChildSegments(continuingNodes, segmentsToFill);
          const permuted3 = childPossibilities.map<[PatternNode, string[][]]>(([partialNode, paths]) => (
            [{ ...nodeTemplate as PatternNode, ...partialNode }, paths]
          ));
          patterns.push(...permuted3);
        }
      }
    }
  }

  if (includePlaceholder) {
    patterns.push([{ kind: 'PatternPlaceholder' }, map(nodes, 0)]);
  }

  return patterns;
}

function convertToFullIndex2(baseNode: TypedNodeWithPath, partialIndex: Dictionary<Pattern>): Pattern[] {
  return flatMap(partialIndex, (pattern) => {
    if (pattern.usages.length <= 1) {
      return [];
    }

    const patternUsages: [string[], TypedNodeWithPath][] = pattern.usages.map(({ path }) => [path, getNodeAt(baseNode, path)]);
    const commonPatterns = findCommonPatterns(patternUsages);
    return commonPatterns.map(([node, paths]) => ({
      node,
      usages: paths.map(path => ({ path })),
    }));
  });
}

function recordPatterns(node: TypedNodeWithPath): Pattern[] {
  // Iterate over node
  // Call `convertToPatternNode` at each step
  // On the side, record the results of each call
  // At each level insert a possibility that a node could be an identifier if it is not already so
  // By the end we would have collected all the possible trees in the node

  const [getPartialIndex, patternNodeConverter] = collectPatternUsages(pickPatternsOfHeight(2), convertNodeToPatternNode);
  // const [getPartialIndex, patternNodeConverter] = collectPatternUsages((a) => a, convertNodeToPatternNode);
  const finalVisitor = insertPlaceholders(patternNodeConverter);
  visitAndTransformNode<TypeAndPathDecoration, PatternNode[]>(finalVisitor)(node);

  const index = getPartialIndex();
  const strings = Object.values(getPartialIndex()).map(s => `${s.usages.length}  ${toString(s.node)}`);
  console.log(sortBy(strings).join('\n'));

  return convertToFullIndex2(node, index);
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
      extracted = getNodeAt(node, usage.path);
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

function findIdentifiers(node: Node<any>): string[] {
  const getIdentifierName = (node: Node<string[]>) => {
    switch (node.expression.kind) {
      case 'Identifier':
        return [node.expression.name];

      default:
        return [];
    }
  };
  const [getNames, visitor] = accumulateStates(getIdentifierName);
  visitAndTransformNode<string[], any>(visitor)(node);
  return getNames();
}

function findIdentifierDeclarationPath(base: TypedNodeWithPath, path: string[], identifier: string): string[] {
  for (let i = 0; i < path.length; i += 1) {
    const currentPath = path.slice(0, i);
    const currentNode = getNodeAt(base, currentPath);
    if (currentNode.expression.kind === 'BindingExpression') {
      if (currentNode.expression.name === identifier) {
        return [...currentPath, 'body'];
      }
    }
    else if (currentNode.expression.kind === 'FunctionExpression') {
      const value = evaluateExpression(evaluationScope({}))(currentNode.expression.parameter);
      if (!value) {
        throw new Error('Failed to evaluate value');
      }

      if (usesVariable([identifier])(value)) {
        return [...currentPath, 'body'];
      }
    }
  }

  return [];
}

function findInsertionPath(base: TypedNodeWithPath, extracted: TypedNodeWithPath, extractedPaths: string[][]): string[] {
  const identifiers = findIdentifiers(extracted);
  const declarationPaths = flatMap(identifiers, identifier => extractedPaths.map(extractedPath => (
    findIdentifierDeclarationPath(base, extractedPath, identifier)
  )));
  return maxBy(declarationPaths, 'length') || [];
}

function insertPattern(identifier: string, base: TypedNodeWithPath, extracted: TypedNodeWithPath, insertionPath: string[], patterns: Pattern[]): [TypedNodeWithPath, Pattern[]] {
  // Insert the extracted expression into the base and then update all the paths of the pattern so
  // they remain correct
  const newNode = mapNodeAt(base, insertionPath, (oldNode): TypedNodeWithPath => {
    const baseWithCorrectPath = visitAndTransformNode<TypeAndPathDecoration, TypedNodeWithPath>((node) => prependPath(node, 'body'))(oldNode);
    return {
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
  });

  const updatedIndex = patterns.map(pattern => ({
    ...pattern,
    usages: pattern.usages.map(usage => (
      pathIsChild(insertionPath, usage.path)
        ? ({
          ...usage,
          path: ['body', ...usage.path],
        })
        : usage
    )),
  }));

  return [newNode, updatedIndex];
}

function applyBestPattern(identifier: string, node: TypedNodeWithPath, patterns: Pattern[]): [TypedNodeWithPath, Pattern[]] {
  const [bestPattern, otherPatterns] = findBestPattern(patterns);
  const reindexedPatterns = updatePatternIndex(bestPattern, otherPatterns);
  const { base, extracted } = extractPattern(bestPattern, identifier, node);
  const insertionPath = findInsertionPath(base, extracted, bestPattern.usages.map(({ path }) => path));
  return insertPattern(identifier, base, extracted, insertionPath, reindexedPatterns);
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
  let patterns = recordPatterns(nodeWithPath);
  // let patterns = removeIrrelevantPatterns(patterns1);

  const costed = patterns.map(({ node, usages }) => {
    return ({ node, usages, cost: patternCost(node) * usages.length });
  });
  const sorted = sortBy(costed, 'cost');
  console.log(sorted.map((pattern) => `Usages ${`${pattern.usages.length}`.padEnd(4, ' ')} Cost ${`${pattern.cost}`.padEnd(3, ' ')} ${toString(pattern.node)}`).join('\n'));

  // Find the most valuable tree to extract
  //  - Extract it into a binding and replace every usage with its identifier
  //  - Update the index with the usages that were removed
  //  - Reindex the newly inserted binging
  const nextName = nameGenerator('$extracted$');
  while (patterns.length > 0) {
    ([nodeWithPath, patterns] = applyBestPattern(nextName(), nodeWithPath, patterns));
    patterns = [];
  }

  // Remove path decoration
  return visitAndTransformNode<TypeAndPathDecoration, TypedNode>(node => ({
    ...node,
    decoration: node.decoration.type,
  }))(nodeWithPath);
}

