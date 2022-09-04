import {defer} from "@virtualstate/promise";
import {isPromise, ok} from "@virtualstate/focus";

export interface FetchEvent {
    request: Request;
    respondWith(response: Promise<Response> | Response): void
    waitUntil?(promise: Promise<unknown>): void;
}

export interface FetchListenerFn {
    (event: FetchEvent): void;
}

export function dispatchEvent(request: Request, fn: FetchListenerFn): {
    response: Promise<Response>,
    settle: Promise<unknown>
} {
    const promises = new Set();
    const deferredResponse = defer<Response>();
    const event: FetchEvent = {
        request,
        respondWith,
        waitUntil
    };

    const maybePromise = fn(event);

    if (isPromise(maybePromise)) {
        waitUntil(maybePromise);
    }

    return {
        response: deferredResponse.promise,
        settle: settleUntil()
    }

    function respondWith(response: Promise<Response> | Response): void {
        if (isPromise(response)) {
            return void response.then(respondWith);
        }
        deferredResponse.resolve(response)
    }

    async function settleUntil() {
        while (promises.size) {
            const current = [...promises];
            ok(current.length)
            await Promise.all(current);
            for (const promise of current) {
                promises.delete(promise);
            }
        }
    }

    function waitUntil(promise: Promise<unknown>) {
        promises.add(promise);
    }
}