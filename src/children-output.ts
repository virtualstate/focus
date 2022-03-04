import { ChildrenKeys, RawNodeValue } from "./access";

export type ChildrenOfNode<N> = RawNodeValue<N> extends { children: infer C }
  ? C
  : never;

export type FlatArrayValues<A> = A extends unknown[]
  ? {
      [K in keyof A]: A[K] extends [] ? FlatArray<A[K]> : A[K];
    }[keyof A]
  : A;
export type FlatArray<A> = FlatArrayValues<A>[];

export type IsFragment<N, True, False> = N extends { name: "fragment" }
  ? True
  : False;

export type ChildrenArrayTupleResolution<Z, T extends unknown[]> = T extends [
  infer K,
  ...infer L
]
  ? IsFragment<
      Z,
      [...ChildrenArray<Z>, ...ChildrenArrayTupleResolution<K, L>],
      [Z, ...ChildrenArrayTupleResolution<K, L>]
    >
  : T extends { length: 0 }
  ? IsFragment<Z, ChildrenArray<Z>, [Z]>
  : IsFragment<
      Z,
      IsFragment<
        T,
        [...ChildrenArray<Z>, ...ChildrenArray<T>],
        [...ChildrenArray<Z>, T]
      >,
      [Z, ...IsFragment<T, ChildrenArray<T>, [T]>]
    >;

export type ChildrenArray<
  N,
  C extends ChildrenOfNode<N> = ChildrenOfNode<N>
> = C extends Readonly<[infer Z, ...infer T]>
  ? ChildrenArrayTupleResolution<Z, T>
  : C extends [infer Z, ...infer T]
  ? ChildrenArrayTupleResolution<Z, T>
  : C extends Iterable<infer T>
  ? FlatArray<T>
  : C extends AsyncIterable<Readonly<[infer Z, ...infer T]>>
  ? ChildrenArrayTupleResolution<Z, T>
  : C extends AsyncIterable<[infer Z, ...infer T]>
  ? ChildrenArrayTupleResolution<Z, T>
  : C extends AsyncIterable<Iterable<infer T>>
  ? FlatArray<T>
  : never[] & { length: 0 };

type ValuesOf<A> = A[keyof A];

export type ChildrenSettledArray<N> = ChildrenArray<N> extends [
  infer Z,
  ...infer T
]
  ? [PromiseSettledResult<Z>, ...ChildrenSettledArray<{ children: T }>]
  : PromiseSettledResult<ValuesOf<ChildrenArray<N>>>[];
