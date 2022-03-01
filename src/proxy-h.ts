import { GettersRecord, proxy, ProxyNode, UnknownJSXNode } from "./access";

import { createFragment as createFragmentFn, h as f } from "./static-h";
import * as ChildrenAccessors from "./children";

export const getters = {
  ...ChildrenAccessors,
} as const;

export function h<Get extends GettersRecord = typeof getters>(
  source: unknown,
  options: Record<string, unknown>,
  ...children: unknown[]
): ProxyNode<Get>;
export function h(
  source: unknown,
  options: Record<string, unknown>,
  ...children: unknown[]
): ProxyNode<GettersRecord> {
  const context = { getters, proxy } as const;
  return proxy(f(source, options, ...children), context.getters, context);
}

export function createFragment(
  options: Record<string, unknown>,
  ...children: unknown[]
) {
  return h(Symbol.for(":kdl/fragment"), options, ...children);
}
