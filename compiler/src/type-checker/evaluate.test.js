"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../api");
describe('evaluate', () => {
    it('a', () => {
        expect(true).toBe(true);
    });
    it('evaluates a pattern match expression', () => {
        const evaluated = api_1.evaluate('let a = 5\nmatch a | 3 = 300 | 5 = 500 | _ = 0');
        const expected = {
            kind: 'NumberLiteral',
            value: 500,
        };
        expect(evaluated).toEqual(expected);
    });
    // it.each<[string, Expression, Value]>([
    //   ['number', { kind: 'NumberExpression', value: 1 }, { kind: 'NumberLiteral', value: 1 }],
    //   ['string', { kind: 'BooleanExpression', value: true }, { kind: 'BooleanLiteral', value: true }],
    // ])('evaluates a simple %s literal expression', (_, exp, value) => {
    //   expect(evaluateExpression(evaluationScope(), [
    //     expression(exp),
    //   ])).toEqual([value]);
    // });
    //
    // it('evaluates a function call', () => {
    //   expect(evaluateExpression(evaluationScope(), [
    //     data('c'),
    //     data('Tuple2', ['a', 'b']),
    //     data('Red', ['c']),
    //     data('Green', ['c']),
    //     func('go', [funcParam('a'), funcParam('b')], apply(identifier('Tuple2'), [identifier('a'), identifier('b')])),
    //     expression(apply(identifier('go'), [apply(identifier('Red'), [identifier('c')]), apply(identifier('Green'), [identifier('c')])])),
    //   ])).toEqual([dataValue('Tuple2', [dataValue('Red', [expect.anything()]), dataValue('Green', [expect.anything()])])])
    // });
});
//# sourceMappingURL=evaluate.test.js.map