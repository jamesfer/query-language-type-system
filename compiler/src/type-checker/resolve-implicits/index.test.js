"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const constructors_1 = require("../constructors");
const index_1 = require("./index");
describe('resolveImplicits', () => {
    it('does nothing to a node with equivalent shape and type', () => {
        const [messages, resolvedNode] = index_1.resolveImplicits(constructors_1.node(constructors_1.numberExpression(123), {
            scope: { bindings: {}, },
            shape: constructors_1.numberLiteral(123),
            type: constructors_1.numberLiteral(123),
        }));
        expect(messages).toEqual([]);
        expect(resolvedNode).toEqual(constructors_1.node(constructors_1.numberExpression(123), {
            scope: { bindings: {} },
            type: constructors_1.numberLiteral(123),
            resolvedImplicits: [],
        }));
    });
    it('resolves simple implicits', () => {
        const scope = {
            bindings: {
                aBoolean: constructors_1.booleanLiteral(true),
            },
        };
        const [messages, resolvedNode] = index_1.resolveImplicits(constructors_1.node(constructors_1.identifier('a'), {
            scope,
            shape: constructors_1.numberLiteral(123),
            type: constructors_1.functionType(constructors_1.numberLiteral(123), [[constructors_1.booleanLiteral(true), true]]),
        }));
        expect(messages).toEqual([]);
        expect(resolvedNode).toEqual(constructors_1.node({
            kind: 'Application',
            callee: constructors_1.node(constructors_1.identifier('a'), {
                scope,
                type: constructors_1.functionType(constructors_1.numberLiteral(123), [[constructors_1.booleanLiteral(true), true]]),
                resolvedImplicits: [['aBoolean', constructors_1.booleanLiteral(true)]],
            }),
            parameter: constructors_1.node(constructors_1.identifier('aBoolean'), {
                scope,
                type: constructors_1.booleanLiteral(true),
                resolvedImplicits: [],
            }),
        }, {
            scope,
            type: constructors_1.numberLiteral(123),
            resolvedImplicits: [],
        }));
    });
    describe('when there are no matching implicits', () => {
        let scope;
        let messages;
        let resolvedNode;
        beforeEach(() => {
            scope = { bindings: {} };
            [messages, resolvedNode] = index_1.resolveImplicits(constructors_1.node(constructors_1.identifier('a'), {
                scope,
                shape: constructors_1.numberLiteral(123),
                type: constructors_1.functionType(constructors_1.numberLiteral(123), [[constructors_1.booleanLiteral(true), true]]),
            }));
        });
        it('emits a message', () => {
            expect(messages).toEqual(['Could not find a valid set of replacements for implicits']);
        });
        it('doesn\'t change the resolvedNode', () => {
            expect(resolvedNode).toEqual(constructors_1.node(constructors_1.identifier('a'), {
                scope,
                type: constructors_1.functionType(constructors_1.numberLiteral(123), [[constructors_1.booleanLiteral(true), true]]),
                resolvedImplicits: [],
            }));
        });
    });
    it.skip('resolves dependent implicit parameters', () => {
        const scope = {
            bindings: {
                tWithNumber: constructors_1.dataValue('T', [constructors_1.numberLiteral(7)]),
                mWithNumber: constructors_1.dataValue('M', [constructors_1.numberLiteral(7)]),
                tWithBoolean: constructors_1.dataValue('T', [constructors_1.booleanLiteral(true)]),
                mWithString: constructors_1.dataValue('M', [constructors_1.stringLiteral('a string')]),
            },
        };
        const [messages, resolvedNode] = index_1.resolveImplicits(constructors_1.node(constructors_1.identifier('a'), {
            scope,
            shape: constructors_1.numberLiteral(123),
            type: constructors_1.functionType(constructors_1.numberLiteral(123), [
                [constructors_1.dataValue('T', [constructors_1.freeVariable('X')]), true],
                [constructors_1.dataValue('M', [constructors_1.freeVariable('X')]), true],
            ]),
        }));
        expect(messages).toEqual([]);
        expect(resolvedNode).toEqual(constructors_1.node({
            kind: 'Application',
            callee: constructors_1.node({
                kind: 'Application',
                callee: constructors_1.node(constructors_1.identifier('a'), {
                    scope,
                    type: constructors_1.functionType(constructors_1.numberLiteral(123), [
                        [constructors_1.dataValue('T', [constructors_1.freeVariable('X')]), true],
                        [constructors_1.dataValue('M', [constructors_1.freeVariable('X')]), true,]
                    ]),
                    resolvedImplicits: [
                        ['tWithNumber', constructors_1.dataValue('T', [constructors_1.numberLiteral(7)])],
                        ['mWithNumber', constructors_1.dataValue('M', [constructors_1.numberLiteral(7)])],
                    ],
                }),
                parameter: constructors_1.node(constructors_1.identifier('tWithNumber'), {
                    scope,
                    type: constructors_1.dataValue('T', [constructors_1.numberLiteral(7)]),
                    resolvedImplicits: [],
                }),
            }, {
                scope,
                type: constructors_1.numberLiteral(123),
                resolvedImplicits: [],
            }),
            parameter: constructors_1.node(constructors_1.identifier('mWithNumber'), {
                scope,
                type: constructors_1.dataValue('M', [constructors_1.numberLiteral(7)]),
                resolvedImplicits: [],
            }),
        }, {
            scope,
            type: constructors_1.numberLiteral(123),
            resolvedImplicits: [],
        }));
    });
});
//# sourceMappingURL=index.test.js.map