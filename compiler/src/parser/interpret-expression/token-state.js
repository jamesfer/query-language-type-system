"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function withTokens(tokens, value) {
    return { tokens, value };
}
exports.withTokens = withTokens;
function mapWithTokens(result, f) {
    if (typeof result === 'function') {
        return (actualResult) => mapWithTokens(actualResult, result);
    }
    if (!f) {
        throw new Error('Missing parameter to mapWithTokens');
    }
    const { tokens, value } = result;
    return withTokens(tokens, f(value));
}
exports.mapWithTokens = mapWithTokens;
function flatMapWithTokens({ tokens, value }, f) {
    const { tokens: resultTokens, value: resultValue } = f(value);
    return withTokens([...tokens, ...resultTokens], resultValue);
}
exports.flatMapWithTokens = flatMapWithTokens;
//# sourceMappingURL=token-state.js.map