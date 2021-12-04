import { pipe } from 'fp-ts/function';
import { zip, chainWithIndex, map } from 'fp-ts/Array';
import { Message, Node } from '../..';
import { makeExpressionIterator } from '../../desugar/iterators-specific';
import { Scope, ScopedNode } from '../build-scoped-node';
import { collapseInferredTypes } from '../compress-inferred-types/collapse-inferred-types';
import { ShapedNodeDecoration } from '../compress-inferred-types/recursively-apply-inferred-types';
import { identifier, node } from '../constructors';
import { StateRecorder } from '../state-recorder/state-recorder';
import {
  InferredType,
  InferredTypeOperator,
  makeInferredType,
} from '../types/inferred-type';
import { Value } from '../types/value';
import { permuteArrays } from '../utils';
import { selectImplicitParameters } from '../utils/select-implicit-parameters';
import { mapNode } from '../visitor-utils';
import { findMatchingImplementations } from './find-matching-implementation';

export interface ResolvedNodeDecoration {
  /**
   * The type of the node that should be shown to users.
   */
  type: Value;
  /**
   * Name of other nodes used to satisfy this nodes implicits.
   */
  resolvedImplicits: [string, Value][];
  scope: Scope;
}

export type ResolvedNode = Node<ResolvedNodeDecoration>;

/**
 * In a very simple algorithm, finds the implicits of `currentValue` that need to be resolved for it to match
 * `expectedType`. It does this by counting the number of implicits in each value and returning the first `n`
 * implicits from `currentValue` so that it has the same number as `expectedType`.
 */
function findImplicitsToResolve(decoration: ShapedNodeDecoration): Value[] {
  const expectedParameters = selectImplicitParameters(decoration.shape);
  const actualParameters = selectImplicitParameters(decoration.type);
  return actualParameters.slice(0, Math.max(0, actualParameters.length - expectedParameters.length));
}

function isValidCombination(implicitsToResolve: Value[], combination: Value[]) {
  const messageState = new StateRecorder<Message>();
  const origin = identifier('__resolve_implicits_origin__');
  const inferrer = identifier('__resolve_implicits_inferrer__');
  const pairs = pipe(
    zip(implicitsToResolve, combination),
    map(zip(['Equals', 'EvaluatedFrom'] as InferredTypeOperator[])),
    chainWithIndex((index, pair) => zip([index, index], pair)),
    map(([index, [to, operator]]): InferredType => makeInferredType(
      operator,
      `v${index}`,
      to,
      origin,
      inferrer,
    )),
  )
  collapseInferredTypes(messageState, pairs);
  return messageState.values.length === 0;
}

function findAllMatchingImplementationsFor(
  state: StateRecorder<Message>,
  implicitsToResolve: Value[],
  scope: Scope,
): [string, Value][] {
  if (implicitsToResolve.length === 0) {
    return [];
  }

  // Find all possible implementation values for these implicits
  const possibleImplementations = implicitsToResolve.map(implicit => findMatchingImplementations(scope, implicit));

  // Perform cartesian product of all the possible implementations
  const possibleImplementationCombinations = permuteArrays(possibleImplementations);

  // Remove any that have conflicting binds
  const validCombinations = possibleImplementationCombinations.filter((combination) => (
    isValidCombination(implicitsToResolve, combination.map(([, value]) => value))
  ));

  // If there is more than one possible set of replacements for a implicit parameter, that parameter is ambiguous
  if (validCombinations.length > 1) {
    state.push(`Implicits were ambiguous. ${validCombinations.length} possible sets of values found for ${implicitsToResolve.length} implicits`);
    return [];
  }

  // If there are no possibilities then the implicits are unresolvable
  if (validCombinations.length === 0) {
    state.push('Could not find a valid set of replacements for implicits')
    return [];
  }

  return validCombinations[0];
}

function trimFirstImplicitParameters(type: Value): Value {
  return type.kind === 'ImplicitFunctionLiteral' ? type.body : type;
}

function applyImplicitParameters(baseNode: ResolvedNode): ResolvedNode {
  const { scope, resolvedImplicits } = baseNode.decoration;
  return resolvedImplicits.reduceRight<ResolvedNode>(
    (callee, [parameter, type]) => {
      return node(
        {
          callee,
          kind: 'Application',
          parameter: node(identifier(parameter), { scope, type, resolvedImplicits: [] }),
        },
        {
          scope,
          type: trimFirstImplicitParameters(callee.decoration.type),
          resolvedImplicits: [],
        },
      );
    },
    baseNode,
  );
}

const resolveImplicitsFor = (state: StateRecorder<Message>) => (node: ScopedNode<ResolvedNode>): ResolvedNode => {
  const implicitsToResolve = findImplicitsToResolve(node.decoration);
  const matchingImplementations = findAllMatchingImplementationsFor(state, implicitsToResolve, node.decoration.scope);
  return applyImplicitParameters({
    ...node,
    decoration: {
      scope: node.decoration.scope,
      type: node.decoration.type,
      resolvedImplicits: matchingImplementations,
    },
  });
}

export function resolveImplicits(node: ScopedNode): [Message[], ResolvedNode] {
  const state = new StateRecorder<Message>();
  const internal = (node: ScopedNode): ResolvedNode => resolveImplicitsFor(state)(mapNode(iterator, node));
  const iterator = makeExpressionIterator(internal);
  const result = internal(node);
  return [state.values, result];
}
