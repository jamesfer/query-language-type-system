"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeBrokenExpressionMatcher = exports.makeExpressionMatcher = exports.protectAgainstLoops = exports.withoutPrevious = exports.withPrevious = exports.matchTokens = exports.matchKeyword = exports.matchRepeated = exports.matchAny = exports.matchAll = exports.matchOption = void 0;
const lodash_1 = require("lodash");
const utils_1 = require("../../type-checker/utils");
const free_1 = require("../../utils/free");
const interpreter_utils_1 = require("./interpreter-utils");
const message_state_1 = require("./message-state");
const token_state_1 = require("./token-state");
function matchOption(childInterpreter) {
    return interpreter_utils_1.interpreter('matchOption', (tokens, previous, precedence) => free_1.pipeFree(interpreter_utils_1.runInterpreter(childInterpreter, tokens, previous, precedence), (withMessages) => free_1.pureFree(message_state_1.doWithState((state) => {
        const result = state.unwrap(withMessages);
        return result.length > 0 ? result : [token_state_1.withTokens([], undefined)];
    }))));
}
exports.matchOption = matchOption;
function matchAll(...interpreters) {
    return f => (tokens, ...interpreterParams) => message_state_1.doWithFreeState(state => free_1.pipeFree(interpreters.reduce((combinations, interpreter) => free_1.pipeFree(combinations, combinations => free_1.traverseFree(combinations, combination => free_1.pipeFree(interpreter_utils_1.runInterpreter(interpreter, tokens.slice(combination.tokens.length), ...interpreterParams), free_1.returningFree(state.unwrap.bind(state)), free_1.returningFree(results => results.map(result => (token_state_1.flatMapWithTokens(combination, combination => (token_state_1.mapWithTokens(result, resultValue => [...combination, resultValue])))))))), free_1.returningFree(lodash_1.flatten)), free_1.pureFree([token_state_1.withTokens([], [])])), free_1.returningFree(values => values.map(token_state_1.mapWithTokens(f)))));
}
exports.matchAll = matchAll;
function matchAny(...interpreters) {
    return interpreter_utils_1.interpreter(undefined, (...interpreterParams) => message_state_1.doWithFreeState((state) => free_1.pipeFree(free_1.traverseFree(interpreters, interpreter => interpreter_utils_1.runInterpreter(interpreter, ...interpreterParams)), free_1.returningFree(a => state.sequence(a)), free_1.returningFree(lodash_1.flatten))));
}
exports.matchAny = matchAny;
function matchRepeatedRecursive(tokens, previous, precedence, childInterpreter, previousMatches) {
    return message_state_1.doWithFreeState((state) => {
        return free_1.pipeFree(free_1.traverseFree(previousMatches, (({ tokens: usedTokens }) => (interpreter_utils_1.runInterpreter(childInterpreter, tokens.slice(usedTokens.length), previous, precedence)))), free_1.returningFree(state.sequence.bind(state)), (nextMatches) => {
            const [failedMatches, successfulMatches] = lodash_1.partition(utils_1.checkedZip(previousMatches, nextMatches), ([, nextResults]) => nextResults.length === 0);
            if (failedMatches.length >= 4 || successfulMatches.length >= 4) {
                console.log(failedMatches.length, successfulMatches.length);
            }
            // Add each of the failed to matches to the completed list
            const completedMatches = lodash_1.map(failedMatches, '0');
            // Add the successful matches to the previous matches to continue searching for them
            const successfulResults = lodash_1.flatMap(successfulMatches, ([previousResult, nextResults]) => (nextResults.map(nextResult => token_state_1.flatMapWithTokens(previousResult, previousValues => (token_state_1.mapWithTokens(nextResult, nextValue => [...previousValues, nextValue]))))));
            if (successfulResults.length === 0) {
                return free_1.pureFree(completedMatches);
            }
            return free_1.mapFree(matchRepeatedRecursive(tokens, previous, precedence, childInterpreter, successfulResults), (repeatedMatches) => [...completedMatches, ...state.unwrap(repeatedMatches)]);
        });
    });
}
function matchRepeated(childInterpreter) {
    return interpreter_utils_1.interpreter(undefined, (tokens, previous, precedence) => message_state_1.doWithFreeState((state) => {
        return free_1.pipeFree(
        // Initially run the interpreter against the tokens
        interpreter_utils_1.runInterpreter(childInterpreter, tokens, previous, precedence), free_1.returningFree(state.unwrap.bind(state)), (previousResults) => {
            const previousMatches = previousResults.map(({ tokens, value }) => token_state_1.withTokens(tokens, [value]));
            return matchRepeatedRecursive(tokens, previous, precedence, childInterpreter, previousMatches);
        }, free_1.returningFree(state.unwrap.bind(state)));
    }));
}
exports.matchRepeated = matchRepeated;
exports.matchKeyword = (keyword) => (interpreter_utils_1.interpreter(`matchKeyword(${keyword})`, (...interpreterParams) => message_state_1.doWithFreeState((state) => (free_1.pipeFree(interpreter_utils_1.runInterpreter(exports.matchTokens('keyword'), ...interpreterParams), free_1.returningFree(state.unwrap.bind(state)), free_1.returningFree(results => (lodash_1.flatMap(results, ({ value: [token] }) => (token && token.value === keyword ? [token_state_1.withTokens([token], token)] : [])))))))));
exports.matchTokens = (...kinds) => (interpreter_utils_1.interpreter(`matchTokens(${kinds.join(', ')})`, (tokens) => message_state_1.doWithFreeState(() => {
    if (kinds.every((kind, index) => tokens[index] && tokens[index].kind === kind)) {
        const matchedTokens = tokens.slice(0, kinds.length);
        return free_1.pureFree([token_state_1.withTokens(matchedTokens, matchedTokens)]);
    }
    return free_1.pureFree([]);
})));
exports.withPrevious = (precedence) => (interpreter_utils_1.interpreter('withPrevious', (_, previous, previousPrecedence) => free_1.pureFree(message_state_1.withMessages([], previous !== undefined && precedence >= previousPrecedence
    ? [token_state_1.withTokens([], previous)]
    : []))));
