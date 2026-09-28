import { useState } from "react";
import { Screen } from "../components/Screen";
import { ItemCard, Segments, CardSkeleton } from "../components/shared";
import {
  Button,
  BottomSheet,
  useFirstVisitLoading,
} from "../components/primitives";
import { useAppStore, type SavedKind } from "../state";
import { mentors, shortMentorRole } from "../data/mentors";
import { challenges, grants } from "../data/opportunities";
import { useAppNavigation } from "../navigation";
import { Icon } from "../components/Icon";
export function SavedPage() {
  const state = useAppStore();
  const nav = useAppNavigation();
  const [segment, setSegment] = useState("all");
  const [filter, setFilter] = useState(false);
  const [sort, setSort] = useState("Recently saved");
  const loading = useFirstVisitLoading("/saved");
  const sources = { mentors, challenges, grants };
  const count = Object.values(state.saved).reduce(
    (n, ids) => n + ids.length,
    0,
  );
  return (
    <Screen
      className="saved-page"
      title="Saved"
      subtitle={
        count
          ? `${count} ${count === 1 ? "item" : "items"} worth coming back to`
          : "Your shortlist, all in one place."
      }
    >
      <div className="content-body saved-content">
        <Segments
          value={segment}
          onChange={setSegment}
          options={[
            { value: "all", label: "All" },
            {
              value: "mentors",
              label: "Mentors",
              count: state.saved.mentors.length,
            },
            {
              value: "challenges",
              label: "Challenges",
              count: state.saved.challenges.length,
            },
            {
              value: "grants",
              label: "Grants",
              count: state.saved.grants.length,
            },
          ]}
        />
        {loading ? (
          <div className="card-stack">
            <CardSkeleton compact />
            <CardSkeleton compact />
          </div>
        ) : count === 0 ? (
          <div className="saved-empty">
            <span className="empty-bookmark">
              <Icon name="saved" size={32} />
            </span>
            <h2>Your shortlist starts here</h2>
            <p>
              Save mentors, challenges and grants as you explore. Find them here
              whenever you’re ready.
            </p>
            <Button onClick={() => nav.switchTab("home")}>
              Explore opportunities
            </Button>
          </div>
        ) : (
          <>
            <div className="section-heading">
              <h2>Your shortlist</h2>
              <button className="saved-sort" onClick={() => setFilter(true)}>
                {sort} <Icon name="chevron" size={14} />
              </button>
            </div>
            {(["mentors", "challenges", "grants"] as SavedKind[])
              .filter((kind) => segment === "all" || kind === segment)
              .map((kind) => {
                const ids = [...state.saved[kind]].reverse();
                const items = ids
                  .map((id) => sources[kind].find((item) => item.id === id))
                  .filter((item) => item !== undefined);
                if (sort === "Name · A to Z")
                  items.sort((a, b) => a.title.localeCompare(b.title));
                if (sort === "Closing soon")
                  items.sort(
                    (a, b) =>
                      (Date.parse(a.date + " 2026") || Infinity) -
                      (Date.parse(b.date + " 2026") || Infinity),
                  );
                return items.length ? (
                  <section key={kind}>
                    <h3 className="saved-group-title">
                      {kind[0].toUpperCase() + kind.slice(1)}{" "}
                      <span>{items.length}</span>
                    </h3>
                    <div className="card saved-list">
                      {items.map((item) => {
                        const displayItem = {
                          ...item,
                          subtitle:
                            item.kind === "mentors"
                              ? shortMentorRole[item.id] || item.subtitle
                              : item.id === "honda-innovation"
                                ? "Honda · Up to ₹40L"
                                : item.id === "kotak-bizlabs"
                                  ? "Kotak × T-Hub · ₹30L"
                                  : item.subtitle,
                          dateLabel:
                            item.kind !== "mentors" &&
                            item.dateLabel.endsWith("by")
                              ? "Closes"
                              : item.dateLabel,
                        };
                        return (
                          <ItemCard key={item.id} item={displayItem} compact />
                        );
                      })}
                    </div>
                  </section>
                ) : segment !== "all" ? (
                  <Button
                    key={kind}
                    variant="secondary"
                    onClick={() => nav.go("/" + kind)}
                  >
                    Explore opportunities
                  </Button>
                ) : null;
              })}
          </>
        )}
      </div>
      <BottomSheet open={filter} onClose={() => setFilter(false)} title="Saved">
        <div className="sheet-section">
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
        </div>
        <div className="sheet-section">
          {["Recently saved", "Name · A to Z", "Closing soon"].map((option) => (
            <button
              key={option}
              className={`option-chip ${sort === option ? "selected" : ""}`}
              aria-pressed={sort === option}
              onClick={() => setSort(option)}
            >
              {option}
            </button>
          ))}
        </div>
        <Button onClick={() => setFilter(false)}>Show results</Button>
      </BottomSheet>
    </Screen>
  );
}
