import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False while rendering on the server, true in the browser. Keeps dates from mismatching. */
export function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
