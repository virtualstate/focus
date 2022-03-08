type U2I<U> = (
    U extends unknown ? (arg: U) => 0 : never
    ) extends (arg: infer I) => 0 ? I : never;

type Last<U> = U2I<
    U extends unknown ? (x: U) => 0 : never
    > extends (x: infer L) => 0 ? L : never;

type U2T<U, L = Last<U>> = [U] extends [never]
    ? []
    : [...U2T<Exclude<U, L>>, L];

type Satisfies<T extends U, U> = T;

type T2S<T extends any[]> = T extends [Satisfies<infer F, string>, ...Satisfies<infer R, string[]>] ? `${F}${T2S<R>}` : '';

export type Join<S extends string> = T2S<U2T<S>>;