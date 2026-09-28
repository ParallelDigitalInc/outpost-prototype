import type { CSSProperties } from "react";
export type IconName =
  | "home"
  | "sessions"
  | "saved"
  | "profile"
  | "back"
  | "chevron"
  | "search"
  | "sparkle"
  | "filters"
  | "close"
  | "check"
  | "arrow"
  | "leaf"
  | "briefcase"
  | "grant"
  | "bell"
  | "video"
  | "ellipsis";
const paths: Record<
  Exclude<IconName, "search" | "profile" | "sessions">,
  string
> = {
  home: "M3.5 10.5 12 3.5l8.5 7V20a.8.8 0 0 1-.8.8H15v-6H9v6H4.3a.8.8 0 0 1-.8-.8z",
  saved: "M6.5 4h11v16.5l-5.5-4-5.5 4z",
  back: "m14.5 5-7 7 7 7",
  chevron: "m9 6 6 6-6 6",
  sparkle:
    "M12 2.5c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8Z",
  filters: "M4 7h16M4 17h16M8 4v6M16 14v6",
  close: "m6 6 12 12M18 6 6 18",
  check: "m5 12 4 4L19 6",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  leaf: "M5 19c8 0 13-5 14-14-9 1-14 6-14 14Zm0 0 7-7",
  briefcase: "M8 7V4h8v3M3 7h18v13H3zM3 12h18M10 12v3h4v-3",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4",
  video: "M3 6h12v12H3zM15 10l6-3v10l-6-3",
  ellipsis: "M5 12h.01M12 12h.01M19 12h.01",
  grant: "M4 20h16M6 20V9m6 11V9m6 11V9M3 9l9-6 9 6z",
};
export function Icon({
  name,
  size = 24,
  filled = false,
  style,
}: {
  name: IconName;
  size?: number;
  filled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {name === "search" ? (
        <>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </>
      ) : name === "profile" ? (
        <>
          <circle cx="12" cy="8.5" r="4" />
          <path d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
        </>
      ) : name === "sessions" ? (
        <>
          <rect x="4" y="5" width="16" height="15.5" rx="1.5" />
          <path d="M8 3v4M16 3v4M4 10h16" />
        </>
      ) : (
        <path
          d={paths[name]}
          fill={filled || name === "sparkle" ? "currentColor" : "none"}
          strokeWidth={filled ? 0 : 1.6}
        />
      )}
    </svg>
  );
}
