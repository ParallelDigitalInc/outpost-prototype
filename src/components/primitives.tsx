import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type ImgHTMLAttributes,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./primitives.css";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

const focusableSelector =
  'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function BottomSheet({
  open,
  onClose,
  title,
  description,
  children,
}: BottomSheetProps) {
  const [present, setPresent] = useState(open);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drag = useRef<{
    y: number;
    startedAt: number;
    pointerId: number;
  } | null>(null);
  const backdropPressed = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (open) {
      setPresent(true);
      setDragY(0);
      setDragging(false);
      drag.current = null;
      return;
    }
    const timer = window.setTimeout(() => setPresent(false), 260);
    return () => window.clearTimeout(timer);
  }, [open]);

  useLayoutEffect(() => {
    if (!present) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const savedY = window.scrollY;
    const previousBody = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    let secondFrame = 0;
    const frame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setEntered(true));
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(secondFrame);
      setEntered(false);
      dialog.close();
      Object.assign(document.body.style, previousBody);
      window.scrollTo({ top: savedY, behavior: "instant" });
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, [present]);

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const controls = Array.from(
      dialog.querySelectorAll<HTMLElement>(focusableSelector),
    ).filter(
      (element) =>
        element.getClientRects().length > 0 && !element.closest("[inert]"),
    );
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) {
      event.preventDefault();
      dialog.focus();
    } else if (
      event.shiftKey &&
      (document.activeElement === first || document.activeElement === dialog)
    ) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    drag.current = {
      y: event.clientY,
      startedAt: performance.now(),
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setDragY(Math.max(0, event.clientY - drag.current.y));
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const currentDrag = drag.current;
    if (!currentDrag || currentDrag.pointerId !== event.pointerId) return;
    const distance = Math.max(0, event.clientY - currentDrag.y);
    const velocity =
      distance / Math.max(1, performance.now() - currentDrag.startedAt);
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!cancelled && (distance > 88 || (distance > 30 && velocity > 0.65)))
      onClose();
    else setDragY(0);
  }

  if (!present) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="bottom-sheet"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      data-visible={open && entered}
      data-dragging={dragging}
      style={{ "--sheet-drag": `${dragY}px` } as CSSProperties}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={trapFocus}
      onPointerDown={(event) => {
        backdropPressed.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (backdropPressed.current && event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom ||
            event.clientX < bounds.left ||
            event.clientX > bounds.right
          )
            onClose();
        }
        backdropPressed.current = false;
      }}
    >
      <div
        className="bottom-sheet__grab-area"
        aria-hidden="true"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={(event) => finishDrag(event)}
        onPointerCancel={(event) => finishDrag(event, true)}
      >
        <span className="bottom-sheet__grab" />
      </div>
      <div className="bottom-sheet__header">
        <div className="bottom-sheet__heading">
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <button
          className="bottom-sheet__close"
          type="button"
          aria-label="Close sheet"
          onClick={onClose}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="m6 6 12 12M18 6 6 18"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
      <div className="bottom-sheet__body">{children}</div>
    </dialog>,
    document.body,
  );
}

export interface ToastOptions {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastItem extends ToastOptions {
  id: number;
}
interface ToastContextValue {
  show: (options: ToastOptions) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const nextId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const dismiss = useCallback(() => {
    clearTimer();
    setToast(null);
  }, [clearTimer]);
  const resumeTimer = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(() => setToast(null), 5000);
  }, [clearTimer]);

  const show = useCallback(
    (options: ToastOptions) => {
      setToast({ ...options, id: ++nextId.current });
      resumeTimer();
    },
    [resumeTimer],
  );

  useEffect(() => clearTimer, [clearTimer]);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="toast-region" aria-live="polite" aria-atomic="true">
          {toast && (
            <div
              className="toast"
              key={toast.id}
              onPointerEnter={clearTimer}
              onPointerLeave={resumeTimer}
              onFocus={clearTimer}
              onBlur={resumeTimer}
            >
              <span className="toast__message">{toast.message}</span>
              {toast.actionLabel && (
                <button
                  className="toast__action"
                  type="button"
                  onClick={() => {
                    dismiss();
                    toast.onAction?.();
                  }}
                >
                  {toast.actionLabel}
                </button>
              )}
            </div>
          )}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error("useToast must be used within ToastProvider");
  return value;
}

export function Skeleton({
  className = "",
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div aria-hidden="true" className={`skeleton ${className}`} style={style} />
  );
}

