import { UniqueIdGenerator, uniqueIdStream } from '../../utils/unique-id-generator';
import {
  booleanLiteral,
  freeVariable,
  functionType,
  identifier,
  node,
  numberLiteral,
  recordLiteral,
  scope,
} from '../constructors';
import { ReadRecordPropertyExpression } from '../types/expression';
import { Scope } from '../types/scope';
import { attachTypeToReadRecordProperty } from './attach-type-to-read-record-property';
import { AttachedTypeNode } from './attached-type-node';
import { deconstructTypeState } from './test-utils/deconstruct-type-state';

describe('attachTypeToReadRecordProperty', () => {
  let inputScope: Scope;
  let makeUniqueId: UniqueIdGenerator;
  let expression: ReadRecordPropertyExpression<AttachedTypeNode>;

  function run() {
    return deconstructTypeState(attachTypeToReadRecordProperty(makeUniqueId)(inputScope)(expression));
  }

  beforeEach(() => {
    inputScope = scope();
    makeUniqueId = uniqueIdStream();
  });

  describe('when the record is a record literal', () => {
    beforeEach(() => {
      expression = {
        kind: 'ReadRecordPropertyExpression',
        property: 'property',
        record: node(identifier('record'), {
          scope: inputScope,
          type: functionType(
            recordLiteral({ property: functionType(booleanLiteral(true), [[numberLiteral(7), true]]) }),
            [[freeVariable('a'), true]]
          ),
        }),
      };
    });

    it('emits no messages', () => {
      const result = run();
      expect(result.messages).toEqual([]);
    });

    it('strips implicits from the record and property types before determining the attached type', () => {
      const result = run();
      expect(result.node.decoration.type).toEqual(booleanLiteral(true));
    });

    describe('when the property does not exist on the record', () => {
      beforeEach(() => {
        expression = { ...expression, property: 'something' };
      });

      it('emits a message', () => {
        const result = run();
        expect(result.messages).toEqual([
          `Record type does not have a property named something. Expected one of: property`,
        ]);
      });

      it('attaches a new free variable as the type of the expression', () => {
        const result = run();
        expect(result.node.decoration.type).toEqual(freeVariable('unknown$1'));
      });
    });
  });

  describe('when the record is not a record type', () => {
    beforeEach(() => {
      expression = {
        ...expression,
        record: node(identifier('record'), {
          scope: inputScope,
          type: booleanLiteral(false),
        }),
      };
    });

    it('emits a message', () => {
      const result = run();
      expect(result.messages).toEqual([
        'Tried to read a record property from something that is not a record type',
      ]);
    });

    it('attaches a new free variable as the type of the expression', () => {
      const result = run();
      expect(result.node.decoration.type).toEqual(freeVariable('unknown$1'));
    });
  });
});
