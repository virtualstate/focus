import {PossibleChildrenKeys, PossibleNameKeys} from "./node";
import {ChildrenArray} from "./children-output";


type GetValueOfProperty<N, P> = {
    [K in keyof N]: K extends P ? N[K] : never
}[keyof N];

export type GetName<N> = GetValueOfProperty<N, PossibleNameKeys>;
export type GetChildren<N> = GetValueOfProperty<N, PossibleChildrenKeys>;


type JSONValue = string | boolean | symbol | number;

export type ToJSONString<N> =
    N extends string ? `"${N}"` :
        N extends number | boolean ? `${N}` :
            N extends symbol ? `Symbol(${string})` : string;

export type ToKDLString<N> =
    N extends JSONValue ? `${ToJSONString<N>}` :
        GetName<N> extends JSONValue ?
            `${ToJSONString<GetName<N>>} ${ToKDLStringChildren<N> extends "" ? "" : `{\n${ToKDLStringChildren<N>}\n}`}` : ToKDLStringChildren<N>;

type ToKDLStringChildrenItems<C extends unknown[]> = {
    [K in keyof C]: ToKDLString<C[K]>
}[keyof C];

export type ToKDLStringChildren<N> =
    GetChildren<{ children: N }> extends [] ? `${ToKDLStringChildren<{ children: N }>}` :
    GetChildren<N> extends never ? "" : `${
    ChildrenArray<N> extends [
            infer Z,
            ...infer T
        ]
        ? `${ToKDLString<Z>}\n${T extends [] ? "" : ToKDLStringChildren<{ children: T }>}`
        : `${ToKDLStringChildrenItems<ChildrenArray<N>>}`
    }`;


export type ToJSXJSONString<N> =
    N extends string ? `{"${N}"}` :
        N extends number | boolean ? `{${N}}` :
            N extends symbol ? `{Symbol(${string})}` : string;

export type ToJSXString<N> =
    N extends JSONValue ? `${ToJSXJSONString<N>}` :
        GetName<N> extends string ?
            `<${GetName<N>} ${ToJSXStringChildren<N> extends "" ? " />" : `>\n${ToJSXStringChildren<N>}\n</${GetName<N>}>`}` : ToJSXStringChildren<N>;

type ToJSXStringChildrenItems<C extends unknown[]> = {
    [K in keyof C]: ToJSXString<C[K]>
}[keyof C];

export type ToJSXStringChildren<N> =
    GetChildren<N> extends never ? "" : `${
    ChildrenArray<N> extends [
            infer Z,
            ...infer T
        ]
        ? `${ToJSXString<Z>}\n${T extends [] ? "" : ToJSXStringChildren<{ children: T }>}`
        : `${ToJSXStringChildrenItems<ChildrenArray<N>>}`
    }`;

