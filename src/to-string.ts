import {ChildrenKeys, FragmentName, NameKeys} from "./access";


type GetValueOfProperty<N, P> = {
    [K in keyof N]: K extends P ? N[K] : never
}[keyof N];

export type GetName<N> = GetValueOfProperty<N, NameKeys>;
export type GetChildren<N> = GetValueOfProperty<N, ChildrenKeys>;

export type IsFragment<N, True, False> = GetName<N> extends FragmentName
    ? True
    : False;

export namespace KDL {

    export type ChildrenArrayTupleResolution<Z, T extends unknown[]> = T extends [
            infer K,
            ...infer L
        ]
        ? IsFragment<
            Z,
            `${ChildrenArray<Z>}\n${ChildrenArrayTupleResolution<K, L>}`,
            `${ToString<Z>}\n${ChildrenArrayTupleResolution<K, L>}`
            >
        : T extends []
            ? IsFragment<Z, ChildrenArray<Z>, ToString<Z>>
            : IsFragment<
                Z,
                IsFragment<
                    T,
                    `${ChildrenArray<Z>}\n${ChildrenArray<T>}`,
                    `${ChildrenArray<Z>}\n${ToString<T>}`
                    >,
                `${ToString<Z>}\n${IsFragment<T, ChildrenArray<T>, ToString<T>>}`
                >;


    export type FlatArrayValues<A> = A extends unknown[]
        ? {
            [K in keyof A]: A[K] extends [] ? FlatArray<A[K]> : ToString<A[K]>;
        }[keyof A]
        : ToString<A>;
    export type FlatArray<A> = `${FlatArrayValues<A>}`;

    export type ChildrenArray<
        N,
        C extends GetChildren<N> = GetChildren<N>
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
                            : "";

    type JSONValue = string | boolean | symbol | number;

    export type ToJSONString<N> =
        N extends string ? `"${N}"` :
            N extends number | boolean ? `${N}` :
                N extends symbol ? `Symbol(${string})` : string;

    export type ToString<N> =
        N extends JSONValue ? `${ToJSONString<N>}` :
            IsFragment<N, ChildrenArray<N>, GetName<N> extends JSONValue ?
                `${ToJSONString<GetName<N>>} ${ChildrenArray<N> extends "" ? "" : `{\n${ChildrenArray<N>}\n}`}` : ChildrenArray<N>>;

}

export namespace JSX {

    export type ChildrenArrayTupleResolution<Z, T extends unknown[]> = T extends [
            infer K,
            ...infer L
        ]
        ? IsFragment<
            Z,
            `${ChildrenArray<Z>}\n${ChildrenArrayTupleResolution<K, L>}`,
            `${ToString<Z>}\n${ChildrenArrayTupleResolution<K, L>}`
            >
        : T extends []
            ? IsFragment<Z, ChildrenArray<Z>, ToString<Z>>
            : IsFragment<
                Z,
                IsFragment<
                    T,
                    `${ChildrenArray<Z>}\n${ChildrenArray<T>}`,
                    `${ChildrenArray<Z>}\n${ToString<T>}`
                    >,
                `${ToString<Z>}\n${IsFragment<T, ChildrenArray<T>, ToString<T>>}`
                >;


    export type FlatArrayValues<A> = A extends unknown[]
        ? {
            [K in keyof A]: A[K] extends [] ? FlatArray<A[K]> : ToString<A[K]>;
        }[keyof A]
        : ToString<A>;
    export type FlatArray<A> = `${FlatArrayValues<A>}`;

    export type ChildrenArray<
        N,
        C extends GetChildren<N> = GetChildren<N>
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
                            : "";

    type JSONValue = string | boolean | symbol | number;

    export type ToJSONString<N> =
        N extends string ? `{"${N}"}` :
            N extends number | boolean ? `{${N}}` :
                N extends symbol ? `{Symbol(${string})}` : `{${string}}`;

    export type ToString<N> =
        N extends JSONValue ? `${ToJSONString<N>}` :
            IsFragment<N, ChildrenArray<N>, GetName<N> extends string ?
                `<${GetName<N>}${ChildrenArray<N> extends "" ? "/>" : `>\n${ChildrenArray<N>}\n</${GetName<N>}>`}` : ChildrenArray<N>>;

}

export namespace HTML {

    export type ChildrenArrayTupleResolution<Z, T extends unknown[]> = T extends [
            infer K,
            ...infer L
        ]
        ? IsFragment<
            Z,
            `${ChildrenArray<Z>}\n${ChildrenArrayTupleResolution<K, L>}`,
            `${ToString<Z>}\n${ChildrenArrayTupleResolution<K, L>}`
            >
        : T extends []
            ? IsFragment<Z, ChildrenArray<Z>, ToString<Z>>
            : IsFragment<
                Z,
                IsFragment<
                    T,
                    `${ChildrenArray<Z>}\n${ChildrenArray<T>}`,
                    `${ChildrenArray<Z>}\n${ToString<T>}`
                    >,
                `${ToString<Z>}\n${IsFragment<T, ChildrenArray<T>, ToString<T>>}`
                >;


    export type FlatArrayValues<A> = A extends unknown[]
        ? {
            [K in keyof A]: A[K] extends [] ? FlatArray<A[K]> : ToString<A[K]>;
        }[keyof A]
        : ToString<A>;
    export type FlatArray<A> = `${FlatArrayValues<A>}`;

    export type ChildrenArray<
        N,
        C extends GetChildren<N> = GetChildren<N>
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
                            : "";

    type JSONValue = string | boolean | symbol | number;

    export type ToJSONString<N> =
        N extends string ? `${N}` :
            N extends number | boolean ? `${N}` :
                N extends symbol ? `Symbol(${string})` : string;

    export type ToString<N> =
        N extends JSONValue ? `${ToJSONString<N>}` :
            IsFragment<N, ChildrenArray<N>, GetName<N> extends string ?
                `<${GetName<N>}${ChildrenArray<N> extends "" ? "/>" : `>\n${ChildrenArray<N>}\n</${GetName<N>}>`}` : ChildrenArray<N>>
            ;

}