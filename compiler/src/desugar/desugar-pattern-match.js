"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripDesugaredNodeWithoutPatternMatch = exports.makePatternMatchDesugaredNodeIterator = exports.desugarPatternMatch = void 0;
const lodash_1 = require("lodash");
const utils_1 = require("../type-checker/utils");
const visitor_utils_1 = require("../type-checker/visitor-utils");
const desugar_destructuring_1 = require("./desugar-destructuring");
const desugar_dual_bindings_1 = require("./desugar-dual-bindings");
const iterators_core_1 = require("./iterators-core");
const iterators_specific_1 = require("./iterators-specific");
function convertPatternMatchToConditions(value, test) {
    const scope = value.decoration.scope;
    switch (test.expression.kind) {
        case 'SymbolExpression':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression': {
            // TODO types are really hacky here
            return [{
                    kind: 'Node',
                    expression: {
                        kind: 'Application',
                        parameter: test,
                        callee: {
                            kind: 'Node',
                            expression: {
                                kind: 'Application',
                                parameter: value,
                                callee: {
                                    kind: 'Node',
                                    expression: {
                                        kind: 'Identifier',
                                        name: 'equals',
                                    },
                                    decoration: {
                                        scope,
                                        resolvedImplicits: [],
                                        type: {
                                            kind: 'FreeVariable',
                                            name: 'a',
                                        },
                                    },
                                },
                            },
                            decoration: {
                                scope,
                                resolvedImplicits: [],
                                type: {
                                    kind: 'FreeVariable',
                                    name: 'b',
                                },
                            },
                        },
                    },
                    decoration: {
                        scope,
                        resolvedImplicits: [],
                        type: {
                            kind: 'FreeVariable',
                            name: 'c',
                        },
                    },
                }];
        }
        case 'RecordExpression': {
            const valueType = value.decoration.type;
            if (valueType.kind !== 'RecordLiteral') {
                throw new Error(`Cannot compare value of type ${valueType.kind} to record pattern in match expression`);
            }
            return lodash_1.flatMap(test.expression.properties, (property, name) => (convertPatternMatchToConditions({
                kind: 'Node',
                expression: {
                    kind: 'ReadRecordPropertyExpression',
                    property: name,
                    record: value,
                },
                decoration: {
                    scope,
                    type: valueType.properties[name],
                    resolvedImplicits: []
                },
            }, property)));
        }
        case 'Identifier': {
            // const binding = findBinding(test.decoration.scope, test.expression.name);
            // if (binding) {
            //   // TODO return equals comparison
            // }
            return [];
        }
        case 'DataInstantiation': // TODO
        case 'ReadRecordPropertyExpression':
        case 'ReadDataPropertyExpression':
        case 'Application':
        case 'SimpleFunctionExpression':
        case 'BindingExpression':
        case 'NativeExpression':
            return [];
        default:
            return utils_1.assertNever(test.expression);
    }
}
function convertPatternMatchToBindings(value, test) {
    switch (test.expression.kind) {
        case 'Identifier':
            if (!(test.expression.name in test.decoration.scope.bindings)) {
                return [{ value, name: test.expression.name }];
            }
            return [];
        case 'SymbolExpression':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
            return [];
        case 'RecordExpression':
            const valueType = value.decoration.type;
            if (valueType.kind !== 'RecordLiteral') {
                throw new Error(`Cannot compare value of type ${valueType.kind} to record pattern in match expression`);
            }
            return lodash_1.flatMap(test.expression.properties, (property, name) => (convertPatternMatchToBindings({
                kind: 'Node',
                expression: {
                    kind: 'ReadRecordPropertyExpression',
                    property: name,
                    record: value,
                },
                decoration: {
                    scope: test.decoration.scope,
                    type: valueType.properties[name],
                    resolvedImplicits: [],
                },
            }, property)));
        case 'DataInstantiation': // TODO
        case 'SimpleFunctionExpression':
        case 'Application':
        case 'BindingExpression':
        case 'ReadRecordPropertyExpression':
        case 'ReadDataPropertyExpression':
        case 'NativeExpression':
            return [];
        default:
            return utils_1.assertNever(test.expression);
    }
}
function combineConditions(conditions, value, alternative) {
    const decoration = {
        type: {
            kind: 'FreeVariable',
            name: 't'
        },
        scope: value.decoration.scope,
        resolvedImplicits: [],
    };
    const combinedCondition = conditions.reduce((left, right) => {
        return {
            kind: 'Node',
            decoration,
            expression: {
                kind: 'Application',
                parameter: right,
                callee: {
                    kind: 'Node',
                    decoration,
                    expression: {
                        kind: 'Application',
                        parameter: left,
                        callee: {
                            kind: 'Node',
                            decoration,
                            expression: {
                                kind: 'Identifier',
                                name: 'and',
                            },
                        },
                    },
                },
            },
        };
    });
    return {
        kind: 'Node',
        decoration,
        expression: {
            kind: 'Application',
            parameter: alternative,
            callee: {
                kind: 'Node',
                decoration,
                expression: {
                    kind: 'Application',
                    parameter: value,
                    callee: {
                        kind: 'Node',
                        decoration,
                        expression: {
                            kind: 'Application',
                            parameter: combinedCondition,
                            callee: {
                                kind: 'Node',
                                decoration,
                                expression: {
                                    kind: 'Identifier',
                                    name: 'if',
                                },
                            },
                        },
                    },
                },
            },
        },
    };
}
function makeConsequent(bindings, body) {
    const decoration = {
        type: {
            kind: 'FreeVariable',
            name: 't'
        },
        scope: body.decoration.scope,
        resolvedImplicits: [],
    };
    return bindings.reduceRight((body, binding) => {
        return {
            kind: 'Node',
            decoration,
            expression: {
                kind: 'BindingExpression',
                name: binding.name,
                value: binding.value,
                body,
            },
        };
    }, body);
}
function wrapInBinding(name, value, body) {
    return {
        kind: 'Node',
        decoration: body.decoration,
        expression: {
            kind: 'BindingExpression',
            name,
            value,
            body: body,
        },
    };
}
function shallowDesugarPatternMatch({ expression, decoration }) {
    switch (expression.kind) {
        case 'Identifier':
        case 'BooleanExpression':
        case 'NumberExpression':
        case 'StringExpression':
        case 'SymbolExpression':
        case 'RecordExpression':
        case 'Application':
        case 'SimpleFunctionExpression':
        case 'DataInstantiation':
        case 'ReadRecordPropertyExpression':
        case 'ReadDataPropertyExpression':
        case 'NativeExpression':
        case 'BindingExpression':
            return { expression, decoration, kind: 'Node' };
        case 'PatternMatchExpression': {
            const identifier = { kind: 'Identifier', name: 'MATCH_VARIABLE$' };
            const identifierNode = {
                kind: 'Node',
                expression: identifier,
                decoration: expression.value.decoration,
            };
            const patterns = expression.patterns.map((pattern) => {
                const conditions = convertPatternMatchToConditions(identifierNode, pattern.test);
                const bindings = convertPatternMatchToBindings(identifierNode, pattern.test);
                return {
                    conditions,
                    value: makeConsequent(bindings, pattern.value),
                };
            });
            if (patterns.length === 0) {
                throw new Error('Cannot have a pattern match with no patterns');
            }
            if (patterns.length === 1) {
                return wrapInBinding(identifier.name, expression.value, patterns[0].value);
            }
            return wrapInBinding(identifier.name, expression.value, patterns.slice(0, -1).reduce((alternative, pattern) => {
                return combineConditions(pattern.conditions, pattern.value, alternative);
            }, patterns[patterns.length - 1].value));
        }
        default:
            return utils_1.assertNever(expression);
    }
}
function desugarPatternMatch(node) {
    const internal = (node) => shallowDesugarPatternMatch(visitor_utils_1.mapNode(iterator, node));
    const iterator = desugar_dual_bindings_1.makeDualBindingDesugaredNodeIterator(internal);
    return internal(node);
}
exports.desugarPatternMatch = desugarPatternMatch;
function makePatternMatchDesugaredNodeIterator(f) {
    return iterators_core_1.combineIteratorMap({
        Identifier: iterators_specific_1.emptyMapIterator,
        BooleanExpression: iterators_specific_1.emptyMapIterator,
        StringExpression: iterators_specific_1.emptyMapIterator,
        NumberExpression: iterators_specific_1.emptyMapIterator,
        SymbolExpression: iterators_specific_1.emptyMapIterator,
        NativeExpression: iterators_specific_1.emptyMapIterator,
        Application: iterators_specific_1.applicationMapIterator,
        DataInstantiation: iterators_specific_1.dataInstantiationMapIterator,
        ReadDataPropertyExpression: iterators_specific_1.readDataPropertyMapIterator,
        ReadRecordPropertyExpression: iterators_specific_1.readRecordPropertyMapIterator,
        SimpleFunctionExpression: desugar_destructuring_1.simpleFunctionMapIterator,
        BindingExpression: iterators_specific_1.bindingMapIterator,
        RecordExpression: iterators_specific_1.recordMapIterator,
    })(f);
}
exports.makePatternMatchDesugaredNodeIterator = makePatternMatchDesugaredNodeIterator;
const stripDesugaredExpressionNodeWithoutPatternMatch = (makePatternMatchDesugaredNodeIterator(node => stripDesugaredExpressionNodeWithoutPatternMatch(iterators_specific_1.shallowStripNode(node))));
function stripDesugaredNodeWithoutPatternMatch(node) {
    return stripDesugaredExpressionNodeWithoutPatternMatch(iterators_specific_1.shallowStripNode(node));
}
exports.stripDesugaredNodeWithoutPatternMatch = stripDesugaredNodeWithoutPatternMatch;
//# sourceMappingURL=desugar-pattern-match.js.map