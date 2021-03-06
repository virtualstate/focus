export function isIterable<T>(value: unknown): value is Iterable<T> {
  function isIterableInstance(value: unknown): value is Iterable<T> {
    return !!value;
  }
  return !!(
    isIterableInstance(value) && value[Symbol.iterator] instanceof Function
  );
}

export function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  function isAsyncIterableInstance(value: unknown): value is AsyncIterable<T> {
    return !!value;
  }
  return !!(
    isAsyncIterableInstance(value) &&
    value[Symbol.asyncIterator] instanceof Function
  );
}

export function isArray<T>(value: unknown): value is T[];
export function isArray(value: unknown): value is unknown[];
export function isArray(value: unknown): boolean {
  return Array.isArray(value);
}
