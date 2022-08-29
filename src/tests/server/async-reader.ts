export function reader(response: Response) {
    if (!response.body) {
        return {
            async *[Symbol.asyncIterator]() {
                yield response.text();
            }
        }
    }
    const stream = response.body.pipeThrough(new TextDecoderStream());
    const reader = stream.getReader();
    return {
        [Symbol.asyncIterator]() {
            return {
                next() {
                    return reader.read();
                }
            }
        }
    }
}