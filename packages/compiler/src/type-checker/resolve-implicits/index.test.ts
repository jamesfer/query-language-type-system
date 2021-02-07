import { Scope, ScopedNodeDecoration } from '../build-scoped-node';
import {
  node,
  numberExpression,
  numberLiteral,
  identifier,
  functionType,
  booleanLiteral,
  freeVariable, dataValue, stringLiteral,
} from '../constructors';
import { Message } from '../types/message';
import { ResolvedNode, ResolvedNodeDecoration, resolveImplicits } from './index';

describe('resolveImplicits', () => {
  it('does nothing to a node with equivalent shape and type', () => {
    const [messages, resolvedNode] = resolveImplicits(node<ScopedNodeDecoration>(
      numberExpression(123),
      {
        scope: { bindings: {}, },
        shape: numberLiteral(123),
        type: numberLiteral(123),
      },
    ));
    expect(messages).toEqual([]);
    expect(resolvedNode).toEqual(node<ResolvedNodeDecoration>(
      numberExpression(123),
      {
        scope: { bindings: {} },
        type: numberLiteral(123),
        resolvedImplicits: [],
      },
    ));
  });

  it('resolves simple implicits', () => {
    const scope: Scope = {
      bindings: {
        aBoolean: booleanLiteral(true),
      },
    };
    const [messages, resolvedNode] = resolveImplicits(node<ScopedNodeDecoration>(
      identifier('a'),
      {
        scope,
        shape: numberLiteral(123),
        type: functionType(numberLiteral(123), [[booleanLiteral(true), true]]),
      },
    ));
    expect(messages).toEqual([]);
    expect(resolvedNode).toEqual(node<ResolvedNodeDecoration>(
      {
        kind: 'Application',
        callee: node(
          identifier('a'),
          {
            scope,
            type: functionType(numberLiteral(123), [[booleanLiteral(true), true]]),
            resolvedImplicits: [['aBoolean', booleanLiteral(true)]],
          },
        ),
        parameter: node(
          identifier('aBoolean'),
          {
            scope,
            type: booleanLiteral(true),
            resolvedImplicits: [],
          },
        ),
      },
      {
        scope,
        type: numberLiteral(123),
        resolvedImplicits: [],
      },
    ));
  });
  
  describe('when there are no matching implicits', () => {
    let scope: Scope;
    let messages: Message[];
    let resolvedNode: ResolvedNode;

    beforeEach(() => {
      scope = { bindings: {} };
      [messages, resolvedNode] = resolveImplicits(node<ScopedNodeDecoration>(
        identifier('a'),
        {
          scope,
          shape: numberLiteral(123),
          type: functionType(numberLiteral(123), [[booleanLiteral(true), true]]),
        },
      ));
    });

    it('emits a message', () => {
      expect(messages).toEqual(['Could not find a valid set of replacements for implicits']);
    });

    it('doesn\'t change the resolvedNode', () => {
      expect(resolvedNode).toEqual(node<ResolvedNodeDecoration>(
        identifier('a'),
        {
          scope,
          type: functionType(numberLiteral(123), [[booleanLiteral(true), true]]),
          resolvedImplicits: [],
        },
      ));
    });
  });

  it.skip('resolves dependent implicit parameters', () => {
    const scope: Scope = {
      bindings: {
        tWithNumber: dataValue('T', [numberLiteral(7)]),
        mWithNumber: dataValue('M', [numberLiteral(7)]),
        tWithBoolean: dataValue('T', [booleanLiteral(true)]),
        mWithString: dataValue('M', [stringLiteral('a string')]),
      },
    };
    const [messages, resolvedNode] = resolveImplicits(node<ScopedNodeDecoration>(
      identifier('a'),
      {
        scope,
        shape: numberLiteral(123),
        type: functionType(numberLiteral(123), [
          [dataValue('T', [freeVariable('X')]), true],
          [dataValue('M', [freeVariable('X')]), true],
        ]),
      },
    ));
    expect(messages).toEqual([]);
    expect(resolvedNode).toEqual(
      node<ResolvedNodeDecoration>(
        {
          kind: 'Application',
          callee: node<ResolvedNodeDecoration>(
            {
              kind: 'Application',
              callee: node(
                identifier('a'),
                {
                  scope,
                  type: functionType(numberLiteral(123), [
                    [dataValue('T', [freeVariable('X')]), true],
                    [dataValue('M', [freeVariable('X')]), true,]
                  ]),
                  resolvedImplicits: [
                    ['tWithNumber', dataValue('T', [numberLiteral(7)])],
                    ['mWithNumber', dataValue('M', [numberLiteral(7)])],
                  ],
                },
              ),
              parameter: node(
                identifier('tWithNumber'),
                {
                  scope,
                  type: dataValue('T', [numberLiteral(7)]),
                  resolvedImplicits: [],
                },
              ),
            },
            {
              scope,
              type: numberLiteral(123),
              resolvedImplicits: [],
            },
          ),
          parameter: node(
            identifier('mWithNumber'),
            {
              scope,
              type: dataValue('M', [numberLiteral(7)]),
              resolvedImplicits: [],
            },
          ),
        },
        {
          scope,
          type: numberLiteral(123),
          resolvedImplicits: [],
        },
      ),
    );
  });
});
