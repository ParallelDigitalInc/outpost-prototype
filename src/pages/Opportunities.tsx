import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Screen } from "../components/Screen";
import { Icon } from "../components/Icon";
import {
  BottomSheet,
  Button,
  FadeImage,
  Skeleton,
  useFirstVisitLoading,
  useToast,
} from "../components/primitives";
import {
  asset,
  CardSkeleton,
  FilterButton,
  SaveButton,
  SearchInput,
  SearchLink,
  Segments,
} from "../components/shared";
import {
  appStore,
  useAppStore,
  type ApplicationKind,
  type ApplicationStatus,
  type FounderProfile,
} from "../state";
import { useAppNavigation } from "../navigation";
import {
  challenges,
  demoDays,
  getOpportunity,
  grants,
  opportunities,
  opportunityMatchScore,
  type Opportunity,
} from "../data/opportunities";
import "./opportunities.css";

const label = (kind: ApplicationKind) =>
  kind === "challenges" ? "Challenges" : "Grants";
const searchPlaceholder = (kind: ApplicationKind) =>
  kind === "challenges"
    ? "Try: ‘agritech pilots with a grant’"
    : "Try: ‘money I don’t have to pay back’";
type Filters = {
  brand: string[];
  status: string[];
  focus: string[];
  product: string[];
  type: string[];
  source: string[];
  recognised: string[];
  closing: boolean;
};
const cleanFilters = (): Filters => ({
  brand: [],
  status: [],
  focus: [],
  product: [],
  type: [],
  source: [],
  recognised: [],
  closing: false,
});
function suggestedFilters(
  kind: ApplicationKind,
  profile: FounderProfile,
): Filters {
  const filters = cleanFilters();
  if (kind === "challenges") {
    const sectors = [
      "Mobility",
      "Agritech",
      "Climate tech",
      "Health tech",
      "Fintech",
      "Clean tech",
      "Deep tech",
    ];
    filters.focus = sectors.includes(profile.sector) ? [profile.sector] : [];
    filters.product = [
      profile.stage === "Idea"
        ? "Idea"
        : profile.stage === "Growth" || profile.stage === "Series A"
          ? "Market-ready"
          : "Working product",
    ];
  } else {
    filters.status = ["Open", "Apply anytime"];
    if (/hyderabad|warangal|telangana/i.test(profile.city))
      filters.source = ["Telangana"];
  }
  return filters;
}
function readFilters(raw?: string): Filters {
  try {
    return { ...cleanFilters(), ...JSON.parse(raw || "{}") };
  } catch {
    return cleanFilters();
  }
}
function matchesFilters(item: Opportunity, filters: Filters) {
  return (
    (!filters.brand.length || filters.brand.includes(item.issuer || "")) &&
    (!filters.status.length ||
      filters.status.includes(item.status) ||
      (filters.status.includes("Demo day coming") &&
        item.id === "maruti-mobility")) &&
    (!filters.focus.length ||
      filters.focus.some((value) => item.focus?.includes(value))) &&
    (!filters.product.length ||
      filters.product.some(
        (value) =>
          item.products?.includes(value) ||
          (value === "Working product" &&
            item.products?.includes("Market-ready")),
      )) &&
    (!filters.type.length ||
      filters.type.some(
        (value) =>
          item.tags.includes(value) ||
          (value === "Allowance" && item.tags.includes("Incentive")),
      )) &&
    (!filters.source.length ||
      filters.source.some(
        (value) =>
          item.source === value ||
          (value === "T-Hub" && item.tags.includes("Through T-Hub")),
      )) &&
    (!filters.recognised.includes("DPIIT recognition") ||
      ["seed-fund", "tax-holiday", "kotak-bizlabs"].includes(item.id)) &&
    (!filters.recognised.includes("Telangana recognition") ||
      item.source === "Telangana") &&
    (!filters.recognised.includes("A woman founder") ||
      item.source === "Telangana" ||
      item.id === "seed-fund") &&
    (!filters.closing || (item.closesIn !== undefined && item.closesIn <= 7))
  );
}
export function OpportunityTile({
  item,
  small = false,
}: {
  item: Opportunity;
  small?: boolean;
}) {
  return item.image ? (
    <FadeImage
      src={asset(item.image)}
      alt=""
      className={`opportunity-tile ${small ? "small" : ""}`}
      width={small ? 48 : 64}
      height={small ? 54 : 72}
    />
  ) : (
    <span
      className={`opportunity-tile text-tile ${small ? "small" : ""}`}
      style={{ background: item.tileColor || "#1C1C1C" }}
    >
      {item.tileLabel || (
        <>
          <small>Up to</small>
          <strong>{item.shortAmount}</strong>
        </>
      )}
    </span>
  );
}
function NotifyButton({ item }: { item: Opportunity }) {
  const state = useAppStore();
  const toast = useToast();
  const key = `notify:${item.kind}:${item.id}`;
  const enabled = state.drafts[key] === "yes";
  return (
    <button
      className={`opportunity-small-button ${enabled ? "selected" : ""}`}
      aria-pressed={enabled}
      onClick={() => {
        appStore.setDraft(key, enabled ? "" : "yes");
        toast.show({
          message: enabled
            ? "Notifications off"
            : "We’ll tell you when it opens",
        });
      }}
    >
      <Icon name="bell" size={13} />
      {enabled ? "Notifying" : "Notify"}
    </button>
  );
}
export function OpportunityCard({
  item,
  compact = false,
}: {
  item: Opportunity;
  compact?: boolean;
}) {
  const nav = useAppNavigation();
  return (
    <article
      className={`opportunity-card ${compact ? "opportunity-row" : ""} ${item.status === "Closed" ? "is-closed" : ""}`}
      onClick={(event) => {
        if (!(event.target as Element).closest("button,a"))
          nav.go(`/${item.kind}/${item.id}`);
      }}
    >
      <button
        className="opportunity-heading"
        onClick={() => nav.go(`/${item.kind}/${item.id}`)}
      >
        <OpportunityTile item={item} small={compact} />
        <span className="grow">
          <strong>{item.title}</strong>
          <small>{item.subtitle}</small>
          {compact ? (
            <span className="opportunity-row-meta">
              <b>{item.shortAmount}</b>
              <span>
                {item.dateLabel} {item.date}
              </span>
            </span>
          ) : (
            <span className="chip-row">
              {item.tags.slice(0, 2).map((tag) => (
                <span className="chip" key={tag}>
                  {tag}
                </span>
              ))}
            </span>
          )}
        </span>
      </button>
      {compact ? (
        item.status === "Opening soon" ||
        item.status === "Opens later" ||
        (item.status === "Closed" && item.id !== "maruti-mobility") ? (
          <NotifyButton item={item} />
        ) : item.id === "maruti-mobility" ? (
          <button
            className="opportunity-small-button selected"
            onClick={() => nav.go("/challenges/demo-days")}
          >
            <Icon name="bell" size={13} /> Attend
          </button>
        ) : (
          <SaveButton kind={item.kind} id={item.id} />
        )
      ) : (
        <>
          {item.why && (
            <div className="why-strip">
              <Icon name="sparkle" size={13} />
              <span>{item.why}</span>
            </div>
          )}
          <div className="opportunity-footer">
            <div className="opportunity-stats">
              <div>
                <small>{item.amountLabel}</small>
                <strong>{item.amount}</strong>
              </div>
              <div>
                <small>{item.dateLabel || "Apply"}</small>
                <span>{item.date}</span>
              </div>
            </div>
            <SaveButton kind={item.kind} id={item.id} />
          </div>
        </>
      )}
    </article>
  );
}
export function WhyOpportunities({
  kind,
  open,
  onClose,
}: {
  kind: ApplicationKind;
  open: boolean;
  onClose: () => void;
}) {
  const state = useAppStore();
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={`Why these ${kind}`}
      description="A starting point. You decide what fits."
    >
      <div className="opportunity-explanations">
        <div>
          <Icon name="profile" />
          <span>
            <strong>Your startup</strong>
            <small>
              {state.profile.sector}, {state.profile.stage.toLowerCase()},{" "}
              {kind === "grants" ? "based in Telangana" : "working product"}
            </small>
          </span>
        </div>
        <div>
          <Icon name="sessions" />
          <span>
            <strong>{kind === "grants" ? "Dates" : "Deadlines"}</strong>
            <small>
              {kind === "grants"
                ? "Open calls closing soonest, then rolling ones"
                : "Open ones closing soonest come first"}
            </small>
          </span>
        </div>
        <div>
          <Icon name="search" />
          <span>
            <strong>What you search for</strong>
            <small>Used when you search or ask</small>
          </span>
        </div>
      </div>
      <p className="opportunity-sheet-note">
        {kind === "grants"
          ? "Amounts are the most you can get. Each issuer decides who qualifies, and how much."
          : "Each company picks its own startups. Check their requirements before you apply."}
      </p>
      <Button onClick={onClose}>Got it</Button>
    </BottomSheet>
  );
}
function FiltersSheet({
  kind,
  open,
  onClose,
  value,
  onApply,
}: {
  kind: ApplicationKind;
  open: boolean;
  onClose: () => void;
  value: Filters;
  onApply: (value: Filters) => void;
}) {
  const [draft, setDraft] = useState(value);
  const { profile } = useAppStore();
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);
  const group = (
    title: string,
    key: Exclude<keyof Filters, "closing">,
    options: string[],
  ) => (
    <fieldset className="opportunity-filter-group">
      <legend>{title}</legend>
      <div>
        {options.map((option) => (
          <button
            key={option}
            className={draft[key].includes(option) ? "selected" : ""}
            aria-pressed={draft[key].includes(option)}
            onClick={() =>
              setDraft((current) => ({
                ...current,
                [key]: current[key].includes(option)
                  ? current[key].filter((v) => v !== option)
                  : [...current[key], option],
              }))
            }
          >
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
  const count = opportunities[kind].filter(
    (item) => item.directory !== false && matchesFilters(item, draft),
  ).length;
  return (
    <BottomSheet open={open} onClose={onClose} title="Filters">
      <div className="opportunity-filter-content">
        {kind === "challenges" ? (
          <>
            {group("Brand", "brand", [
              "Honda",
              "Kotak",
              "Lilly",
              "Boeing",
              "FEG India",
              "Maruti Suzuki",
            ])}
            {group("Status", "status", [
              "Open",
              "Opening soon",
              "Demo day coming",
              "Closed",
            ])}
            {group("Focus area", "focus", [
              "Mobility",
              "Agritech",
              "Climate tech",
              "Health tech",
              "Fintech",
              "Clean tech",
              "Deep tech",
            ])}
            {group("Your product", "product", [
              "Idea",
              "Working product",
              "Market-ready",
            ])}
            <label className="opportunity-toggle">
              Closing in 7 days
              <input
                type="checkbox"
                checked={draft.closing}
                onChange={(e) =>
                  setDraft({ ...draft, closing: e.target.checked })
                }
              />
            </label>
          </>
        ) : (
          <>
            {group("Status", "status", [
              "Open",
              "Apply anytime",
              "Opens later",
            ])}
            {group("Type", "type", [
              "Grant",
              "Reimbursement",
              "Allowance",
              "Prize",
              "Credits",
              "Tax benefit",
              "Loan guarantee",
            ])}
            {group("From", "source", [
              "Central",
              "Telangana",
              "Corporate",
              "T-Hub",
            ])}
            {group(`${profile.startupName} has`, "recognised", [
              "DPIIT recognition",
              "Telangana recognition",
              "A woman founder",
            ])}
          </>
        )}
      </div>
      <div className="opportunity-sheet-actions">
        <Button variant="secondary" onClick={() => setDraft(cleanFilters())}>
          Reset
        </Button>
        <Button
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          Show {count} {kind}
        </Button>
      </div>
    </BottomSheet>
  );
}
export function ApplicationRail({ item }: { item: Opportunity }) {
  const state = useAppStore();
  const application = state.applications.find(
    (a) => a.kind === item.kind && a.itemId === item.id,
  );
  const toast = useToast();
  const stages: { value: ApplicationStatus; label: string; hint: string }[] = [
    { value: "applied", label: "Applied", hint: "Fri 25 Sep" },
    { value: "heard-back", label: "Heard back", hint: "Not yet" },
    { value: "decision", label: "Decision", hint: "Got it or not" },
  ];
  return (
    <div className="application-status-block">
      <div className="application-status-rail">
        {stages.map((stage, index) => (
          <button
            key={stage.value}
            aria-pressed={application?.status === stage.value}
            className={
              application &&
              stages.findIndex((s) => s.value === application.status) >= index
                ? "complete"
                : ""
            }
            onClick={() => {
              appStore.setApplicationStatus(item.kind, item.id, stage.value);
              toast.show({ message: "Status updated" });
            }}
          >
            <span className="status-dot">{index + 1}</span>
            <strong>{stage.label}</strong>
            <small>
              {application?.status === stage.value && index > 0
                ? "Your update"
                : stage.hint}
            </small>
          </button>
        ))}
      </div>
      <div className="application-actions">
        <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
          Official page <span aria-hidden="true">↗</span>
        </a>
        <button onClick={() => requestApplicationAnswer(item)}>
          Update status
        </button>
      </div>
    </div>
  );
}
function ApplicationCard({ item }: { item: Opportunity }) {
  const nav = useAppNavigation();
  return (
    <article className="application-card">
      <button
        className="opportunity-heading"
        onClick={() => nav.go(`/${item.kind}/${item.id}`)}
      >
        <OpportunityTile item={item} small />
        <span className="grow">
          <strong>{item.title}</strong>
          <small>
            {item.issuer} · up to {item.amount}
          </small>
          <span className="date-label">Applied Fri 25 Sep</span>
        </span>
      </button>
      <ApplicationRail item={item} />
    </article>
  );
}

export function OpportunitiesPage({ kind }: { kind: ApplicationKind }) {
  const state = useAppStore();
  const nav = useAppNavigation();
  const loading = useFirstVisitLoading(kind);
  const [params] = useSearchParams();
  const [segment, setSegment] = useState(
    params.get("view") || state.drafts[`${kind}:segment`] || "all",
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [sort, setSort] = useState(
    kind === "grants" ? "Best match" : "Closing soon",
  );
  const requestedView = params.get("view");
  useEffect(() => {
    setFilterOpen(false);
    setWhyOpen(false);
    setSegment(
      requestedView || appStore.getState().drafts[`${kind}:segment`] || "all",
    );
    setSort(kind === "grants" ? "Best match" : "Closing soon");
  }, [kind, requestedView]);
  const filters = useMemo(
    () => readFilters(state.drafts[`${kind}:filters`]),
    [kind, state.drafts],
  );
  const filtered = opportunities[kind].filter(
    (item) => item.directory !== false && matchesFilters(item, filters),
  );
  const hasFilters = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length : value,
  );
  const saved = opportunities[kind].filter((item) =>
    state.saved[kind].includes(item.id),
  );
  const applied = opportunities[kind].filter((item) =>
    state.applications.some((a) => a.kind === kind && a.itemId === item.id),
  );
  const items =
    segment === "saved" ? saved : segment === "applied" ? applied : filtered;
  const groups =
    kind === "challenges"
      ? ["Accepting applications", "Opening soon", "Closed"]
      : ["Open now", "Apply anytime", "Opens later"];
  const [visibleCount, setVisibleCount] = useState(
    kind === "challenges" ? 4 : 10,
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const feedEnd = useRef<HTMLDivElement>(null);
  const feedVersion = `${kind}:${segment}:${sort}:${JSON.stringify(filters)}`;
  useEffect(() => {
    setVisibleCount(kind === "challenges" ? 4 : 10);
    setLoadingMore(false);
  }, [feedVersion, kind]);
  useEffect(() => {
    if (
      loading ||
      segment !== "all" ||
      visibleCount >= items.length ||
      !feedEnd.current
    )
      return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || timer) return;
        setLoadingMore(true);
        timer = setTimeout(() => {
          setVisibleCount((count) => Math.min(count + 10, items.length));
          setLoadingMore(false);
        }, 300);
      },
      { rootMargin: "240px" },
    );
    observer.observe(feedEnd.current);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [loading, segment, visibleCount, items.length, feedVersion]);
  const visibleIds = new Set(
    groups
      .flatMap((group) => {
        const grouped = items.filter((item) => item.group === group);
        return sort === "Name"
          ? grouped.sort((a, b) => a.title.localeCompare(b.title))
          : sort === "Closing soon"
            ? grouped.sort((a, b) => (a.closesIn ?? 999) - (b.closesIn ?? 999))
            : grouped;
      })
      .slice(0, visibleCount)
      .map((item) => item.id),
  );
  const selectSegment = (value: string) => {
    setSegment(value);
    appStore.setDraft(`${kind}:segment`, value);
  };
  return (
    <Screen
      title={label(kind)}
      className="opportunities-screen"
      right={<FilterButton onClick={() => setFilterOpen(true)} />}
    >
      <div className="opportunity-chrome">
        <SearchLink to={`/${kind}/ask`} placeholder={searchPlaceholder(kind)} />
        <Segments
          value={segment}
          onChange={selectSegment}
          options={[
            { value: "all", label: "All" },
            { value: "saved", label: "Saved", count: saved.length },
            { value: "applied", label: "Applied", count: applied.length },
          ]}
        />
      </div>
      <div className="content-body opportunity-content">
        {hasFilters && segment === "all" && (
          <div className="active-filters">
            <span>
              {[
                ...filters.brand,
                ...filters.status,
                ...filters.focus,
                ...filters.type,
                ...filters.source,
                ...filters.product,
                ...filters.recognised,
                filters.closing ? "Closing in 7 days" : "",
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
            <button
              onClick={() =>
                appStore.setDraft(
                  `${kind}:filters`,
                  JSON.stringify(cleanFilters()),
                )
              }
            >
              Clear
            </button>
          </div>
        )}
        {loading ? (
          <div className="card-stack">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton compact />
            <CardSkeleton compact />
          </div>
        ) : (
          <>
            {segment === "all" && !hasFilters && (
              <section>
                <div className="opportunity-section-heading">
                  <div>
                    <h2>Top matches for {state.profile.startupName}</h2>
                    <p>
                      {state.profile.sector} ·{" "}
                      {state.profile.stage.toLowerCase()} · {state.profile.city}
                    </p>
                  </div>
                  <button className="why-link" onClick={() => setWhyOpen(true)}>
                    <Icon name="sparkle" size={13} />
                    Why these?
                  </button>
                </div>
                <div className="card-stack">
                  {(kind === "challenges"
                    ? challenges.slice(0, 2)
                    : grants.filter((item) =>
                        ["performance-grant", "samridh"].includes(item.id),
                      )
                  ).map((item) => (
                    <OpportunityCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            )}
            {kind === "challenges" && segment === "all" && !hasFilters && (
              <section>
                <div className="opportunity-section-heading">
                  <div>
                    <h2>Upcoming demo day</h2>
                    <p>Watch finalists pitch to our partners</p>
                  </div>
                  <button
                    className="opportunity-small-button"
                    onClick={() => nav.go("/challenges/demo-days")}
                  >
                    View all <Icon name="chevron" size={12} />
                  </button>
                </div>
                <DemoDayCard event={demoDays[0]} />
              </section>
            )}
            {segment === "all" ? (
              <section>
                <div className="opportunity-section-heading">
                  <h2>
                    {hasFilters ? `${filtered.length} ${kind}` : `All ${kind}`}{" "}
                    {!hasFilters && <small>{filtered.length}</small>}
                  </h2>
                  <select
                    aria-label={`Sort ${kind}`}
                    className="opportunity-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option>Closing soon</option>
                    <option>Best match</option>
                    <option>Name</option>
                  </select>
                </div>
                {!items.length && (
                  <div className="empty-help">
                    No {kind} match these filters.
                    <Button
                      variant="secondary"
                      onClick={() =>
                        appStore.setDraft(
                          `${kind}:filters`,
                          JSON.stringify(cleanFilters()),
                        )
                      }
                    >
                      Reset filters
                    </Button>
                  </div>
                )}
                {groups.map((group) => {
                  const grouped = items.filter(
                    (item) => item.group === group && visibleIds.has(item.id),
                  );
                  if (!grouped.length) return null;
                  const ordered =
                    sort === "Name"
                      ? [...grouped].sort((a, b) =>
                          a.title.localeCompare(b.title),
                        )
                      : sort === "Closing soon"
                        ? [...grouped].sort(
                            (a, b) => (a.closesIn ?? 999) - (b.closesIn ?? 999),
                          )
                        : grouped;
                  return (
                    <div className="opportunity-list-group" key={group}>
                      <div className="opportunity-group-heading">
                        <h3>{group}</h3>
                        <span>
                          {group === "Accepting applications" ||
                          group === "Open now"
                            ? "Closing first"
                            : group === "Opening soon"
                              ? "From 12 Oct"
                              : group === "Apply anytime"
                                ? "Best match first"
                                : group === "Opens later"
                                  ? "We'll tell you when"
                                  : ""}
                        </span>
                      </div>
                      <div className="opportunity-row-list">
                        {ordered.map((item) => (
                          <OpportunityCard key={item.id} item={item} compact />
                        ))}
                      </div>
                    </div>
                  );
                })}
                {items.length > (kind === "challenges" ? 4 : 10) && (
                  <div
                    ref={feedEnd}
                    className="opportunity-feed-end"
                    aria-live="polite"
                  >
                    {loadingMore ? (
                      <div
                        className="card-stack"
                        aria-label={`Loading more ${kind}`}
                      >
                        <CardSkeleton compact />
                        <CardSkeleton compact />
                      </div>
                    ) : visibleCount >= items.length ? (
                      <p>That’s all the {kind} for now</p>
                    ) : (
                      <span aria-hidden="true" />
                    )}
                  </div>
                )}
                {filters.brand.length === 1 && filters.brand[0] === "Honda" && (
                  <div className="opportunity-list-group">
                    <div className="opportunity-group-heading">
                      <h3>Past programme</h3>
                      <span>1 past</span>
                    </div>
                    <div className="opportunity-row-list">
                      <OpportunityCard item={challenges[6]} compact />
                    </div>
                    <FollowCompany />
                  </div>
                )}
              </section>
            ) : (
              <section>
                <h2>
                  {segment === "applied"
                    ? "Your applications"
                    : `Saved ${kind}`}
                </h2>
                <p className="opportunity-subcopy">
                  {segment === "applied"
                    ? "Only you see this. Update it when you hear back."
                    : "Your shortlist, ready when you are."}
                </p>
                <div className="card-stack">
                  {items.map((item) =>
                    state.applications.some(
                      (a) => a.kind === kind && a.itemId === item.id,
                    ) ? (
                      <ApplicationCard key={item.id} item={item} />
                    ) : (
                      <OpportunityCard key={item.id} item={item} compact />
                    ),
                  )}
                </div>
                {!items.length && (
                  <div className="empty-help">
                    {segment === "saved"
                      ? "Save what interests you, and find it here."
                      : "Your applications will appear here."}
                    <Button
                      variant="secondary"
                      onClick={() => selectSegment("all")}
                    >
                      Explore {kind}
                    </Button>
                  </div>
                )}
                {segment === "applied" &&
                  saved.some((item) => !applied.includes(item)) && (
                    <div className="opportunity-list-group">
                      <div className="opportunity-group-heading">
                        <h3>Saved, not applied yet</h3>
                        <span>Still open</span>
                      </div>
                      <div className="opportunity-row-list">
                        {saved
                          .filter((item) => !applied.includes(item))
                          .map((item) => (
                            <OpportunityCard
                              key={item.id}
                              item={item}
                              compact
                            />
                          ))}
                      </div>
                    </div>
                  )}
              </section>
            )}
          </>
        )}
      </div>
      <FiltersSheet
        kind={kind}
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={
          state.drafts[`${kind}:filters`]
            ? filters
            : suggestedFilters(kind, state.profile)
        }
        onApply={(value) =>
          appStore.setDraft(`${kind}:filters`, JSON.stringify(value))
        }
      />
      <WhyOpportunities
        kind={kind}
        open={whyOpen}
        onClose={() => setWhyOpen(false)}
      />
    </Screen>
  );
}
function FollowCompany() {
  const state = useAppStore();
  const active = state.drafts["follow:honda"] === "yes";
  return (
    <div className="follow-company">
      <div>
        <strong>Want to work with Honda?</strong>
        <small>Hear first when they post a challenge</small>
      </div>
      <Button
        variant="secondary"
        onClick={() => appStore.setDraft("follow:honda", active ? "" : "yes")}
      >
        {active ? "Following" : "Follow"}
      </Button>
    </div>
  );
}

function hasSearched(kind: ApplicationKind) {
  try {
    return (
      sessionStorage.getItem(`outpost:screen-visited:${kind}-first-query`) ===
      "1"
    );
  } catch {
    return false;
  }
}
function searchCard(item: Opportunity, query: string): Opportunity {
  if (
    item.kind === "challenges" &&
    item.id === "honda-innovation" &&
    /mobility|product|pilot/i.test(query)
  )
    return { ...item, why: "Fits your working product" };
  if (item.kind === "grants" && item.source === "Telangana")
    return {
      ...item,
      subtitle: "Govt of Telangana",
      ...(item.id === "performance-grant"
        ? { why: "Any sector, if you're based in Telangana" }
        : {}),
      ...(["recruitment-assistance", "international-marketing"].includes(
        item.id,
      )
        ? { dateLabel: "Apply", date: "Anytime" }
        : {}),
    };
  return item;
}
export function OpportunitySearchPage({ kind }: { kind: ApplicationKind }) {
  const state = useAppStore();
  const key = `${kind}:query`;
  const value = state.drafts[key] || "";
  const [query, setQuery] = useState(value);
  const [loading, setLoading] = useState(false);
  const firstQuery = useRef(!hasSearched(kind));
  const [why, setWhy] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterKey = `${kind}:search-filters`;
  const filters = useMemo(
    () => readFilters(state.drafts[filterKey]),
    [state.drafts, filterKey],
  );
  useEffect(() => {
    if (value && firstQuery.current) setLoading(true);
    const timeout = setTimeout(() => {
      setQuery(value);
      setLoading(false);
      if (value) {
        firstQuery.current = false;
        try {
          sessionStorage.setItem(
            `outpost:screen-visited:${kind}-first-query`,
            "1",
          );
        } catch {
          /* Keep the in-memory visit. */
        }
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [value, kind]);
  const results = opportunities[kind]
    .filter((item) => item.directory !== false && matchesFilters(item, filters))
    .map((item) => ({ item, score: opportunityMatchScore(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ item }) => item);
  const suggestions =
    kind === "challenges"
      ? [
          "Open challenges in agritech",
          "Pilots with a large company",
          "Grants with no equity",
        ]
      : [
          "Grants with no equity",
          "Anything I can claim back",
          "Closing this month",
        ];
  const recent =
    kind === "challenges"
      ? ["Supply-chain pilots", "Challenges from Honda"]
      : ["Grants through T-Hub", "Seed money for agritech"];
  return (
    <Screen title={label(kind)}>
      <div className="opportunity-chrome">
        <SearchInput
          value={value}
          onChange={(next) => appStore.setDraft(key, next)}
          placeholder={
            kind === "challenges"
              ? "Describe the challenge you need"
              : "Describe the funding you need"
          }
        />
      </div>
      <div className="content-body opportunity-content">
        {!value ? (
          <>
            <section>
              <h2 className="opportunity-search-heading">Try asking</h2>
              <div className="opportunity-suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => appStore.setDraft(key, suggestion)}
                  >
                    <Icon name="search" size={17} />
                    {suggestion}
                    <Icon name="arrow" size={16} />
                  </button>
                ))}
              </div>
            </section>
            {state.drafts[`${kind}:recent-cleared`] !== "yes" && (
              <section>
                <div className="opportunity-section-heading">
                  <h2 className="opportunity-search-heading">Recent</h2>
                  <button
                    className="text-button"
                    onClick={() =>
                      appStore.setDraft(`${kind}:recent-cleared`, "yes")
                    }
                  >
                    Clear
                  </button>
                </div>
                <div className="opportunity-suggestions">
                  {recent.map((term, index) => (
                    <button
                      key={term}
                      onClick={() => appStore.setDraft(key, term)}
                    >
                      <Icon name="search" size={17} />
                      <span>
                        {term}
                        <small>{index ? "Last week" : "3 days ago"}</small>
                      </span>
                      <Icon name="arrow" size={16} />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <div className="opportunity-section-heading">
              <h2>
                {loading ? "" : results.length} {kind}
              </h2>
              <FilterButton onClick={() => setFiltersOpen(true)} />
            </div>
            <div className="card-stack">
              {loading ? (
                <>
                  <CardSkeleton />
                  <CardSkeleton />
                </>
              ) : (
                results.map((item) => (
                  <OpportunityCard
                    key={item.id}
                    item={searchCard(item, query)}
                  />
                ))
              )}
            </div>
            {!loading && !results.length && (
              <p className="empty-help">
                Try a company, focus area or type of support.
              </p>
            )}
            <button className="why-link" onClick={() => setWhy(true)}>
              <Icon name="sparkle" size={14} />
              Why these {kind}?
            </button>
          </>
        )}
      </div>
      <FiltersSheet
        kind={kind}
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        value={
          state.drafts[filterKey]
            ? filters
            : suggestedFilters(kind, state.profile)
        }
        onApply={(next) => appStore.setDraft(filterKey, JSON.stringify(next))}
      />
      <WhyOpportunities kind={kind} open={why} onClose={() => setWhy(false)} />
    </Screen>
  );
}

type DemoDay = {
  id: string;
  title: string;
  subtitle: string;
  month: string;
  day: string;
  weekday: string;
  date: string;
  time: string;
  place: string;
  location: string;
  relative: string;
  note: string;
  logo?: string;
  issuer: string;
  color: string;
  start: string;
  end: string;
};
function downloadCalendar(events: readonly DemoDay[]) {
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Outpost//Demo days//EN",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.id}@outpost`,
      `DTSTART:${event.start}`,
      `DTEND:${event.end}`,
      `SUMMARY:${event.title}`,
      `LOCATION:${event.place} ${event.location}`,
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "outpost-demo-days.ics";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function DemoDayCard({ event }: { event: DemoDay }) {
  const state = useAppStore();
  const toast = useToast();
  const key = `rsvp:${event.id}`;
  const attending = state.drafts[key] === "yes";
  return (
    <article className="demo-day-card">
      <div
        className="demo-day-cover"
        style={{ "--cover-color": event.color } as React.CSSProperties}
      >
        <span className="demo-day-label">
          {event.place === "Online" ? "Online demo day" : "Demo day"}
        </span>
        <span className="demo-day-relative">{event.relative}</span>
        {event.logo ? (
          <FadeImage
            src={asset(event.logo)}
            alt="Maruti Suzuki"
            className="demo-day-logo"
          />
        ) : (
          <strong className="demo-day-wordmark">{event.issuer}</strong>
        )}
        <div className="demo-day-date">
          <small>{event.month}</small>
          <strong>{event.day}</strong>
          <span>{event.weekday}</span>
        </div>
      </div>
      <div className="demo-day-body">
        <div>
          <h3>{event.title}</h3>
          <p>{event.subtitle}</p>
        </div>
        <div className="demo-day-facts">
          <div>
            <Icon name="sessions" size={18} />
            <span>
              {event.date}
              <small>{event.time}</small>
            </span>
          </div>
          <div>
            <Icon name="home" size={18} />
            <span>
              {event.place}
              <small>{event.location}</small>
            </span>
          </div>
        </div>
        <div className="demo-day-actions">
          <Button
            variant={attending ? "secondary" : "primary"}
            aria-pressed={attending}
            onClick={() => {
              appStore.setDraft(key, attending ? "" : "yes");
              toast.show({
                message: attending ? "RSVP cancelled" : "You’re attending",
              });
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 8a2 2 0 0 0 0 4v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a2 2 0 0 0 0-4V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1z" />
            </svg>
            {attending ? "You're attending" : "Attend demo day"}
          </Button>
          <button
            className="icon-button outlined"
            aria-label={`Add ${event.title} to calendar`}
            onClick={() => downloadCalendar([event])}
          >
            <Icon name="sessions" size={18} />
          </button>
        </div>
        <small className="demo-day-note">
          {attending ? "Manage RSVP and email reminders" : event.note}
        </small>
      </div>
    </article>
  );
}
export function DemoDaysPage() {
  const state = useAppStore();
  const [segment, setSegment] = useState("upcoming");
  const loading = useFirstVisitLoading("demo-days");
  const events =
    segment === "attending"
      ? demoDays.filter((event) => state.drafts[`rsvp:${event.id}`] === "yes")
      : segment === "past"
        ? []
        : demoDays;
  return (
    <Screen
      title="Demo days"
      right={
        <button
          className="filter-button"
          onClick={() => downloadCalendar(demoDays)}
        >
          <Icon name="sessions" size={16} />
          Calendar
        </button>
      }
    >
      <div className="opportunity-chrome">
        <Segments
          value={segment}
          onChange={setSegment}
          options={[
            { value: "upcoming", label: "Upcoming", count: 3 },
            {
              value: "attending",
              label: "Attending",
              count: demoDays.filter(
                (event) => state.drafts[`rsvp:${event.id}`] === "yes",
              ).length,
            },
            { value: "past", label: "Past" },
          ]}
        />
      </div>
      <div className="content-body opportunity-content">
        {loading ? (
          <>
            <Skeleton style={{ height: 418, borderRadius: 18 }} />
            <Skeleton style={{ height: 418, borderRadius: 18 }} />
          </>
        ) : (
          <>
            {events.map((event, index) => (
              <section key={event.id}>
                {(!index || event.month !== events[index - 1].month) && (
                  <div className="opportunity-group-heading">
                    <h3>{event.month === "OCT" ? "October" : "November"}</h3>
                    <span>
                      {events.filter((e) => e.month === event.month).length}{" "}
                      demo{" "}
                      {events.filter((e) => e.month === event.month).length ===
                      1
                        ? "day"
                        : "days"}
                    </span>
                  </div>
                )}
                <DemoDayCard event={event} />
              </section>
            ))}
            {!events.length && (
              <p className="empty-help">
                {segment === "past"
                  ? "Your past demo days will appear here."
                  : "Attend a demo day to keep it here."}
              </p>
            )}
          </>
        )}
      </div>
    </Screen>
  );
}

const pendingKey = "apply:pending";
export function openApplication(item: Opportunity) {
  if (
    appStore.getState().drafts[`apply:answer:${item.kind}:${item.id}`] !== "no"
  )
    appStore.setDraft(
      pendingKey,
      JSON.stringify({ kind: item.kind, id: item.id, left: false }),
    );
  window.open(item.officialUrl, "_blank", "noopener,noreferrer");
}
export function requestApplicationAnswer(item: Opportunity) {
  window.dispatchEvent(
    new CustomEvent("outpost:application-answer", {
      detail: { kind: item.kind, id: item.id },
    }),
  );
}
export function ApplicationReturnPrompt() {
  const nav = useAppNavigation();
  const toast = useToast();
  const [item, setItem] = useState<Opportunity | null>(null);
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const ask = (kind: ApplicationKind, id: string) => {
      const next = getOpportunity(kind, id);
      setItem(next);
      setAnswer(appStore.getState().drafts[`apply:answer:${kind}:${id}`] || "");
    };
    const getPending = () => {
      try {
        return JSON.parse(appStore.getState().drafts[pendingKey] || "null") as {
          kind: ApplicationKind;
          id: string;
          left: boolean;
        } | null;
      } catch {
        return null;
      }
    };
    const leave = () => {
      const pending = getPending();
      if (pending)
        appStore.setDraft(
          pendingKey,
          JSON.stringify({ ...pending, left: true }),
        );
    };
    const returnToApp = () => {
      const pending = getPending();
      if (pending?.left) {
        appStore.setDraft(pendingKey, "");
        ask(pending.kind, pending.id);
      }
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") leave();
      else returnToApp();
    };
    const edit = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      ask(detail.kind, detail.id);
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", leave);
    window.addEventListener("focus", returnToApp);
    window.addEventListener("outpost:application-answer", edit);
    if (getPending()?.left && document.visibilityState === "visible")
      returnToApp();
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", leave);
      window.removeEventListener("focus", returnToApp);
      window.removeEventListener("outpost:application-answer", edit);
    };
  }, []);
  const save = () => {
    if (!item || !answer) return;
    setBusy(true);
    window.setTimeout(
      () => {
        appStore.setDraft(`apply:answer:${item.kind}:${item.id}`, answer);
        if (answer === "yes") {
          appStore.markApplied(item.kind, item.id);
          appStore.setSaved(item.kind, item.id, true);
        } else {
          appStore.removeApplication(item.kind, item.id);
          if (answer === "later") appStore.setSaved(item.kind, item.id, true);
        }
        setBusy(false);
        setItem(null);
        if (answer === "yes")
          nav.go(`/${item.kind}/${item.id}/application-saved`);
        toast.show({
          message:
            answer === "yes"
              ? "Marked as applied"
              : answer === "later"
                ? "Saved for later"
                : "Answer saved",
        });
      },
      600 + Math.random() * 300,
    );
  };
  return (
    <BottomSheet
      open={!!item}
      onClose={() => {
        if (!busy) setItem(null);
      }}
      title="Did you apply?"
      description={
        item
          ? `${item.title} · ${item.kind === "grants" && item.id === "performance-grant" ? "Govt of Telangana" : item.issuer}`
          : ""
      }
    >
      <div className="application-answers">
        {[
          {
            id: "yes",
            label: "Yes, I applied",
            hint:
              item?.kind === "grants"
                ? "We'll move it to Applied"
                : "We'll mark it Applied in Saved",
          },
          {
            id: "later",
            label: "Not yet",
            hint:
              item?.kind === "grants"
                ? "Keep this grant in Saved for later"
                : "I may apply later",
          },
          { id: "no", label: "Decided against it", hint: "We'll stop asking" },
        ].map((option) => (
          <button
            key={option.id}
            className={answer === option.id ? "selected" : ""}
            aria-pressed={answer === option.id}
            onClick={() => setAnswer(option.id)}
            disabled={busy}
          >
            <span className="answer-radio" />
            <span>
              <strong>{option.label}</strong>
              <small>{option.hint}</small>
            </span>
          </button>
        ))}
      </div>
      <p className="opportunity-sheet-note">
        Only you see this. Change it any time.
      </p>
      <Button onClick={save} disabled={!answer} busy={busy}>
        Save answer
      </Button>
    </BottomSheet>
  );
}
