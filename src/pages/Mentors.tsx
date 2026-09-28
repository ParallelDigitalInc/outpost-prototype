import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Screen } from "../components/Screen";
import {
  FilterButton,
  ItemCard,
  SaveButton,
  SearchInput,
  SearchLink,
  Segments,
} from "../components/shared";
import {
  BottomSheet,
  Button,
  FadeImage,
  Skeleton,
  useFirstVisitLoading,
} from "../components/primitives";
import { Icon } from "../components/Icon";
import { useAppNavigation } from "../navigation";
import { appStore, useAppStore } from "../state";
import {
  mentorGroups,
  mentorMatches,
  mentorSearchAttributes,
  mentorPrompts,
  mentors,
  shortMentorRole,
} from "../data/mentors";
import type { CatalogItem } from "../data/catalog";
import "./mentors.css";
import "./mentor-feed.css";

type Filters = {
  help: string[];
  sector: string[];
  stage: string[];
  location: string;
  week: boolean;
};
const emptyFilters: Filters = {
  help: [],
  sector: [],
  stage: [],
  location: "",
  week: false,
};
function loadFilters(): Filters {
  try {
    return (
      JSON.parse(appStore.getState().drafts["mentors:filters"] || "null") ||
      emptyFilters
    );
  } catch {
    return emptyFilters;
  }
}
function profileFilters(): Filters {
  const state = appStore.getState();
  const priorities = state.setup.answers.priorities.join(" ").toLowerCase();
  return {
    help: [
      /pric/.test(priorities) && "Pricing",
      /go.to.market|finding customers/.test(priorities) && "Go-to-market",
      /fundrais/.test(priorities) && "Fundraising",
      /hiring/.test(priorities) && "Hiring",
    ].filter((value): value is string => Boolean(value)),
    sector: [state.profile.sector].filter((value) =>
      ["Agritech", "Consumer", "B2B SaaS", "D2C"].includes(value),
    ),
    stage: [state.profile.stage].filter((value) =>
      ["Pre-seed", "Seed", "Series A", "Series B+"].includes(value),
    ),
    location: state.profile.city,
    week: false,
  };
}
function filtered(items: CatalogItem[], filters: Filters) {
  return items.filter((item) => {
    const attributes = mentorSearchAttributes[item.id];
    return (
      (!filters.help.length ||
        filters.help.every((value) => attributes.help.includes(value))) &&
      (!filters.sector.length ||
        filters.sector.some((value) => attributes.sectors.includes(value))) &&
      (!filters.stage.length ||
        filters.stage.some((value) => attributes.stages.includes(value))) &&
      (!filters.location ||
        attributes.location.toLowerCase() === filters.location.toLowerCase()) &&
      (!filters.week || mentorGroups[0].ids.includes(item.id))
    );
  });
}

export function MentorWhySheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { profile } = useAppStore();
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="Why these mentors"
      description="A starting point. You choose who fits."
    >
      <div className="mentor-explanation">
        <section>
          <Icon name="briefcase" />
          <div>
            <h3>Your startup</h3>
            <p>
              {profile.sector}, {profile.stage.toLowerCase()} stage, from your
              profile
            </p>
          </div>
        </section>
        <section>
          <Icon name="profile" />
          <div>
            <h3>Place</h3>
            <p>Mentors in or near {profile.city} come first</p>
          </div>
        </section>
        <section>
          <Icon name="search" />
          <div>
            <h3>What you search for</h3>
            <p>Used when you describe who you need</p>
          </div>
        </section>
        <p className="mentor-explanation__note">
          Ratings aren’t used to rank mentors. We use your profile and ask, then
          availability. Recommendations may miss experience that isn’t listed.
        </p>
        <Button onClick={onClose}>Got it</Button>
      </div>
    </BottomSheet>
  );
}

export function MentorRow({ item }: { item: CatalogItem }) {
  const { go } = useAppNavigation();
  return (
    <div className="mentor-row">
      <button
        className="mentor-row__main"
        onClick={() => go(`/mentors/${item.id}`)}
        aria-label={`View ${item.title}`}
      >
        <FadeImage
          src={`${import.meta.env.BASE_URL}${item.image}`}
          className={`mentor-row__photo ${item.id === "mohit-arora" ? "mentor-photo--mohit" : ""}`}
          style={{ objectPosition: item.imagePosition }}
          alt=""
        />
        <span className="mentor-row__copy">
          <strong>{item.title}</strong>
          <span>{shortMentorRole[item.id] || item.subtitle}</span>
          <em>Free {item.date}</em>
        </span>
      </button>
      <SaveButton kind="mentors" id={item.id} />
    </div>
  );
}

