import { UniqueIdGenerator, uniqueIdStream } from '../../utils/unique-id-generator';
import {
  booleanLiteral,
  dataValue,
  freeVariable,
  functionType,
  identifier,
  node,
  numberLiteral,
  scope,
} from '../constructors';
import { ReadDataPropertyExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { attachTypeToReadDataProperty } from './attach-type-to-read-data-property';
import { AttachedTypeNode } from './attached-type-node';
import { deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToReadDataProperty', () => {
  let inputScope: Scope;
  let makeUniqueId: UniqueIdGenerator;
  let expression: ReadDataPropertyExpression<AttachedTypeNode>;

  function run() {
    return deconstructTypeState(attachTypeToReadDataProperty(makeUniqueId)(inputScope)(expression));
  }

  beforeEach(() => {
    inputScope = scope();
    makeUniqueId = uniqueIdStream();
  });

  describe('when the data value is a data type', () => {
    beforeEach(() => {
      expression = {
        kind: 'ReadDataPropertyExpression',
        property: 0,
        dataValue: node(identifier('dataValue'), {
          scope: inputScope,
          type: functionType(
            dataValue('X', [functionType(booleanLiteral(true), [[numberLiteral(7), true]])]),
            [[freeVariable('a'), true]]
          ),
        }),
      };
    });

    it('emits no messages', () => {
      const result = run();
      expect(result.messages).toEqual([]);
    });

    it('strips implicits from the data value and property types before determining the attached type', () => {
      const result = run();
      expect(result.node.decoration.type).toEqual(booleanLiteral(true));
    });

    describe('when the property is outside of the range of the data value', () => {
      beforeEach(() => {
        expression = { ...expression, property: 1 };
      });

      it('emits a message', () => {
        const result = run();
        expect(result.messages).toEqual([
          `Data value only has 1 properties. Tried to access property number 1 (zero-indexed).`,
        ]);
      });

      it('attaches a new free variable as the type of the expression', () => {
        const result = run();
        expect(result.node.decoration.type).toEqual(freeVariable('unknown$1'));
      });
    });
  });

  describe('when the data value is not a data type', () => {
    beforeEach(() => {
      expression = {
        ...expression,
        dataValue: node(identifier('dataValue'), {
          scope: inputScope,
          type: booleanLiteral(false),
        }),
      };
    });

    it('emits a message', () => {
      const result = run();
      expect(result.messages).toEqual([
        'Tried to read a data property from something that is not a data value',
      ]);
    });

    it('attaches a new free variable as the type of the expression', () => {
      const result = run();
      expect(result.node.decoration.type).toEqual(freeVariable('unknown$1'));
    });
  });
});
