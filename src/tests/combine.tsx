import { h, createFragment } from "@virtualstate/focus";
import {toKDLString} from "@virtualstate/kdl";

const A = <initial a={1} />;
const B = <A b={2} />;
const C = <B c={3}><A /><B /></B>;
const D = <C d={4} a={2} />;
const E = <D e={5} />;
const F = <E f={6} e={6}><C/></E>;
const G = <F g={1}>{undefined}</F>;

console.log({
    A,
    B,
    C,
    D,
    E,
    F,
    G
});

console.log(await toKDLString(
    <>
        <A />
        <B />
        <C />
        <D />
        <E />
        <F />
        <G />
    </>
))
