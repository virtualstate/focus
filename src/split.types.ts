export type SplitAddJoin<T extends string, Split extends string, Prefix extends string> =
    T extends `${infer L}${Split}${infer R}`
        ? `${Prefix}${L}${Split}${SplitAddJoin<R, Split, Prefix>}`
        : `${Prefix}${T}`;
