import {
  GettersRecord,
  proxy,
  ProxyContextOptions,
  ProxyNode,
  UnknownJSXNode,
} from "./access";

import { createFragment as createFragmentFn, h as f } from "./static-h";
import * as ChildrenAccessors from "./children";
import * as ComponentAccessors from "./component";
import { isLike } from "./like";

export const getters = {
  ...ChildrenAccessors,
  ...ComponentAccessors,
} as const;

export const ProxyContext = Symbol.for(
  "@virtualstate/fringe/tools/proxyContext"
);

export interface ProxyHOptions<Get extends GettersRecord>
  extends Record<string | symbol, unknown> {
  [ProxyContext]: Get;
}

export function h<Get extends GettersRecord>(
  source: unknown,
  options: ProxyHOptions<Get>,
  ...children: unknown[]
): ProxyNode<Get>;
export function h<Get extends GettersRecord = typeof getters>(
  source: unknown,
  options?: Record<string | symbol, unknown>,
  ...children: unknown[]
): ProxyNode<Get>;
export function h(
  source: unknown,
  options?: Record<string | symbol, unknown>,
  ...children: unknown[]
): ProxyNode<GettersRecord> {
  const passedContext = options?.[ProxyContext];
  const context = isLike<ProxyContextOptions>(passedContext)
    ? passedContext
    : ({ getters, proxy } as const);
  return proxy(f(source, options, ...children), context.getters, context);
}

export function createFragment(
  options?: Record<string | symbol, unknown>,
  ...children: unknown[]
) {
  return h(Symbol.for(":kdl/fragment"), options, ...children);
}
