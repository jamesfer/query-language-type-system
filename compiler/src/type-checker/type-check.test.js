"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const run_type_phase_1 = require("./run-type-phase");
const strip_nodes_1 = require("./strip-nodes");
const constructors_1 = require("./constructors");
const evaluate_1 = require("./evaluate");
const utils_1 = require("./utils");
describe('typeExpression', () => {
    const blank = constructors_1.numberExpression(1);
    it('typeExpressions a simple declaration', () => {
        const [messages] = run_type_phase_1.runTypePhase(constructors_1.data('Color', ['c'])(blank));
        expect(messages).toEqual([]);
    });
    it('typeExpressions a declaration with children', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('Color', ['c']), constructors_1.data('Red'), constructors_1.implement('Color', ['Red']), blank));
        expect(messages).toEqual([]);
    });
    it('fails on an implement declaration when children do not match the constraints', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('Serial', ['s']), constructors_1.data('Color', ['t'], [[constructors_1.apply('Serial', ['t']), true], 't']), 
        // bind('Color', lambda([[apply('Serial', ['t']), true], 't'], dataInstantiation('Color', [identifier('t')]))),
        constructors_1.data('Red'), constructors_1.implement('Color', ['Red']), blank));
        expect(messages).toEqual([expect.any(String)]);
    });
    it('fails when children do not match an existing implementation', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('Serial', ['c']), constructors_1.data('Color', ['t'], [[constructors_1.apply('Serial', ['t']), true], 't']), 
        // bind('Color', lambda([[apply('Serial', ['t']), true], 't'], dataInstantiation('Color', [identifier('t')]))),
        constructors_1.data('Red'), constructors_1.data('Green'), constructors_1.implement('Serial', ['Green']), constructors_1.implement('Color', ['Red']), blank));
        expect(messages).toEqual([expect.any(String)]);
    });
    it('fails when there are multiple data declarations with the same callee', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('Serial'), constructors_1.data('Serial'), blank));
        expect(messages).toEqual([expect.any(String)]);
    });
    it('fails when there is a data declaration and variable binding with the same callee', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('Serial'), constructors_1.bind('Serial', blank), blank));
        expect(messages).toEqual([expect.any(String)]);
    });
    it('fails when there is a variable binding and data declaration with the same callee', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.bind('Serial', blank), constructors_1.data('Serial'), blank));
        expect(messages).toEqual([expect.any(String)]);
    });
    it('typeExpressions a polymorphic function call', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('Color', ['c']), constructors_1.data('Red'), constructors_1.implement('Color', ['Red']), constructors_1.bind('go', constructors_1.lambda(['color'], 5)), constructors_1.apply('go', ['Red'])));
        expect(messages).toEqual([]);
    });
    it('typeExpressions a function call with a constraint on a parameter', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('Color', ['c']), constructors_1.data('Red'), constructors_1.implement('Color', ['Red']), constructors_1.bind('go', constructors_1.lambda([[constructors_1.apply('Color', ['color']), true], 'color'], 5)), constructors_1.apply('go', ['Red'])));
        expect(messages).toEqual([]);
    });
    it('fails a function call with parameter that does not match its constraint', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('Color', ['c']), constructors_1.data('Red'), constructors_1.bind('go', constructors_1.lambda([[constructors_1.apply('Color', ['color']), true], 'color'], 5)), constructors_1.apply('go', ['Red'])));
        expect(messages).toEqual([expect.any(String)]);
    });
    it('passes a function call with a parameter that also takes a parameter', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('String'), constructors_1.data('Maybe', ['c']), constructors_1.data('Some', ['a']), constructors_1.implement('Maybe', [constructors_1.apply('Some', ['String'])]), constructors_1.bind('go', constructors_1.lambda([[constructors_1.apply('Maybe', ['maybe']), true], 'maybe'], 5)), constructors_1.apply('go', [constructors_1.apply('Some', ['String'])])));
        expect(messages).toEqual([]);
    });
    it('fails a function call with a parameter that also takes a parameter but it is incompatible', () => {
        const [messages] = run_type_phase_1.runTypePhase(utils_1.pipe(constructors_1.data('String'), constructors_1.data('Maybe', ['c']), constructors_1.data('Some', ['a']), constructors_1.bind('go', constructors_1.lambda([[constructors_1.apply('Maybe', ['maybe']), true], 'maybe'], 5)), constructors_1.apply('go', [constructors_1.apply('Some', ['String'])])));
        expect(messages).toEqual([expect.any(String)]);
    });
    describe('a real test', () => {
        const expression = utils_1.pipe(constructors_1.data('Int', ['c']), 
        // Declare type class
        constructors_1.data('Serializable', ['a', 'c'], ['a', constructors_1.dual('c', constructors_1.record({
                valueOf: constructors_1.lambda([
                    [constructors_1.apply('Int', ['result']), true],
                    [constructors_1.apply('a', ['object']), true],
                    'object',
                ], 'result'),
            }))]), 
        // bind('Serializable', lambda(
        //   [
        //     'a',
        //     dual('c', record({
        //       valueOf: lambda(
        //         [
        //           [apply('Int', ['result']), true],
        //           [apply('a', ['object']), true],
        //           'object',
        //         ],
        //         'result',
        //       ),
        //     })),
        //   ],
        //   apply('Serializable', ['a', 'c']),
        // )),
        // Declare usable implementation of type class
        constructors_1.bind('valueOf', constructors_1.lambda([
            [constructors_1.apply('Serializable', [constructors_1.apply('a', ['object']), 'z']), true],
            [constructors_1.apply('a', ['object']), true],
            // TODO if functions were correctly curried in all places, then we probably wouldn't need
            //      to accept an 'value' parameter here, which would mean this method acts kind of
            //      like a "summon" method which is cool.
            'object',
        ], constructors_1.apply(constructors_1.readRecordProperty('z', 'valueOf'), ['object']))), 
        // Implement type class
        constructors_1.data('Color', ['c']), constructors_1.data('Red'), constructors_1.implement('Color', ['Red']), constructors_1.implement('Serializable', [constructors_1.apply('Color', ['t']), constructors_1.record({
                valueOf: constructors_1.lambda(['color'], 10),
            })]), constructors_1.apply('valueOf', ['Red']));
        it('type typeExpression', () => {
            const [messages] = run_type_phase_1.runTypePhase(expression);
            expect(messages).toEqual([]);
        });
        it('real evaluate test', () => {
            const [, node] = run_type_phase_1.runTypePhase(expression);
            expect(node).toBeDefined();
            const resolvedExpression = strip_nodes_1.stripNode(node);
            const result = evaluate_1.evaluateExpression(constructors_1.evaluationScope())(resolvedExpression);
            expect(result).toBeDefined();
            if (result) {
                expect(evaluate_1.simplify(result)).toEqual({
                    kind: 'NumberLiteral',
                    value: 10,
                });
            }
        });
    });
});
//# sourceMappingURL=type-check.test.js.map