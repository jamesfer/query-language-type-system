"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("../constructors");
const test_unique_id_generators_1 = require("../test-utils/test-unique-id-generators");
const index_1 = require("./index");
describe('attachShapes', () => {
    let uniqueIdGenerator;
    let inferences;
    let namedNode;
    function makeSimpleNamedNode(shapeName, expression, type) {
        return constructors_1.node(expression, { shapeName, type });
    }
    function evaluatedFrom(from, to) {
        return {
            from,
            to,
            operator: 'EvaluatedFrom',
            origin: expect.anything(),
            inferrer: expect.anything(),
        };
    }
    function equals(from, to) {
        return {
            from,
            to,
            operator: 'Equals',
            origin: expect.anything(),
            inferrer: expect.anything(),
        };
    }
    beforeEach(() => {
        uniqueIdGenerator = test_unique_id_generators_1.prefixlessUniqueIdGenerator();
    });
    describe.each([
        ['number', constructors_1.numberExpression(7), constructors_1.numberLiteral(7)],
        ['boolean', constructors_1.booleanExpression(true), constructors_1.booleanLiteral(true)],
        ['string', constructors_1.stringExpression('Hello'), constructors_1.stringLiteral('Hello')],
        ['symbol', constructors_1.symbolExpression('X'), constructors_1.symbol('X')],
    ])('when called on a %s expression', (_, expression, value) => {
        beforeEach(() => {
            ([inferences, namedNode] = index_1.attachShapes(uniqueIdGenerator, expression));
        });
        it('infers the type of the expression correctly', () => {
            expect(inferences).toEqual([
                evaluatedFrom(namedNode.decoration.shapeName, value),
            ]);
        });
        it('decorates the node with the name and type', () => {
            expect(namedNode).toEqual(constructors_1.node(expression, {
                shapeName: expect.any(String),
                type: value,
            }));
        });
    });
    describe('when the expression is a record', () => {
        let expression;
        beforeEach(() => {
            const recordUniqueIdGenerator = test_unique_id_generators_1.staticUniqueIdGenerator(['a', 'b', 'result']);
            expression = constructors_1.record({ a: constructors_1.numberExpression(7), b: constructors_1.stringExpression('Hello') });
            ([inferences, namedNode] = index_1.attachShapes(recordUniqueIdGenerator, expression));
        });
        it('infers all the type variables', () => {
            expect(inferences).toEqual(expect.arrayContaining([
                evaluatedFrom(namedNode.decoration.shapeName, constructors_1.recordLiteral({ a: constructors_1.freeVariable('a'), b: constructors_1.freeVariable('b') })),
                evaluatedFrom('a', constructors_1.numberLiteral(7)),
                evaluatedFrom('b', constructors_1.stringLiteral('Hello')),
            ]));
        });
        it('produces the correct named node', () => {
            const expectedExpression = Object.assign(Object.assign({}, expression), { properties: {
                    a: makeSimpleNamedNode('a', constructors_1.numberExpression(7), constructors_1.numberLiteral(7)),
                    b: makeSimpleNamedNode('b', constructors_1.stringExpression('Hello'), constructors_1.stringLiteral('Hello')),
                } });
            expect(namedNode).toEqual(makeSimpleNamedNode(namedNode.decoration.shapeName, expectedExpression, constructors_1.recordLiteral({ a: constructors_1.freeVariable('a'), b: constructors_1.freeVariable('b') })));
        });
    });
    describe.skip('when the expression is an application', () => {
        let expression;
        beforeEach(() => {
            const recordUniqueIdGenerator = test_unique_id_generators_1.staticUniqueIdGenerator([
                'lambdaParameter',
                'lambdaBody',
                'lambda',
                'numberLiteral',
                'application',
                'internalApplicationResult',
                'internalApplicationParameter',
            ]);
            expression = constructors_1.apply(constructors_1.lambda([constructors_1.identifier('x')], constructors_1.stringExpression('Hello')), constructors_1.numberExpression(123));
            ([inferences, namedNode] = index_1.attachShapes(recordUniqueIdGenerator, expression));
        });
        it.each([
            ['lambdaParameter', constructors_1.freeVariable('x')],
            ['lambda', constructors_1.functionType(constructors_1.freeVariable('lambdaBody'), [constructors_1.freeVariable('lambdaParameter')])],
            ['numberLiteral', constructors_1.numberLiteral(123)],
            ['internalApplicationResult', constructors_1.freeVariable('application')],
            ['lambda', constructors_1.functionType(constructors_1.freeVariable('lambdaBody'), [constructors_1.freeVariable('lambdaParameter')])],
        ])('creates a evaluatedFrom partial type for the %s variable', (from, to) => {
            expect(inferences).toContainEqual(evaluatedFrom(from, to));
        });
        it('creates a equals partial type for the lambda body', () => {
            expect(inferences).toContainEqual(equals('lambdaBody', constructors_1.stringLiteral('Hello')));
        });
        it('produces the correct named node', () => {
            const expectedExpression = Object.assign(Object.assign({}, expression), { callee: makeSimpleNamedNode('lambda', expect.anything(), constructors_1.functionType(constructors_1.freeVariable('lambdaBody'), [constructors_1.freeVariable('lambdaParameter')])), parameter: makeSimpleNamedNode('numberLiteral', constructors_1.numberExpression(123), constructors_1.numberLiteral(123)) });
            expect(namedNode).toEqual(makeSimpleNamedNode('application', expectedExpression, constructors_1.freeVariable('internalApplicationResult')));
        });
    });
    // describe.each([false, true])('when the expression is a function and implicit is %s', (implicit) => {
    //   let expression: FunctionExpression;
    //
    //   beforeEach(() => {
    //     const recordUniqueIdGenerator = staticUniqueIdGenerator(['parameter', 'body', 'result', 'X', 'Y', 'Z', 'A']);
    //     expression = lambda(
    //       [[stringExpression('parameter'), implicit]],
    //       numberExpression(123),
    //     );
    //     ([inferences, namedNode] = attachShapes(recordUniqueIdGenerator, expression));
    //   });
    //
    //   it.each<[string, Value]>([
    //     ['result', functionType(freeVariable('body'), [[freeVariable('parameter'), implicit]])],
    //     ['parameter', stringLiteral('parameter')],
    //     ['body', numberLiteral(123)],
    //   ])('infers the type of the %s variable', (from, to) => {
    //     expect(inferences).toContainEqual(evaluatedPair(
    //       { value: freeVariable(from), expression: expect.anything() },
    //       { value: to, expression: expect.anything() },
    //     ));
    //   });
    //
    //   it('produces the correct named node', () => {
    //     const expectedNode: FunctionExpression<NamedNode> = {
    //       ...expression,
    //       parameter: makeSimpleNamedNode('parameter', stringExpression('parameter'), stringLiteral('parameter')),
    //       body: makeSimpleNamedNode('body', numberExpression(123), numberLiteral(123)),
    //     };
    //     expect(namedNode).toEqual(makeSimpleNamedNode(
    //       'result',
    //       expectedNode,
    //       functionType(freeVariable('body'), [[freeVariable('parameter'), implicit]]),
    //     ));
    //   });
    // });
});
//# sourceMappingURL=index.test.js.map