import { Push } from "@virtualstate/promise";
import {children, h, ok, isNumber} from "@virtualstate/focus";

{
    const target = new Push();
    target.push(1);
    target.push(2);
    target.close();

    const [result] = await children(target);
    console.log({ result });
    ok(result === 2);
}

{
    const target = new Push();
    target.push(1);
    target.push(2);
    target.close();

    const seen: number[] = [];
    for await (const [result] of children(target).filter<number>(isNumber)) {
        seen.push(result);
    }
    console.log({ seen });
    ok(seen.length === 2);
    ok(seen[0] === 1);
    ok(seen[1] === 2);
}

{

    async function *Component(options: unknown, input: unknown) {
        for await (const [result] of children(input).filter<number>(isNumber)) {
            yield result * 3;
        }
    }

    const target = new Push({ keep: true });
    target.push(1);
    target.push(2);
    target.close();

    const node = <Component>{target}</Component>

    const [result] = await children(node);
    console.log({ result });
    ok(result === 6); // 2 * 3

    const next = <Component>{node}</Component>

    const [nextResult] = await children(next);
    console.log({ nextResult });
    ok(nextResult === 18); // 6 * 3


}