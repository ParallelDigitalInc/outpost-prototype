import { useLayoutEffect, useRef, type ReactNode } from "react";
import { useAppNavigation } from "../navigation";
import { appStore, useAppStore, type SavedKind } from "../state";
import type { CatalogItem } from "../data/catalog";
import { FadeImage, Skeleton, useToast } from "./primitives";
import { Icon } from "./Icon";
export const asset = (path: string) => import.meta.env.BASE_URL + path;
export function SearchLink({
  to,
  placeholder,
}: {
  to: string;
  placeholder: string;
}) {
  const nav = useAppNavigation();
  return (
    <button className="search-link" onClick={() => nav.startSearch(to)}>
      <span className="search-icon">
        <Icon name="search" size={20} />
        <Icon name="sparkle" size={9} />
      </span>
      <span>{placeholder}</span>
    </button>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Ask Outpost",
  icon = "search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: "search" | "sparkle";
}) {
  const ref = useRef<HTMLInputElement>(null);
  useLayoutEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="search-input-wrap">
      <Icon
        name={icon}
        size={20}
        style={icon === "sparkle" ? { color: "#E0B000" } : undefined}
      />
      <input
        ref={ref}
        type="search"
        enterKeyHint="search"
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="icon-button"
          aria-label="Clear search"
          onClick={() => {
            onChange("");
            ref.current?.focus();
          }}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </div>
  );
}
export function SaveButton({ kind, id }: { kind: SavedKind; id: string }) {
  const state = useAppStore();
  const { show } = useToast();
  const nav = useAppNavigation();
  const saved = state.saved[kind].includes(id);
  return (
    <button
      className={`save-target ${saved ? "is-saved" : ""}`}
      aria-label={
        saved ? "Unsave " + kind.slice(0, -1) : "Save " + kind.slice(0, -1)
      }
      aria-pressed={saved}
      onClick={(event) => {
        event.stopPropagation();
        appStore.toggleSave(kind, id);
        navigator.vibrate?.(10);
        show({
          message: saved ? "Removed from Saved" : "Saved",
          actionLabel: saved ? "Undo" : "View",
          onAction: () =>
            saved ? appStore.setSaved(kind, id, true) : nav.switchTab("saved"),
        });
      }}
    >
      <span className="save-pill">
        <Icon name="saved" size={13} filled={saved} />
        {saved ? "Saved" : "Save"}
      </span>
    </button>
  );
}
export function FilterButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="filter-button" onClick={onClick}>
      <Icon name="filters" size={15} />
      Filters
    </button>
  );
}
export function HeaderShare({ title = "Outpost" }: { title?: string }) {
  const { show } = useToast();
  return (
    <button
      className="icon-button outlined"
      aria-label="Share"
      onClick={async () => {
        const url = location.href;
        try {
          if (navigator.share) {
            await navigator.share({ title, url });
            return;
          }
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(url);
            show({ message: "Link copied" });
          } else {
            window.prompt("Copy link", url);
          }
        } catch {
          /* Cancellation is quiet. */
        }
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M12 15V3m-4 4 4-4 4 4M5 10v10h14V10" />
      </svg>
    </button>
  );
}
export function Segments({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="segments" aria-label="View">
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && option.count > 0 && (
            <span className="segment-count" key={option.count}>
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
export function ItemCard({
  item,
  loading = false,
  compact = false,
}: {
  item: CatalogItem;
  loading?: boolean;
  compact?: boolean;
}) {
  const nav = useAppNavigation();
  if (loading) return <CardSkeleton compact={compact} />;
  const isMentor = item.kind === "mentors";
  return (
    <article
      className={`card item-card ${compact ? "compact-card" : ""} ${item.kind}-card`}
    >
      <button
        className="item-card-heading"
        onClick={() => nav.go(`/${item.kind}/${item.id}`)}
      >
        {item.image ? (
          <FadeImage
            src={asset(item.image)}
            className={isMentor ? "item-portrait" : "item-logo"}
            style={
              {
                "--image-position": item.imagePosition || "50% 20%",
              } as React.CSSProperties
            }
            alt=""
            width={isMentor ? 64 : 56}
            height={isMentor ? 80 : 56}
          />
        ) : item.amount ? (
          <span className="amount-tile">
            <small>Up to</small>
            <strong>{item.amount}</strong>
          </span>
        ) : (
          <span className="item-symbol">
            <Icon
              name={
                isMentor
                  ? "profile"
                  : item.kind === "grants"
                    ? "grant"
                    : "briefcase"
              }
            />
          </span>
        )}
        <span className="grow">
          <strong>{item.title}</strong>
          <small>{item.subtitle}</small>
          {!compact && (
            <span className="chip-row">
              {item.tags.map((tag) => (
                <span className="chip" key={tag}>
                  {tag}
                </span>
              ))}
            </span>
          )}
          {compact && (
            <span className="date-label">
              {item.dateLabel} {item.date}
            </span>
          )}
        </span>
      </button>
      {compact ? (
        <SaveButton kind={item.kind} id={item.id} />
      ) : (
        <>
          {item.why && (
            <div className="why-strip">
              <Icon name="sparkle" size={15} />
              <span>{item.why}</span>
            </div>
          )}
          <div className="card-footer">
            <div className="card-date">
              <Icon name="sessions" size={14} />
              <span>{item.dateLabel}</span>
              <span className="date-label">{item.date}</span>
            </div>
            <SaveButton kind={item.kind} id={item.id} />
          </div>
        </>
      )}
    </article>
  );
}
export function CardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`card card-skeleton ${compact ? "compact-card" : ""}`}
      aria-hidden="true"
    >
      <div className="item-card-heading">
        <Skeleton className="item-image-skeleton" />
        <div className="grow">
          <Skeleton className="line w70" />
          <Skeleton className="line short w90" />
          <Skeleton className="line short w60" />
        </div>
      </div>
      {!compact && (
        <>
          <Skeleton className="why-skeleton" />
          <div className="card-footer">
            <Skeleton className="line w60" />
            <Skeleton className="pill-skeleton" />
          </div>
        </>
      )}
    </div>
  );
}
export function SectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>{children}</h2>
      {action}
    </div>
  );
}
