import { useEffect } from "react";

/** Let the browser reveal focused fields; only toggle the static focus treatment. */
export function KeyboardViewport() {
  useEffect(() => {
    const html = document.documentElement;
    const isEditable = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      target.id !== "keyboard-bridge" &&
      target.matches(
        'input:not([type=radio]):not([type=checkbox]):not([type=button]):not([type=submit]):not([type=hidden]), textarea, [contenteditable="true"]',
      );
    const focusIn = (event: FocusEvent) => {
      html.classList.toggle("input-focused", isEditable(event.target));
    };
    const focusOut = (event: FocusEvent) => {
      html.classList.toggle("input-focused", isEditable(event.relatedTarget));
    };
    html.classList.toggle("input-focused", isEditable(document.activeElement));
    document.addEventListener("focusin", focusIn);
    document.addEventListener("focusout", focusOut);
    return () => {
      document.removeEventListener("focusin", focusIn);
      document.removeEventListener("focusout", focusOut);
      html.classList.remove("input-focused");
    };
  }, []);
  return null;
}
