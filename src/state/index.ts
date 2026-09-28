import { useEffect, useState, useSyncExternalStore } from "react";
import { demoClock } from "../data/clock.ts";
import { consumeResetFlag, createAppStore } from "./store.ts";
import type { StorageLike } from "./types.ts";

function browserStorage(): StorageLike | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null;
  } catch {
    return null;
  }
}

export const appStore = createAppStore({ storage: browserStorage() });

if (typeof window !== "undefined") {
  const reset = consumeResetFlag(window.location.href);
  if (reset.shouldReset) {
    appStore.reset();
    try {
      Object.keys(sessionStorage)
        .filter((key) => key.startsWith("outpost:screen-visited:"))
        .forEach((key) => sessionStorage.removeItem(key));
    } catch {
      /* In-memory loading still works if browser storage is unavailable. */
    }
    window.history.replaceState(window.history.state, "", reset.href);
  }
}

export function useAppStore() {
  return useSyncExternalStore(
    appStore.subscribe,
    appStore.getState,
    appStore.getState,
  );
}

/** A live demo timestamp; the device calendar never participates. */
export function useDemoClock(intervalMs = 1_000): number {
  const [now, setNow] = useState(demoClock.now);
  useEffect(() => {
    const update = () => setNow(demoClock.now());
    const unsubscribe = demoClock.subscribe(update);
    const timer = window.setInterval(update, intervalMs);
    update();
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [intervalMs]);
  return now;
}

export * from "./types.ts";
export {
  createAppStore,
  createInitialState,
  deserializeState,
  consumeResetFlag,
  savedCount,
  setupCompletedCount,
} from "./store.ts";
