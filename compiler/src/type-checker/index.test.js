"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unique_id_generator_1 = require("../utils/unique-id-generator");
const constructors_1 = require("./constructors");
const index_1 = require("./index");
const test_unique_id_generators_1 = require("./test-utils/test-unique-id-generators");
const utils_1 = require("./utils");
describe('checkTypes', () => {
    describe('when checking an expression with inference', () => {
        let uniqueIdGenerator;
        let expression;
        let messages;
        let node;
        beforeEach(() => {
            uniqueIdGenerator = unique_id_generator_1.uniqueIdStream();
            expression = utils_1.pipe(constructors_1.bind('number', 123), constructors_1.bind('identity', constructors_1.lambda(['a'], 'a')), constructors_1.apply('identity', ['number']));
            [messages, node] = index_1.checkTypes(uniqueIdGenerator, expression);
        });
        it('produces no messages', () => {
            expect(messages).toEqual([]);
        });
        it('infers the type of the result', () => {
            expect(node.decoration.type).toEqual(constructors_1.numberLiteral(123));
        });
    });
    describe('when checking an unused expression with implicit parameters', () => {
        let uniqueIdGenerator;
        let expression;
        let messages;
        let node;
        beforeEach(() => {
            uniqueIdGenerator = test_unique_id_generators_1.prefixlessUniqueIdGenerator();
            expression = utils_1.pipe(constructors_1.data('Integer', ['a']), constructors_1.bind('integerIdentity', constructors_1.lambda([[constructors_1.apply('Integer', ['b']), true], constructors_1.identifier('b')], constructors_1.identifier('b'))), constructors_1.numberExpression(1));
            [messages, node] = index_1.checkTypes(uniqueIdGenerator, expression);
        });
        it('produces no messages', () => {
            expect(messages).toEqual([]);
        });
        it('infers the type of the result', () => {
            expect(node.decoration.type).toEqual(constructors_1.numberLiteral(1));
        });
    });
    describe('when checking an expression with implicit parameters', () => {
        let uniqueIdGenerator;
        let expression;
        let messages;
        let node;
        beforeEach(() => {
            uniqueIdGenerator = unique_id_generator_1.uniqueIdStream();
            expression = utils_1.pipe(constructors_1.data('Integer', ['a']), constructors_1.bind('integer1', constructors_1.apply('Integer', [1])), constructors_1.bind('integerIdentity', constructors_1.lambda([[constructors_1.apply('Integer', ['b']), true], constructors_1.identifier('b')], constructors_1.identifier('b'))), constructors_1.apply('integerIdentity', [1]));
            [messages, node] = index_1.checkTypes(uniqueIdGenerator, expression);
        });
        it('produces no messages', () => {
            expect(messages).toEqual([]);
        });
        it('infers the type of the result', () => {
            expect(node.decoration.type).toEqual(constructors_1.numberLiteral(1));
        });
    });
    describe('when checking an expression with a missing implicit parameter', () => {
        let uniqueIdGenerator;
        let expression;
        let messages;
        let node;
        beforeEach(() => {
            uniqueIdGenerator = unique_id_generator_1.uniqueIdStream();
            expression = utils_1.pipe(constructors_1.data('Color', ['a']), constructors_1.bind('colorIdentity', constructors_1.lambda([[constructors_1.apply('Color', ['b']), true], constructors_1.identifier('b')], constructors_1.identifier('b'))), constructors_1.apply('colorIdentity', [constructors_1.stringExpression('red')]));
            [messages, node] = index_1.checkTypes(uniqueIdGenerator, expression);
        });
        it('produces a message due to missing implicits', () => {
            expect(messages).toEqual(['Could not find a valid set of replacements for implicits']);
        });
        it('infers the type of the result', () => {
            expect(node.decoration.type).toEqual(constructors_1.stringLiteral('red'));
        });
    });
    describe('when checking an expression with functions converging', () => {
        let uniqueIdGenerator;
        let expression;
        let messages;
        let node;
        beforeEach(() => {
            uniqueIdGenerator = test_unique_id_generators_1.prefixlessUniqueIdGenerator();
            expression = utils_1.pipe(constructors_1.data('Integer', ['a']), constructors_1.bind('integerIdentity', constructors_1.lambda([[constructors_1.apply('Integer', ['b']), true], constructors_1.identifier('b')], constructors_1.identifier('b'))), constructors_1.bind('mapInteger', constructors_1.lambda([
                [constructors_1.apply('Integer', ['c']), true],
                constructors_1.identifier('c'),
                constructors_1.lambda([
                    [constructors_1.apply('Integer', ['d']), true],
                    constructors_1.identifier('d'),
                ], constructors_1.identifier('d')),
            ], constructors_1.identifier('c'))), constructors_1.apply('mapInteger', [1, 'integerIdentity']));
            [messages, node] = index_1.checkTypes(uniqueIdGenerator, expression);
        });
        it('produces no messages', () => {
            expect(messages).toEqual([]);
        });
        it('infers the type of the result', () => {
            expect(node.decoration.type).toEqual(constructors_1.numberLiteral(1));
        });
    });
    describe('when checking an expression with a typeclass', () => {
        let uniqueIdGenerator;
        let expression;
        let messages;
        let node;
        beforeEach(() => {
            uniqueIdGenerator = unique_id_generator_1.uniqueIdStream();
            expression = utils_1.pipe(constructors_1.data('Integer', ['a']), constructors_1.data('IAddable', ['I', 'methods'], [
                'x',
                constructors_1.record({
                    go: constructors_1.lambda([
                        constructors_1.apply('I', ['n']),
                        'n',
                    ], 'n'),
                }),
            ]), constructors_1.bind('integerIdentity', constructors_1.lambda([constructors_1.apply('Integer', ['b']), 'b'], 'b')), constructors_1.bind('implementation', constructors_1.apply('IAddable', ['Integer', constructors_1.record({ go: constructors_1.identifier('integerIdentity') })])), constructors_1.numberExpression(111111));
            [messages, node] = index_1.checkTypes(uniqueIdGenerator, expression);
        });
        it('produces no messages', () => {
            expect(messages).toEqual([]);
        });
        it('infers the type of the result', () => {
            expect(node.decoration.type).toEqual(constructors_1.numberLiteral(111111));
        });
    });
    describe('when checking ', () => {
        let uniqueIdGenerator;
        let expression;
        let messages;
        let node;
        beforeEach(() => {
            uniqueIdGenerator = unique_id_generator_1.uniqueIdStream();
            expression = utils_1.pipe(constructors_1.data('Integer', ['a']), constructors_1.data('IAddable', ['I', 'methods'], [
                'x',
                constructors_1.record({
                    go: constructors_1.lambda([
                        constructors_1.apply('I', ['n']),
                        'n',
                    ], 'n'),
                }),
            ]), constructors_1.bind('integerIdentity', constructors_1.lambda([constructors_1.apply('Integer', ['b']), 'b'], 'b')), constructors_1.bind('implementation', constructors_1.apply('IAddable', ['Integer', constructors_1.record({ go: constructors_1.identifier('integerIdentity') })])), constructors_1.numberExpression(111111));
            [messages, node] = index_1.checkTypes(uniqueIdGenerator, expression);
        });
        it('produces no messages', () => {
            expect(messages).toEqual([]);
        });
        it('infers the type of the result', () => {
            expect(node.decoration.type).toEqual(constructors_1.numberLiteral(111111));
        });
    });
});
//# sourceMappingURL=index.test.js.map