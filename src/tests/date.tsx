import {children, h, name, ok, properties, ProxyContext, proxy} from "@virtualstate/focus";

function Now() {
    const now = new Date();
    return <date initialTime={now.getTime()} {...{ [ProxyContext]: { getters: { instance() { return now } }, proxy } } } />
}

const [now] = await children(<Now />)

ok<Date>(now);

console.log({ now, name: name(now), props: properties(now), time: now.getTime(), isInitial: now.getTime() === properties(now).initialTime });

now.setTime(now.getTime() + 60000);

console.log({ now, name: name(now), props: properties(now), time: now.getTime(), isInitial: now.getTime() === properties(now).initialTime });