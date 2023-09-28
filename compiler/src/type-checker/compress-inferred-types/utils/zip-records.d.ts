import { These } from 'fp-ts/These';
export declare function zipRecords<A, B>(leftRecord: {
    [K: string]: A;
}, rightRecord: {
    [K: string]: B;
}): {
    [K: string]: These<A, B>;
};
//# sourceMappingURL=zip-records.d.ts.map