interface LoadingVisit {
  loading: boolean;
  timer: number | null;
}
const loadingVisits = new Map<string, LoadingVisit>();
// Subscriptions outlive cached visits so a reset also refreshes an already mounted route.
const loadingSubscribers = new Map<string, Set<() => void>>();
const loadingSessionPrefix = "outpost:screen-visited:";
const sessionKey = (key: string) => `${loadingSessionPrefix}${key}`;

function getLoadingVisit(key: string) {
  const existing = loadingVisits.get(key);
  if (existing) return existing;
  let visited = false;
  try {
    visited = sessionStorage.getItem(sessionKey(key)) === "1";
  } catch {
    /* In-memory caching still works when storage is unavailable. */
  }
  const visit: LoadingVisit = { loading: !visited, timer: null };
  loadingVisits.set(key, visit);
  if (!visited) {
    visit.timer = window.setTimeout(
      () => {
        // A reset can replace this visit before an already queued callback runs.
        if (loadingVisits.get(key) !== visit) return;
        visit.loading = false;
        visit.timer = null;
        try {
          sessionStorage.setItem(sessionKey(key), "1");
        } catch {
          /* Keep the in-memory cache. */
        }
        loadingSubscribers.get(key)?.forEach((notify) => notify());
      },
      250 + Math.random() * 200,
    );
  }
  return visit;
}

/** A route's first visit loads once per browser session, including under React StrictMode. */
export function useFirstVisitLoading(key: string) {
  const subscribe = useCallback(
    (notify: () => void) => {
      let subscribers = loadingSubscribers.get(key);
      if (!subscribers) {
        subscribers = new Set();
        loadingSubscribers.set(key, subscribers);
      }
      subscribers.add(notify);
      return () => {
        subscribers.delete(notify);
        if (subscribers.size === 0) loadingSubscribers.delete(key);
      };
    },
    [key],
  );
  const getSnapshot = useCallback(() => getLoadingVisit(key).loading, [key]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Clear only Outpost's screen cache and restart loading on any mounted routes. */
export function resetLoadingVisits() {
  loadingVisits.forEach(({ timer }) => {
    if (timer !== null) window.clearTimeout(timer);
  });
  loadingVisits.clear();
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(loadingSessionPrefix)) sessionStorage.removeItem(key);
    }
  } catch {
    /* The in-memory cache has still been reset. */
  }
  loadingSubscribers.forEach((subscribers, key) => {
    getLoadingVisit(key);
    subscribers.forEach((notify) => notify());
  });
}

/** className and style size the placeholder frame; all other props belong to the image. */
export function FadeImage({
  className = "",
  style,
  src,
  srcSet,
  alt = "",
  onLoad,
  width,
  height,
  loading = "lazy",
  decoding = "async",
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const identity = `${src ?? ""}|${srcSet ?? ""}`;
  const [loadedIdentity, setLoadedIdentity] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const animationFrames = useRef<number[]>([]);
  const reveal = useCallback(() => {
    animationFrames.current.forEach((frame) => cancelAnimationFrame(frame));
    animationFrames.current = [
      requestAnimationFrame(() => {
        animationFrames.current.push(
          requestAnimationFrame(() => setLoadedIdentity(identity)),
        );
      }),
    ];
  }, [identity]);

  useEffect(() => {
    if (imageRef.current?.complete && imageRef.current.naturalWidth > 0)
      reveal();
    return () =>
      animationFrames.current.forEach((frame) => cancelAnimationFrame(frame));
  }, [reveal]);

  return (
    <span
      className={`fade-image ${className}`}
      style={
        {
          "--image-width": typeof width === "number" ? `${width}px` : width,
          "--image-height": typeof height === "number" ? `${height}px` : height,
          ...style,
        } as CSSProperties
      }
    >
      <img
        {...props}
        ref={imageRef}
        src={src}
        srcSet={srcSet}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding={decoding}
        className="fade-image__image"
        data-loaded={loadedIdentity === identity}
        onLoad={(event) => {
          reveal();
          onLoad?.(event);
        }}
      />
    </span>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  busy?: boolean;
}

export function Button({
  variant = "primary",
  busy = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`button button--${variant} ${className}`}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
    >
      <span className="button__label" data-busy={busy}>
        {children}
      </span>
      {busy && <span className="button__spinner" aria-hidden="true" />}
    </button>
  );
}
