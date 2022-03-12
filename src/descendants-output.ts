// TODO I haven't been able to get this to work yet

// import { ChildrenArray } from "./children-output";
// import {Join} from "./join.types";
//
//
// // type FlattenArray0<A extends unknown[]> =
// //     A extends [never] ? [] :
// //         A extends [...infer Z, [...infer K]] ? K extends [never] ? [...Z] : [...Z, ...K] :
// //             A extends [[...infer K], ...infer Z] ? K extends [never] ? [...Z] : [...K, ...Z] :
// //                 A extends [...infer Z, [...infer K], ...infer Y] ? K extends [never] ? [...Z, ...Y] : [...Z, ...K, ...Y] : A
// //
// type Head<A extends unknown[]> = (...args: A) => unknown extends (head: infer Head, ...args: unknown[]) => unknown ? Head : never;
// type Tail<A extends unknown[]> = (...args: A) => unknown extends (head: unknown, ...tail: infer Tail) => unknown ? Tail : never;
// //
// // type RemoveFromHead<Head> = Head
// // type FlattenArray<A extends unknown[]> = [...(Head<A> extends unknown[] ? Head<A> : [Head<A>]), ...FlattenArray<Tail<A>>]
//
// // type FlattenArray<A extends unknown[]> =
// //     A extends [never] ? [] :
// //         A extends [...infer Z, [...infer K]] ? K extends [never] ? [...Z] : [...Z, ...FlattenArray0<K>] :
// //             A extends [[...infer K], ...infer Z] ? K extends [never] ? [...Z] : [...FlattenArray0<K>, ...Z] :
// //                 A extends [...infer Z, [...infer K], ...infer Y] ? K extends [never] ? [...Z, ...Y] : [...Z, ...FlattenArray0<K>, ...Y] : A
//
// //
// // export type DescendantsChildrenArray<N, C extends ChildrenArray<N> = ChildrenArray<N>> = {
// //     [K in keyof C]: K extends number ? DescendantsArray<C[K]> : C[K]
// // } & { length: C["length"] };
//
//
//
// type NextDepth = {
//     0: never;
//     1: 0;
//     2: 1;
//     3: 2;
//     4: 3;
//     5: 4;
//     6: 5;
// };
//
// type KnownDepth = keyof NextDepth;
// type StartDepth = 6;
//
// type FlattenArray<A extends readonly unknown[], D extends KnownDepth = StartDepth> =
//     A extends [] ? [] :
//         ((...args: A) => 1 ) extends ((head: infer Head, ...args: infer Tail) => 1) ? [...(Head extends (readonly unknown[] | unknown[]) ? (Head extends never[] ? [] : Head) : [Head]), ...(Tail extends [] ? [] : (NextDepth[D] extends never ? Tail : FlattenArray<Tail, NextDepth[D]>))] : [];
//
// // const zz = [1, [2, 3], [4, 5]] as const;
//
// // let tail: Tail<typeof zz> = [[2, 3], [4, 5]] as const;
// //  ^?
//
// // let flag: Readonly<FlattenArray<typeof zz>> = [1, 2, 3, 4, 5] as const;
// //  ^?
//
//
// export type DescendantsOfChildren<N, C extends ChildrenArray<N> = ChildrenArray<N>> = C extends ([] | never | [never]) ? [] : (
//     {
//         [K in keyof C]: K extends (number | `${number}`) ? C[K] extends never ? [] : [C[K], ...DescendantsOfChildren<C[K]>] : never
//     } & { length: C["length"] }
// );
//
//
// export type DescendantsArray<N, C extends ChildrenArray<N> = ChildrenArray<N>> = [N, ...FlattenArray<{
//     [K in keyof C]: K extends (number | `${number}`) ? DescendantsArray<C[K]> : never
// } & { length: C["length"] }>];
//
//
// let z = {
//     name: "1",
//     children: [
//         {
//             name: "2",
//             children: [
//                 {
//                     name: "3",
//                     children: [
//                         1
//                     ]
//                 },
//                 {
//                     name: "4",
//                     children: [
//                         2
//                     ]
//                 }
//             ]
//         }
//     ]
// } as const;
// type S = DescendantsArray<typeof z>;
// type C = DescendantsOfChildren<typeof z>;
//
//
//
// //
// // let s0: S[0] = z;
// // let s1: S[1] = z.children[0];
// // let s2: S[2] = z.children[0].children[0];
// // let s3: S[3] = s2.children[0];
// // let s4: S[4] = s1.children[1];
// // let s5: S[5] = s4.children[0];
// //
// // let s: C = [
// //     z.children[0],
// //     z.children[0].children[0],
// //     z.children[0].children[0].children[0],
// //     z.children[0].children[1],
// //     z.children[0].children[1].children[0],
// // ];
