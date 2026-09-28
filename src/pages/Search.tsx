import { useEffect, useRef, useState } from "react";
import { Screen } from "../components/Screen";
import { Icon } from "../components/Icon";
import {
  CardSkeleton,
  ItemCard,
  SearchInput,
  Segments,
} from "../components/shared";
import {
  Button,
  Skeleton,
  useFirstVisitLoading,
} from "../components/primitives";
import { appStore, useAppStore } from "../state";
import { mentors, mentorMatchScore } from "../data/mentors";
import {
  challenges,
  grants,
  opportunityMatchScore,
} from "../data/opportunities";
import { initialRecentSearches, searchSuggestions } from "../data/onboarding";
import type { CatalogItem } from "../data/catalog";
import "./home.css";

function searchItems(query: string): CatalogItem[] {
  // Rank within each type, then interleave the strongest remaining item from
  // each type so a broad ask stays small and useful across Outpost.
  const groups = [
    mentors.map((item) => ({ item, score: mentorMatchScore(item, query) })),
    challenges
      .filter((item) => item.directory !== false)
      .map((item) => ({ item, score: opportunityMatchScore(item, query) })),
    grants.map((item) => ({ item, score: opportunityMatchScore(item, query) })),
  ].map((group) =>
    group
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3),
  );
  const results: CatalogItem[] = [];
  for (let rank = 0; rank < 3; rank += 1) {
    const round = groups.flatMap((group) => (group[rank] ? [group[rank]] : []));
    round.sort((a, b) => b.score - a.score);
    results.push(...round.map(({ item }) => item));
  }
  return results;
}

export function SearchPage() {
  const state = useAppStore();
  const [query, setQuery] = useState(state.drafts["outpost-search"] || "");
  const [settledQuery, setSettledQuery] = useState(query);
  const [segment, setSegment] = useState("all");
  const [loading, setLoading] = useState(false);
  const initialLoading = useFirstVisitLoading("/search");
  const queried = useRef(
    (() => {
      try {
        return (
          sessionStorage.getItem(
            "outpost:screen-visited:search-first-query",
          ) === "1"
        );
      } catch {
        return false;
      }
    })(),
  );
  const initial = useRef(true);
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      return JSON.parse(
        state.drafts["outpost-recent-searches"] ||
          JSON.stringify(initialRecentSearches),
      );
    } catch {
      return [...initialRecentSearches];
    }
  });
  useEffect(() => {
    let finish: number | undefined;
    if (initial.current) {
      initial.current = false;
      if (!query) return;
    }
    const timer = window.setTimeout(() => {
      setSettledQuery(query.trim());
      if (!query.trim()) {
        setLoading(false);
        return;
      }
      if (!queried.current) {
        queried.current = true;
        try {
          sessionStorage.setItem(
            "outpost:screen-visited:search-first-query",
            "1",
          );
        } catch {
          /* Local loading remains available. */
        }
        setLoading(true);
        finish = window.setTimeout(
          () => setLoading(false),
          250 + Math.random() * 200,
        );
      } else setLoading(false);
    }, 300);
    return () => {
      clearTimeout(timer);
      if (finish) clearTimeout(finish);
    };
  }, [query]);
  const changeQuery = (value: string) => {
    setQuery(value);
    appStore.setDraft("outpost-search", value);
  };
  const remember = (value: string) => {
    if (!value.trim()) return;
    const next = [
      value.trim(),
      ...recent.filter((item) => item !== value.trim()),
    ].slice(0, 5);
    setRecent(next);
    appStore.setDraft("outpost-recent-searches", JSON.stringify(next));
  };
  const results = settledQuery ? searchItems(settledQuery) : [];
  const visible = results.filter(
    (item) => segment === "all" || item.kind === segment,
  );
  return (
    <Screen
      title="Search Outpost"
      compactHeader
      className="outpost-search-screen"
    >
      <div className="outpost-search-content">
        <form
          className="outpost-search-form"
          onSubmit={(event) => {
            event.preventDefault();
            remember(query);
            (document.activeElement as HTMLElement)?.blur();
          }}
        >
          <SearchInput
            icon="sparkle"
            value={query}
            onChange={changeQuery}
            placeholder="Describe what you need"
          />
        </form>
        {settledQuery && (
          <>
            <p className="search-result-count">
              {results.length} matches across Outpost
            </p>
            <Segments
              options={[
                { value: "all", label: "All" },
                { value: "mentors", label: "Mentors" },
                { value: "challenges", label: "Challenges" },
                { value: "grants", label: "Grants" },
              ]}
              value={segment}
              onChange={setSegment}
            />
          </>
        )}
        {settledQuery ? (
          <div className="search-results" aria-busy={loading}>
            {loading ? (
              [0, 1, 2].map((n) => <CardSkeleton key={n} />)
            ) : (
              <>
                {visible.length === 0 && (
                  <p className="search-empty-results">
                    No close matches yet. Try a skill, sector or programme name.
                  </p>
                )}
                {visible.map((item) => (
                  <div
                    key={`${item.kind}-${item.id}`}
                    onClick={() => remember(settledQuery)}
                  >
                    <ItemCard item={item} />
                  </div>
                ))}
                <p className="search-guidance">
                  Suggestions to explore. Review each listing for eligibility
                  and availability.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    document
                      .querySelector<HTMLInputElement>(
                        ".outpost-search-form input",
                      )
                      ?.focus({ preventScroll: true });
                    document
                      .querySelector<HTMLInputElement>(
                        ".outpost-search-form input",
                      )
                      ?.select();
                  }}
                >
                  Refine your ask
                </Button>
              </>
            )}
          </div>
        ) : initialLoading ? (
          <div aria-hidden="true">
            <Skeleton className="line w40" />
            <Skeleton
              style={{ height: 174, borderRadius: 16, marginTop: 12 }}
            />
            <Skeleton className="line w40" style={{ marginTop: 28 }} />
            <Skeleton style={{ height: 124, borderRadius: 16 }} />
          </div>
        ) : (
          <>
            <section className="search-suggestions">
              <h2>Try asking</h2>
              <div className="card">
                {searchSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      changeQuery(suggestion);
                      remember(suggestion);
                    }}
                  >
                    <Icon name="search" size={18} />
                    <span>{suggestion}</span>
                    <Icon name="arrow" size={16} />
                  </button>
                ))}
              </div>
            </section>
            {recent.length > 0 && (
              <section className="search-recent">
                <div className="home-section-heading">
                  <h2>Recent</h2>
                  <button
                    onClick={() => {
                      setRecent([]);
                      appStore.setDraft("outpost-recent-searches", "[]");
                    }}
                  >
                    Clear
                  </button>
                </div>
                {recent.map((entry, i) => (
                  <button
                    key={entry}
                    onClick={() => {
                      changeQuery(entry);
                      remember(entry);
                    }}
                  >
                    <span className="recent-clock" aria-hidden="true">
                      ↶
                    </span>
                    <span className="grow">
                      <strong>{entry}</strong>
                      <small>
                        {initialRecentSearches.includes(entry)
                          ? i === 0
                            ? "2 days ago"
                            : "Last week"
                          : ""}
                      </small>
                    </span>
                    <Icon name="arrow" size={16} />
                  </button>
                ))}
              </section>
            )}
            <p className="search-guidance">
              One search for mentors, challenges and grants. Be specific about
              your stage or the help you need.
            </p>
          </>
        )}
      </div>
    </Screen>
  );
}
