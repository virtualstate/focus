import {JoinTupleString} from "./join.types";

export type Trim<Input extends string, TrimBy extends string> = Input extends `${infer I}${TrimBy}` ? I : Input;

export type SplitToTuple<Input extends string, SplitBy extends string> = Input extends `${infer Left}${SplitBy}${infer Right}` ? [Left, ...SplitToTuple<Right, SplitBy>] : (
    Input extends { length: 0 } ? [] : [Input]
);

export type SplitAddJoin<Input extends string, SplitBy extends string, Prefix extends string, Suffix extends string = ""> =
    Trim<JoinTupleString<SplitToTuple<Input, SplitBy>, Prefix, `${Suffix}${SplitBy}`>, SplitBy>

