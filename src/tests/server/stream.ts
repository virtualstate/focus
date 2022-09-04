
function toPullUnderlyingSource(iterable: AsyncIterable<unknown>): UnderlyingSource {
    const encoder = new TextEncoder();
    let iterator: AsyncIterator<unknown>;
    return {
        start() {
            iterator = iterable[Symbol.asyncIterator]();
        },
        async pull(controller) {
            const { value, done } = await iterator.next();
            if (done) {
                controller.close();
            } else {
                let enqueue = value;
                if (typeof enqueue === "string") {
                    enqueue = encoder.encode(enqueue);
                }
                controller.enqueue(enqueue);
            }
        },
        async cancel() {
            await iterator.return();
        }
    }
}

export function toStream(iterable: AsyncIterable<unknown>) {
    const source = toPullUnderlyingSource(iterable);
    return new ReadableStream(source);
}