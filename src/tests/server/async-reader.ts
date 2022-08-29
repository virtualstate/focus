export function reader(response: Response) {
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