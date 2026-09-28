/** The approved 4 PM session is twelve minutes away when a demo opens. */
export const DEMO_START_ISO = "2026-09-25T15:48:00+05:30";
export const DEMO_START_MS = Date.parse(DEMO_START_ISO);
export const DEMO_TIME_ZONE = "Asia/Kolkata";

export interface DemoClock {
  now: () => number;
  reset: () => void;
  subscribe: (listener: () => void) => () => void;
}

/** Injecting a monotonic source lets tests advance time without using the calendar. */
export function createDemoClock(
  monotonicNow: () => number = () => performance.now(),
): DemoClock {
  let openedAt = monotonicNow();
  const listeners = new Set<() => void>();
  return {
    now: () => DEMO_START_MS + Math.max(0, monotonicNow() - openedAt),
    reset() {
      openedAt = monotonicNow();
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export const demoClock = createDemoClock();

/** A minute remains visible until that minute has elapsed. */
export function minutesUntil(startsAt: number, now = demoClock.now()): number {
  return Math.max(0, Math.ceil((startsAt - now) / 60_000));
}

export function formatDemoDate(
  timestamp: number,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: DEMO_TIME_ZONE,
    ...options,
  }).format(timestamp);
}
