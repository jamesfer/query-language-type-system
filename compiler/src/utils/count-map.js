"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CountMap = void 0;
class CountMap {
    constructor() {
        this.map = new Map();
    }
    increment(key) {
        var _a;
        this.map.set(key, ((_a = this.map.get(key)) !== null && _a !== void 0 ? _a : 0) + 1);
    }
    decrement(key) {
        const current = this.map.get(key);
        if (current !== undefined) {
            if (current === 1) {
                this.map.delete(key);
            }
            else {
                this.map.set(key, current - 1);
            }
        }
    }
    has(key) {
        return this.map.has(key);
    }
}
exports.CountMap = CountMap;
//# sourceMappingURL=count-map.js.map