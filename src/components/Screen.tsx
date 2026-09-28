import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { useAppNavigation, type Tab } from "../navigation";
import { useAppStore } from "../state";
import { Icon } from "./Icon";
export interface ScreenProps {
  variant?: "home" | "inner" | "detail" | "auth";
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  center?: ReactNode;
  compactHeader?: boolean;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  hideTabs?: boolean;
}
const tabs: Tab[] = ["home", "sessions", "saved", "profile"];
const name = (s: string) => s[0].toUpperCase() + s.slice(1);
export function Screen({
  variant = "inner",
  title = "",
  subtitle,
  right,
  center,
  compactHeader = false,
  action,
  children,
  className = "",
  hideTabs = false,
}: ScreenProps) {
  const nav = useAppNavigation();
  const state = useAppStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(window.scrollY > 12);
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const screen = useRef<HTMLDivElement>(null);
  const landmark = useRef<HTMLDivElement>(null);
  const detailTitle = useRef<HTMLElement | null>(null);
  const last = useRef({ y: window.scrollY, anchor: window.scrollY, dir: 0 });
  const count = Object.values(state.saved).reduce(
    (n, ids) => n + ids.length,
    0,
  );
  useLayoutEffect(() => {
    document.title = (title || "Outpost") + (title ? " · Outpost" : "");
    setHidden(false);
    last.current = { y: window.scrollY, anchor: window.scrollY, dir: 0 };
  }, [location.key, title]);
  useEffect(() => {
    detailTitle.current = document.querySelector("[data-detail-title]");
    const update = () => {
      const y = window.scrollY;
      const delta = y - last.current.y;
      const dir = Math.sign(delta);
      const titleNode =
        variant === "detail"
          ? document.querySelector<HTMLElement>("[data-detail-title]") ||
            detailTitle.current
          : landmark.current;
      const collapsed = titleNode
        ? titleNode.getBoundingClientRect().bottom < 64
        : y > 54;
      setScrolled(variant === "detail" ? collapsed : y > 12);
      setCollapsed(collapsed);
      const atBottom =
        y + window.innerHeight >= document.documentElement.scrollHeight - 18;
      if (y < 48 || atBottom) {
        setHidden(false);
        last.current.anchor = y;
      } else if (Math.abs(delta) > 1) {
        if (dir !== last.current.dir) last.current.anchor = last.current.y;
        if (dir > 0 && y - last.current.anchor >= 48) setHidden(true);
        if (dir < 0 && last.current.anchor - y >= 5) setHidden(false);
        last.current.dir = dir;
      }
      last.current.y = y;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [variant, location.key]);
  useEffect(() => {
    const theme = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (theme)
      theme.content =
        variant === "auth" ? "#FAFAFA" : scrolled ? "#FFFFFF" : "#FAFAFA";
  }, [scrolled, variant]);
  const showTabs = variant !== "auth" && !hideTabs;
  useLayoutEffect(() => {
    const element = screen.current;
    if (!element) return;
    const measure = () => {
      const dock = element.querySelector<HTMLElement>(".sticky-action");
      element.style.setProperty(
        "--dock-height",
        `${dock?.getBoundingClientRect().height || 0}px`,
      );
      const tabs = element.querySelector<HTMLElement>(
        ".tabbar:not(.is-hidden)",
      );
      const edge = Math.min(
        dock?.getBoundingClientRect().top ?? window.innerHeight,
        tabs?.getBoundingClientRect().top ?? window.innerHeight,
      );
      document.documentElement.style.setProperty(
        "--toast-bottom",
        `${Math.max(12, window.innerHeight - edge + 12)}px`,
      );
    };
    const observer = new ResizeObserver(measure);
    element
      .querySelectorAll(".sticky-action, .tabbar")
      .forEach((node) => observer.observe(node));
    measure();
    const timer = window.setTimeout(measure, 280);
    element.addEventListener("transitionend", measure);
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
      element.removeEventListener("transitionend", measure);
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [hidden, location.key, action, showTabs]);
  const root = location.pathname === `/${nav.tab}`;
  return (
    <div
      ref={screen}
      className={`screen screen-${variant} ${action ? "has-action" : ""} ${showTabs ? "has-tabs" : ""} ${hidden ? "tabs-hidden" : ""} ${className}`}
    >
      {variant !== "auth" && (
        <header
          className={`topbar ${variant}-topbar ${center ? "has-header-center" : ""} ${scrolled ? "is-scrolled" : ""}`}
        >
          {variant === "home" ? (
            <>
              <span className="wordmark">outpost</span>
              <button
                className="avatar-button"
                aria-label="Open profile"
                onClick={() => nav.switchTab("profile")}
              >
                <span>{state.profile.initials}</span>
              </button>
            </>
          ) : (
            <>
              {root ? (
                <span className="header-slot" />
              ) : (
                <button
                  className="icon-button outlined"
                  aria-label="Go back"
                  onClick={nav.back}
                >
                  <Icon name="back" size={20} />
                </button>
              )}
              <span
                className={`compact-title ${collapsed || center || compactHeader ? "visible" : ""}`}
              >
                {center || title}
              </span>
              <div className="header-actions">
                {right || <span className="header-slot" />}
              </div>
            </>
          )}
        </header>
      )}
      <main className="screen-main">
        {variant === "inner" && !compactHeader && (
          <div className="page-intro" ref={landmark}>
            <h1>{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
      {action && <div className="sticky-action">{action}</div>}
      {showTabs && (
        <nav
          className={`tabbar ${hidden ? "is-hidden" : ""}`}
          aria-label="Main navigation"
        >
          {tabs.map((tab) => (
            <button
              key={tab}
              aria-current={nav.tab === tab ? "page" : undefined}
              aria-label={
                tab === "saved" && count
                  ? `Saved, ${count} ${count === 1 ? "item" : "items"}`
                  : name(tab)
              }
              onClick={() => nav.switchTab(tab)}
            >
              <span className="tab-icon">
                <Icon
                  name={tab}
                  filled={
                    nav.tab === tab && (tab === "home" || tab === "saved")
                  }
                />
                {tab === "saved" && count > 0 && (
                  <span key={count} className="tab-badge" aria-hidden="true">
                    {count}
                  </span>
                )}
              </span>
              <span>{name(tab)}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
