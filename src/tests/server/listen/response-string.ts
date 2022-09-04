export function toAsyncString(response: Response): AsyncIterable<string> {
    if (!response.body?.pipeThrough) {
        return {
            async *[Symbol.asyncIterator]() {
                yield response.text();
            }
        }
    }
    return {
        async *[Symbol.asyncIterator]() {
            const stream = response.body.pipeThrough(new TextDecoderStream());
            const reader = stream.getReader();
            let result;
            try {
                do {
                    result = await reader.read();
                    if (result.value) {
                        yield result.value
                    }
                } while (!result.done);
            } finally {
                reader.releaseLock()
            }
        }
    }
}