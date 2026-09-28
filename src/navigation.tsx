import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
export type Tab = "home" | "sessions" | "saved" | "profile";
type Entry = {
  path: string;
  key: string;
  tab: Tab;
  trail: Entry[];
  restore?: boolean;
  flow?: { origin: Entry; index: number };
};
type Nav = {
  tab: Tab;
  go: (path: string, options?: { replace?: boolean }) => void;
  back: () => void;
  exitFlow: () => void;
  completeFlow: (path: string) => void;
  switchTab: (tab: Tab) => void;
  startSearch: (path: string) => void;
  screenKey: string;
  scrollFor: () => number;
};
const Context = createContext<Nav | null>(null);
const positions = new Map<string, number>();
let sequence = 0;
const nextKey = () =>
  globalThis.crypto?.randomUUID?.() ||
  `screen-${++sequence}-${performance.now()}`;
const infer = (path: string): Tab =>
  path.startsWith("/sessions")
    ? "sessions"
    : path.startsWith("/saved")
      ? "saved"
      : path.startsWith("/profile")
        ? "profile"
        : "home";
function announce(direction: string) {
  window.dispatchEvent(
    new CustomEvent("outpost:navigate", { detail: direction }),
  );
}
// Register before HashRouter creates its history listener. A route-dependent React
// effect can otherwise be cleaned up by Router's synchronous POP render before
// the browser invokes it, losing the outgoing tab and its scroll position.
let beforeRouterPop: (() => void) | undefined;
const dispatchNativePop = () => beforeRouterPop?.();
window.addEventListener("popstate", dispatchNativePop, true);
if (import.meta.hot)
  import.meta.hot.dispose(() =>
    window.removeEventListener("popstate", dispatchNativePop, true),
  );

