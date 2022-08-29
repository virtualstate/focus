export function reader(response: Response) {
    // console.log("reader", response.body);
    const stream = response.body.pipeThrough(new TextDecoderStream());
    const reader = stream.getReader();
    // console.log({ reader, stream });
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