"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unique_id_generator_1 = require("./unique-id-generator");
describe('uniqueIdGenerator', () => {
    it('generates unique ids independently', () => {
        const generator1 = unique_id_generator_1.uniqueIdStream();
        const generator2 = unique_id_generator_1.uniqueIdStream();
        expect(generator1()).toEqual('1');
        expect(generator2()).toEqual('1');
        expect(generator1()).toEqual('2');
        expect(generator1()).toEqual('3');
        expect(generator2()).toEqual('2');
    });
    it('prepends a prefix if provided', () => {
        const generator = unique_id_generator_1.uniqueIdStream();
        expect(generator('prefix')).toEqual('prefix1');
        expect(generator('prefix')).toEqual('prefix2');
    });
});
//# sourceMappingURL=unique-id-generator.test.js.map