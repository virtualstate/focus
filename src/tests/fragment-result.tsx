import {
    children,
    isFragment,
    isFragmentResult,
    ok,
    h,
    descendantsSettled,
    isDescendantFulfilled, DescendantPromiseFulfilledResult
} from "@virtualstate/focus";

{
    const fragmentResult = {
        [Symbol.for(":jsx/fragment")]: Symbol.for(":jsx/fragment/result"),
        children: [
            <a>{1}{2}</a>,
            <b>{3}{4}</b>,
            <c>{5}{6}</c>
        ]
    }

    ok(isFragment(fragmentResult));
    ok(isFragmentResult(fragmentResult));

    const result = await children(fragmentResult)
        .filter((value): value is number => typeof value === "number");

    console.log({ result });

    ok(result.length === 6);

    const settled = await descendantsSettled(fragmentResult)
        .filter<DescendantPromiseFulfilledResult>(isDescendantFulfilled)
        .map(state => state.value)
        .filter((value): value is number => typeof value === "number")

    console.log({ settled });

    ok(settled.length === 6);


}