export function MentorsPage() {
  const location = useLocation();
  const state = useAppStore();
  const isSearch = location.pathname.endsWith("/ask");
  const [segment, setSegment] = useState(
    state.drafts["mentors:segment"] || "all",
  );
  const [ask, setAsk] = useState(state.drafts["mentors:search"] || "");
  const [query, setQuery] = useState(ask);
  const [filterOpen, setFilterOpen] = useState(false);
  const [whyOpen, setWhyOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(loadFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(filters);
  const [availability, setAvailability] = useState("all");
  const [feedCount, setFeedCount] = useState(() =>
    Math.max(
      10,
      Math.min(40, Number(state.drafts["mentors:feed-count"]) || 10),
    ),
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const feedSentinel = useRef<HTMLDivElement>(null);
  const [firstQueryLoading, setFirstQueryLoading] = useState(false);
  const searchedOnce = useRef(false);
  const loading = useFirstVisitLoading(isSearch ? "/mentors/ask" : "/mentors");
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(ask), 300);
    return () => clearTimeout(timer);
  }, [ask]);
  useEffect(() => {
    if (!query || searchedOnce.current) return;
    try {
      if (sessionStorage.getItem("outpost:screen-visited:mentor-first-query")) {
        searchedOnce.current = true;
        return;
      }
    } catch {
      /* The route keeps its in-memory visit flag. */
    }
    setFirstQueryLoading(true);
    const timer = window.setTimeout(
      () => {
        setFirstQueryLoading(false);
        searchedOnce.current = true;
        try {
          sessionStorage.setItem(
            "outpost:screen-visited:mentor-first-query",
            "1",
          );
        } catch {
          /* Keep the in-memory visit flag. */
        }
      },
      250 + Math.random() * 200,
    );
    return () => clearTimeout(timer);
  }, [query]);
  const selectedCount =
    filters.help.length +
    filters.sector.length +
    filters.stage.length +
    Number(filters.week) +
    Number(Boolean(filters.location));
  const canLoadMore =
    !isSearch &&
    segment === "all" &&
    selectedCount === 0 &&
    availability === "all" &&
    feedCount < 40;
  useEffect(() => {
    if (!canLoadMore || loading || loadingMore || !feedSentinel.current) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setLoadingMore(true);
        timer = window.setTimeout(() => {
          const next = Math.min(feedCount + 10, 40);
          setFeedCount(next);
          appStore.setDraft("mentors:feed-count", String(next));
          setLoadingMore(false);
        }, 300);
      },
      { rootMargin: "0px 0px 300px 0px" },
    );
    observer.observe(feedSentinel.current);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
      setLoadingMore(false);
    };
  }, [
    canLoadMore,
    loading,
    feedCount,
    isSearch,
    segment,
    selectedCount,
    availability,
  ]);
  const items = useMemo(
    () => filtered(isSearch ? mentorMatches(query) : mentors, filters),
    [isSearch, query, filters],
  );
  const filteredIds = new Set(items.map((item) => item.id));
  const saved = items.filter((item) => state.saved.mentors.includes(item.id));
  const booked = items.filter((item) =>
    state.bookings.some(
      (booking) =>
        booking.mentorId === item.id && booking.status !== "cancelled",
    ),
  );
  const filterResults = filtered(
    isSearch && query ? mentorMatches(query) : mentors,
    draftFilters,
  );
  const openFilters = () => {
    setDraftFilters(
      state.drafts["mentors:filters"] ? filters : profileFilters(),
    );
    setFilterOpen(true);
  };
  function changeAsk(value: string) {
    setAsk(value);
    appStore.setDraft("mentors:search", value);
  }
  function changeSegment(value: string) {
    setSegment(value);
    appStore.setDraft("mentors:segment", value);
  }
  function toggleFilter(group: "help" | "sector" | "stage", value: string) {
    setDraftFilters((previous) => ({
      ...previous,
      [group]: previous[group].includes(value)
        ? previous[group].filter((item) => item !== value)
        : [...previous[group], value],
    }));
  }
  const cards = (list: CatalogItem[]) => (
    <div className="mentor-cards">
      {list.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          loading={loading || firstQueryLoading}
        />
      ))}
    </div>
  );
  return (
    <Screen
      variant="inner"
      title="Mentors"
      right={!isSearch && <FilterButton onClick={openFilters} />}
      className="mentors-page"
    >
      <div className="mentor-page-content">
        {isSearch ? (
          <SearchInput
            value={ask}
            onChange={changeAsk}
            placeholder="Describe who you need"
          />
        ) : (
          <SearchLink
            to="/mentors/ask"
            placeholder="Try: ‘someone who raised a seed round’"
          />
        )}
        {!isSearch && (
          <Segments
            value={segment}
            onChange={changeSegment}
            options={[
              { value: "all", label: "All" },
              {
                value: "saved",
                label: "Saved",
                count: state.saved.mentors.length,
              },
              { value: "booked", label: "Booked before" },
            ]}
          />
        )}
        {isSearch ? (
          !query ? (
            <div className="mentor-search-prompts">
              <h2>Try asking</h2>
              {mentorPrompts.map((prompt) => (
                <button key={prompt} onClick={() => changeAsk(prompt)}>
                  <Icon name="search" size={18} />
                  {prompt}
                  <Icon name="arrow" size={18} />
                </button>
              ))}
              {state.drafts["mentors:recent-cleared"] !== "1" && (
                <>
                  <div className="mentor-section-head">
                    <h2>Recent</h2>
                    <button
                      className="text-button"
                      onClick={() =>
                        appStore.setDraft("mentors:recent-cleared", "1")
                      }
                    >
                      Clear
                    </button>
                  </div>
                  {[
                    "Pricing for a new product",
                    "Finding our first customers",
                  ].map((recent, index) => (
                    <button key={recent} onClick={() => changeAsk(recent)}>
                      <span>
                        {recent}
                        <small>{index ? "Last week" : "2 days ago"}</small>
                      </span>
                      <Icon name="arrow" size={18} />
                    </button>
                  ))}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="mentor-result-head">
                <strong>
                  {items.length} {items.length === 1 ? "mentor" : "mentors"}
                </strong>
                <button className="mentor-outline" onClick={openFilters}>
                  <Icon name="filters" size={16} />
                  Filters{selectedCount > 0 && <span>{selectedCount}</span>}
                </button>
                <span>Best match</span>
              </div>
              {cards(items)}
              {!items.length && (
                <div className="mentor-inline-empty">
                  <p>No mentors match these filters.</p>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setFilters(emptyFilters);
                      appStore.setDraft(
                        "mentors:filters",
                        JSON.stringify(emptyFilters),
                      );
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              )}
              <button
                className="mentor-why-link"
                onClick={() => setWhyOpen(true)}
              >
                <Icon name="sparkle" size={16} />
                Why these mentors?
              </button>
            </>
          )
        ) : segment === "all" ? (
          <>
            <section className="mentor-top-matches">
              <div className="mentor-section-head">
                <div>
                  <h2>Top matches for {state.profile.startupName}</h2>
                  <p>
                    {state.profile.sector} · {state.profile.stage.toLowerCase()}{" "}
                    · {state.profile.city}
                  </p>
                </div>
                <button
                  className="text-button mentor-match-why"
                  onClick={() => setWhyOpen(true)}
                >
                  <Icon name="sparkle" size={11} />
                  Why these?
                </button>
              </div>
              {cards(mentors.slice(0, 2))}
            </section>
            <section className="mentor-directory">
              <div className="mentor-section-head">
                <h2>
                  All mentors{" "}
                  <span>{selectedCount ? items.length : "148"}</span>
                </h2>
                <select
                  className="mentor-availability"
                  aria-label="Availability"
                  value={availability}
                  onChange={(event) => setAvailability(event.target.value)}
                >
                  <option value="all">Availability</option>
                  <option value="This week">This week</option>
                  <option value="Next week">Next week</option>
                  <option value="Later">Later</option>
                </select>
              </div>
              {mentorGroups
                .filter(
                  (group) =>
                    availability === "all" || availability === group.title,
                )
                .map((group) => {
                  const groupItems = group.ids
                    .map((id) => mentors.find((item) => item.id === id)!)
                    .filter((item) => filteredIds.has(item.id));
                  if (!groupItems.length) return null;
                  return (
                    <section className="mentor-group" key={group.title}>
                      <div className="mentor-group__heading">
                        <h3>{group.title}</h3>
                        <span>{group.dates}</span>
                      </div>
                      <div className="mentor-list">
                        {groupItems.map((item) =>
                          loading ? (
                            <div className="mentor-row" key={item.id}>
                              <Skeleton
                                style={{
                                  width: 48,
                                  height: 54,
                                  borderRadius: 8,
                                }}
                              />
                              <div className="mentor-row__skeleton">
                                <Skeleton
                                  style={{ width: "80%", height: 16 }}
                                />
                                <Skeleton
                                  style={{ width: "100%", height: 12 }}
                                />
                                <Skeleton
                                  style={{ width: "65%", height: 12 }}
                                />
                              </div>
                              <Skeleton
                                style={{
                                  width: 62,
                                  height: 32,
                                  borderRadius: 16,
                                }}
                              />
                            </div>
                          ) : (
                            <MentorRow key={item.id} item={item} />
                          ),
                        )}
                      </div>
                    </section>
                  );
                })}
              {selectedCount > 0 && !items.length && (
                <div className="mentor-inline-empty">
                  <p>No mentors match these filters.</p>
                  <button className="text-button" onClick={openFilters}>
                    Refine filters
                  </button>
                </div>
              )}
              {selectedCount === 0 && availability === "all" && (
                <>
                  {feedCount > 10 && (
                    <div className="mentor-list mentor-feed-continuation">
                      {Array.from({ length: feedCount - 10 }, (_, index) => (
                        <MentorRow
                          key={index}
                          item={mentors[index % mentors.length]}
                        />
                      ))}
                    </div>
                  )}
                  {loadingMore && (
                    <div
                      className="mentor-list mentor-feed-loading"
                      role="status"
                      aria-label="Loading more mentors"
                    >
                      {[0, 1, 2].map((index) => (
                        <div className="mentor-row" key={index}>
                          <Skeleton
                            style={{ width: 48, height: 54, borderRadius: 10 }}
                          />
                          <div className="mentor-row__skeleton">
                            <Skeleton style={{ width: "75%", height: 16 }} />
                            <Skeleton style={{ width: "100%", height: 12 }} />
                            <Skeleton style={{ width: "60%", height: 12 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {feedCount < 40 ? (
                    <div
                      ref={feedSentinel}
                      className="mentor-feed-sentinel"
                      aria-hidden="true"
                    />
                  ) : (
                    <p className="mentor-feed-end">
                      That's everyone free this month
                    </p>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          <section className="mentor-saved-list">
            <div className="mentor-section-head">
              <strong>
                {(segment === "saved" ? saved : booked).length} mentors
              </strong>
              <span>
                {segment === "saved" ? "Recently saved" : "Last session ↓"}
              </span>
            </div>
            {cards(segment === "saved" ? [...saved].reverse() : booked)}
            {!(segment === "saved" ? saved : booked).length && (
              <div className="mentor-inline-empty">
                <p>
                  {segment === "saved"
                    ? "Save a mentor to find them here."
                    : "Your booked mentors will appear here."}
                </p>
                <Button
                  variant="secondary"
                  onClick={() => changeSegment("all")}
                >
                  All mentors
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
      <MentorWhySheet open={whyOpen} onClose={() => setWhyOpen(false)} />
      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
      >
        <div className="mentor-filters">
          {(
            [
              {
                title: "Help with",
                key: "help",
                options: ["Pricing", "Go-to-market", "Fundraising", "Hiring"],
              },
              {
                title: "Sector",
                key: "sector",
                options: ["Agritech", "Consumer", "B2B SaaS", "D2C"],
              },
              {
                title: "Stage they’ve worked at",
                key: "stage",
                options: ["Pre-seed", "Seed", "Series A", "Series B+"],
              },
            ] as const
          ).map((group) => (
            <section key={group.key}>
              <h3>{group.title}</h3>
              <div className="mentor-filter-chips">
                {group.options.map((option) => (
                  <button
                    key={option}
                    className={
                      draftFilters[group.key].includes(option) ? "selected" : ""
                    }
                    aria-pressed={draftFilters[group.key].includes(option)}
                    onClick={() => toggleFilter(group.key, option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </section>
          ))}
          <label className="mentor-filter-line">
            <strong>Location</strong>
            <select
              aria-label="Location"
              value={draftFilters.location}
              onChange={(event) =>
                setDraftFilters({
                  ...draftFilters,
                  location: event.target.value,
                })
              }
            >
              <option value="">All locations</option>
              {Array.from(
                new Set([
                  state.profile.city,
                  "Hyderabad",
                  "Bengaluru",
                  "Mumbai",
                  "Delhi NCR",
                  "Chennai",
                  "Pune",
                ]),
              )
                .filter(Boolean)
                .map((city) => (
                  <option key={city}>{city}</option>
                ))}
            </select>
          </label>
          <label className="mentor-filter-line">
            <strong>Free this week only</strong>
            <input
              type="checkbox"
              role="switch"
              checked={draftFilters.week}
              onChange={(event) =>
                setDraftFilters({ ...draftFilters, week: event.target.checked })
              }
            />
          </label>
          <div className="mentor-filter-actions">
            <button
              className="text-button"
              onClick={() => setDraftFilters(emptyFilters)}
            >
              Reset
            </button>
            <Button
              onClick={() => {
                setFilters(draftFilters);
                appStore.setDraft(
                  "mentors:filters",
                  JSON.stringify(draftFilters),
                );
                setFilterOpen(false);
              }}
            >
              Show {filterResults.length} mentors
            </Button>
          </div>
        </div>
      </BottomSheet>
    </Screen>
  );
}