exports.withoutPrevious = interpreter_utils_1.interpreter('withoutPrevious', (_, previous) => (free_1.pureFree(message_state_1.withMessages([], previous === undefined ? [token_state_1.withTokens([], null)] : []))));
function protectAgainstLoops(wrapped) {
    let lastState = undefined;
    return interpreter_utils_1.interpreter(undefined, utils_1.withRecursiveFreeState((state, tokens, previous, precedence) => {
        const newState = { tokens, previous, precedence };
        if (lodash_1.isEqual(lastState, newState)) {
            throw new Error(`Loop detected. Tokens: ${JSON.stringify(lastState === null || lastState === void 0 ? void 0 : lastState.tokens)}`);
        }
        return [newState, () => interpreter_utils_1.runInterpreter(wrapped, tokens, previous, precedence)];
    }));
}
exports.protectAgainstLoops = protectAgainstLoops;
/**
 * This has to be a function because it is referenced inside the other interpret function
 */
function recursivelyMatchExpression(interpretExpressionComponent) {
    return interpreter_utils_1.interpreter('recursivelyMatchExpression', (tokens, previous, precedence) => {
        return message_state_1.doWithFreeState((state) => {
            return free_1.pipeFree(interpreter_utils_1.runInterpreter(interpretExpressionComponent, tokens, previous, precedence), free_1.returningFree(state.unwrap.bind(state)), (results) => {
                return free_1.traverseFree(results, ({ value, tokens: resultTokens }) => free_1.pipeFree(interpreter_utils_1.runInterpreter(recursivelyMatchExpression(interpretExpressionComponent), tokens.slice(resultTokens.length), value, precedence), free_1.returningFree(state.unwrap.bind(state)), free_1.returningFree(recursiveResults => (recursiveResults.map(({ tokens, value }) => token_state_1.withTokens([...resultTokens, ...tokens], value)))), free_1.returningFree(recursiveResults => recursiveResults.length > 0 ? recursiveResults : results)));
            }, free_1.returningFree(lodash_1.flatten));
        });
    });
}
function makeExpressionMatcher(interpretExpression) {
    return precedence => interpreter_utils_1.interpreter('matchExpression', (tokens) => (interpreter_utils_1.runInterpreter(recursivelyMatchExpression(interpretExpression()), tokens, undefined, precedence)));
}
exports.makeExpressionMatcher = makeExpressionMatcher;
function makeBrokenExpressionMatcher(interpretExpression) {
    return precedence => interpreter_utils_1.interpreter('matchBrokenExpression', (tokens) => matchAll(exports.matchTokens('break'), recursivelyMatchExpression(interpretExpression()))(([_, e]) => e)(tokens, undefined, precedence));
}
exports.makeBrokenExpressionMatcher = makeBrokenExpressionMatcher;
//# sourceMappingURL=matchers.js.map