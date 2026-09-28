import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const host = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState("tab");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    const before = (event: Event) => {
      const next = (event as CustomEvent<string>).detail;
      setDirection(next);
      const layer = host.current;
      layer?.replaceChildren();
      if (
        next === "tab" ||
        !layer ||
        matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      const screen = document.querySelector<HTMLElement>(
        ".phone-frame .screen",
      );
      if (!screen) return;
      const bounds = screen.getBoundingClientRect();
      const clone = screen.cloneNode(true) as HTMLElement;
      clone.inert = true;
      clone.removeAttribute("id");
      clone.setAttribute("aria-hidden", "true");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      clone.classList.add("transition-snapshot");
      clone.style.left = `${bounds.left}px`;
      clone.style.top = `${bounds.top}px`;
      clone.style.width = `${bounds.width}px`;
      clone
        .querySelectorAll(".tabbar,.sticky-action")
        .forEach((el) => el.remove());
      layer.dataset.direction = next;
      layer.append(clone);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => layer.replaceChildren(), 290);
    };
    window.addEventListener("outpost:navigate", before);
    return () => {
      window.removeEventListener("outpost:navigate", before);
      clearTimeout(timer.current);
    };
  }, []);
  return (
    <>
      <div
        className="route-stage"
        key={location.key}
        data-transition={direction}
      >
        {children}
      </div>
      {createPortal(
        <div className="transition-layer" ref={host} aria-hidden="true" />,
        document.body,
      )}
    </>
  );
}
