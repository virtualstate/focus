import { UnknownJSXNode } from "./index";

export function h(
  source: unknown,
  options?: Record<string, unknown>,
  ...children: unknown[]
): UnknownJSXNode {
  return {
    source,
    options,
    children,
  };
}

export function fragment(
  options?: Record<string, unknown>,
  ...children: unknown[]
) {
  return h(Symbol.for(":jsx/fragment"), options, ...children);
}
export const createFragment = fragment;

export function named(name: string, defaultOptions?: Record<string, unknown>) {
  return (options?: Record<string, unknown>, ...children: unknown[]) => {
    return h(
      name,
      defaultOptions
        ? options
          ? { ...defaultOptions, ...options }
          : defaultOptions
        : options,
      ...children
    );
  };
}
