"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearLocalStatements = exports.getLocalStatements = exports.appendLocalStatement = exports.appendGlobalStatement = exports.newUniqueId = void 0;
const monad_1 = require("./monad");
function newUniqueId(prefix) {
    return monad_1.Monad.of(state => state.child('makeUniqueId').apply(prefix));
}
exports.newUniqueId = newUniqueId;
function appendGlobalStatement(statement) {
    return monad_1.Monad.of((state) => {
        state.child('globalStatements').append(statement);
    });
}
exports.appendGlobalStatement = appendGlobalStatement;
function appendLocalStatement(statement) {
    return monad_1.Monad.of((state) => {
        state.child('localStatements').append(statement);
    });
}
exports.appendLocalStatement = appendLocalStatement;
function getLocalStatements() {
    return monad_1.Monad.of((state) => state.child('localStatements').get());
}
exports.getLocalStatements = getLocalStatements;
function clearLocalStatements() {
    return monad_1.Monad.of((state) => {
        state.child('localStatements').set([]);
    });
}
exports.clearLocalStatements = clearLocalStatements;
//# sourceMappingURL=monad-state-operations.js.map