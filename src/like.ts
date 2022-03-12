export function isLike<T>(value: unknown, ...and: unknown[]): value is T {
  if (!and.length) return !!value;
  return !!value && and.every((value) => !!value);
}

export function ok(value: unknown, message?: string): asserts value;
export function ok<T>(value: unknown, message?: string): asserts value is T;
export function ok(value: unknown, message?: string): asserts value {
  if (!value) {
    throw new Error(message ?? "Expected value");
  }
}
