import { useEffect } from "react";

/** Document scrolling stays available while mobile keyboards resize the visual viewport. */
export function KeyboardViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const html = document.documentElement;
    let timer = 0;
    let followup = 0;
    const editable = () => {
      const el = document.activeElement;
      return el instanceof HTMLElement &&
        el.id !== "keyboard-bridge" &&
        el.matches(
          "input:not([type=radio]):not([type=checkbox]), textarea, [contenteditable=true]",
        )
        ? el
        : null;
    };
    const update = () => {
      const field = editable();
      const overlap =
        field && viewport
          ? Math.max(
              0,
              window.innerHeight - viewport.height - viewport.offsetTop,
            )
          : 0;
      html.style.setProperty(
        "--visible-viewport-height",
        `${viewport?.height || window.innerHeight}px`,
      );
      html.style.setProperty("--keyboard-overlap", `${overlap}px`);
      html.classList.toggle("keyboard-open", overlap > 80);
      if (!field || !viewport || overlap < 80) return;
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        const rect = field.getBoundingClientRect();
        const center = viewport.offsetTop + viewport.height * 0.45;
        const delta =
          rect.top + Math.min(rect.height, viewport.height * 0.4) / 2 - center;
        const sheetBody = field.closest<HTMLElement>(".bottom-sheet__body");
        if (Math.abs(delta) > 12)
          (sheetBody || window).scrollBy({ top: delta, behavior: "instant" });
      }, 100);
    };
    const focus = () => {
      update();
      clearTimeout(followup);
      followup = window.setTimeout(update, 350);
    };
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    document.addEventListener("focusin", focus);
    document.addEventListener("focusout", focus);
    return () => {
      clearTimeout(timer);
      clearTimeout(followup);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("focusout", focus);
      html.style.removeProperty("--keyboard-overlap");
      html.style.removeProperty("--visible-viewport-height");
      html.classList.remove("keyboard-open");
    };
  }, []);
  return null;
}