export function NavigationProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const action = useNavigationType();
  const path = location.pathname + location.search;
  const stored = location.state as Entry | null;
  const untracked = useRef<{ signature: string; entry: Entry } | null>(null);
  const signature = location.key + "|" + path;
  if (untracked.current?.signature !== signature)
    untracked.current = {
      signature,
      entry: { path, key: nextKey(), tab: infer(path), trail: [] },
    };
  const known = stored?.path === path;
  const current: Entry = known ? stored : untracked.current.entry;
  const latest = useRef(current);
  latest.current = current;
  const tabs = useRef<Partial<Record<Tab, Entry>>>({});
  const pendingFlow = useRef<{ origin: Entry; outcome?: string } | null>(null);
  const oldIndex = useRef(window.history.state?.idx || 0);
  const capture = useCallback(() => {
    positions.set(latest.current.key, window.scrollY);
    if (latest.current.path === `/${latest.current.tab}`)
      tabs.current[latest.current.tab] = latest.current;
  }, []);
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    if (current.path === `/${current.tab}`) tabs.current[current.tab] = current;
    const y =
      (known && action === "POP") || current.restore
        ? positions.get(current.key) || 0
        : 0;
    if (!known)
      window.history.replaceState(
        { ...window.history.state, usr: current },
        "",
        window.location.href,
      );
    window.scrollTo({ top: y, left: 0, behavior: "instant" });
    oldIndex.current = window.history.state?.idx || 0;
  }, [location.key, path]);
  const go = useCallback(
    (nextPath: string, options?: { replace?: boolean }) => {
      capture();
      announce("forward");
      const entry = latest.current;
      const isAuth = ["/splash", "/sign-in", "/verify"].includes(entry.path);
      navigate(nextPath, {
        replace: options?.replace,
        state: {
          path: nextPath,
          key: nextKey(),
          tab: nextPath === "/home" && isAuth ? "home" : entry.tab,
          trail:
            nextPath === "/home" && isAuth
              ? []
              : options?.replace
                ? entry.trail
                : [...entry.trail, { ...entry, restore: false }],
          flow: /^\/mentors\/[^/]+\/(book|review)$/.test(nextPath)
            ? entry.flow || {
                origin: { ...entry, restore: true },
                index: window.history.state?.idx || 0,
              }
            : undefined,
          restore: false,
        },
      });
    },
    [capture, navigate],
  );
  const switchTab = useCallback(
    (next: Tab) => {
      capture();
      announce("tab");
      const target = tabs.current[next] || {
        path: `/${next}`,
        tab: next,
        key: nextKey(),
        trail: [],
      };
      navigate(target.path, {
        replace: true,
        state: { ...target, trail: [], flow: undefined, restore: true },
      });
    },
    [capture, navigate],
  );
  const finishFlow = useCallback(
    (outcome?: string) => {
      const from = latest.current;
      const fallback = from.path.replace(/\/(book|review)$/, "");
      const origin = from.flow?.origin || {
        path: fallback,
        tab: from.tab,
        key: nextKey(),
        trail: [],
      };
      const steps =
        (window.history.state?.idx || 0) -
        (from.flow?.index ?? (window.history.state?.idx || 0));
      capture();
      if (from.flow && steps > 0) {
        pendingFlow.current = { origin, outcome };
        navigate(-steps);
      } else {
        navigate(outcome || origin.path, {
          replace: true,
          state: outcome
            ? {
                path: outcome,
                tab: origin.tab,
                key: nextKey(),
                trail: [...origin.trail, origin],
              }
            : { ...origin, restore: true },
        });
      }
    },
    [capture, navigate],
  );
  const back = useCallback(() => {
    if (latest.current.trail.length && (window.history.state?.idx || 0) > 0) {
      navigate(-1);
      return;
    }
    const previous = latest.current.trail.at(-1);
    capture();
    announce("back");
    if (previous)
      navigate(previous.path, {
        replace: true,
        state: { ...previous, restore: true },
      });
    else if (latest.current.path !== `/${latest.current.tab}`)
      navigate(`/${latest.current.tab}`, { replace: true });
  }, [capture, navigate]);
  useLayoutEffect(() => {
    const onPop = () => {
      // Capture the outgoing tab before HashRouter handles the native event.
      capture();
      const from = latest.current;
      const transaction = pendingFlow.current;
      if (transaction) {
        pendingFlow.current = null;
        announce(transaction.outcome ? "forward" : "back");
        queueMicrotask(() => {
          const origin = transaction.origin;
          if (transaction.outcome)
            navigate(transaction.outcome, {
              state: {
                path: transaction.outcome,
                tab: origin.tab,
                key: nextKey(),
                trail: [...origin.trail, origin],
              },
            });
          else
            navigate(origin.path, {
              replace: true,
              state: { ...origin, restore: true },
            });
        });
        return;
      }
      const index = window.history.state?.idx;
      const backward = typeof index === "number" && index < oldIndex.current;
      const incoming = window.history.state?.usr as Entry | undefined;
      const expected = from.trail.at(-1);
      // An edited/pasted hash URL is a fresh destination, not a tab-stack traversal.
      if (!incoming || incoming.path !== window.location.hash.slice(1)) return;
      announce(backward ? "back" : "forward");
      let target: Entry | undefined;
      if (backward && expected && incoming.key !== expected.key)
        target = expected;
      else if (backward && !expected && from.path === `/${from.tab}`)
        target = from;
      else if (
        !backward &&
        incoming.tab !== from.tab &&
        from.path === `/${from.tab}`
      )
        target = from;
      if (target) {
        const restore = target;
        // Router also receives this POP. Correct its result after all native-event
        // listeners have run, otherwise its pending update can overwrite the repair.
        queueMicrotask(() =>
          navigate(restore.path, {
            replace: true,
            state: { ...restore, restore: true },
          }),
        );
      }
    };
    beforeRouterPop = onPop;
    return () => {
      if (beforeRouterPop === onPop) beforeRouterPop = undefined;
    };
  }, [capture, navigate]);
  const startSearch = useCallback(
    (path: string) => {
      // iOS permits keyboard activation only while processing the original tap.
      document
        .querySelector<HTMLInputElement>("#keyboard-bridge")
        ?.focus({ preventScroll: true });
      go(path);
    },
    [go],
  );
  return (
    <Context.Provider
      value={{
        tab: current.tab,
        go,
        back,
        exitFlow: () => finishFlow(),
        completeFlow: (path: string) => finishFlow(path),
        switchTab,
        startSearch,
        screenKey: current.key,
        scrollFor: () => positions.get(current.key) || 0,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAppNavigation() {
  const nav = useContext(Context);
  if (!nav) throw new Error("Missing navigation provider");
  return nav;
}
