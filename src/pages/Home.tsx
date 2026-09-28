import { useEffect, useState } from "react";
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
  ItemCard,
  SearchLink,
  asset,
  CardSkeleton,
} from "../components/shared";
import {
  appStore,
  setupCompletedCount,
  useAppStore,
  useDemoClock,
} from "../state";
import { useAppNavigation } from "../navigation";
import { setupSteps, popularReasons } from "../data/onboarding";
import { mentors } from "../data/mentors";
import { challenges, grants } from "../data/opportunities";
import { formatDemoDate, minutesUntil } from "../data/clock";
import { canJoinBooking } from "../data/bookingRules";
import type { CatalogItem } from "../data/catalog";
import "./home.css";

const catalog = () => [...mentors, ...challenges, ...grants];
const firstUnanswered = () => {
  const answers = appStore.getState().setup.answers;
  const step = setupSteps.findIndex(({ key }) =>
    key === "priorities" ? answers.priorities.length === 0 : !answers[key],
  );
  return step < 0 ? 4 : step;
};

function SetupCard() {
  const state = useAppStore();
  const nav = useAppNavigation();
  const completed = setupCompletedCount(state.setup.answers);
  const [step, setStep] = useState(firstUnanswered);
  const [done, setDone] = useState(false);
  const question = setupSteps[step];
  const [other, setOther] = useState(false);
  const [value, setValue] = useState("");
  const [priorities, setPriorities] = useState<string[]>([]);
  useEffect(() => {
    const answer = appStore.getState().setup.answers[question.key];
    const draft = appStore.getState().drafts[`setup-${question.key}`];
    setValue(typeof answer === "string" ? answer : draft || "");
    setOther(
      typeof answer === "string" &&
        question.options.length > 0 &&
        !(question.options as readonly string[]).includes(answer),
    );
    if (question.key === "priorities") {
      try {
        setPriorities(
          [...state.setup.answers.priorities].length
            ? [...state.setup.answers.priorities]
            : JSON.parse(draft || "[]"),
        );
      } catch {
        setPriorities([]);
      }
    }
  }, [step, question.key]);
  if (completed === 5 && !done) return null;
  if (done)
    return (
      <div className="card setup-done">
        <span className="setup-done-icon">
          <Icon name="check" size={18} />
        </span>
        <div>
          <strong>You’re set, {state.profile.startupName}</strong>
          <small>
            {state.profile.sector} · {state.profile.stage} ·{" "}
            {state.profile.city}
          </small>
        </div>
        <button onClick={() => nav.switchTab("profile")}>Edit</button>
      </div>
    );
  const saveAnswer = (answer: string | string[]) => {
    if (question.key === "priorities")
      appStore.setSetupAnswer("priorities", answer as string[]);
    else appStore.setSetupAnswer(question.key, answer as string);
    appStore.clearDraft(`setup-${question.key}`);
    if (step === 4) {
      appStore.dismissSetup(false);
      setDone(true);
    } else setStep(step + 1);
  };
  if (state.setup.dismissed)
    return (
      <section className="home-section">
        <h2>Start here</h2>
        <button
          className="card setup-resume"
          onClick={() => {
            setStep(firstUnanswered());
            appStore.dismissSetup(false);
          }}
        >
          <span className="setup-progress-number">{completed}/5</span>
          <span className="grow">
            <strong>Finish personalising</strong>
            <small>
              Next:{" "}
              {setupSteps[firstUnanswered()].title.charAt(0).toLowerCase() +
                setupSteps[firstUnanswered()].title.slice(1)}
            </small>
          </span>
          <span>Resume</span>
        </button>
      </section>
    );
  return (
    <section className="home-section" aria-label="Personalise your experience">
      <h2>Start here</h2>
      <div className="card setup-card">
        <div className="setup-card-heading">
          <span className="setup-mark">
            <Icon name="sparkle" size={22} />
          </span>
          <div className="grow">
            <strong>Help us personalise</strong>
            <small>5 quick questions · 1 min</small>
          </div>
          <button
            className="setup-later"
            onClick={() => appStore.dismissSetup()}
          >
            Later
          </button>
        </div>
        <div className="setup-card-body">
          <div className="setup-progress" aria-label={`${step + 1} of 5`}>
            <div>
              {setupSteps.map((_, i) => (
                <span key={i} className={i <= step ? "is-complete" : ""} />
              ))}
            </div>
            <span>{step + 1} of 5</span>
          </div>
          <h3>{question.title}</h3>
          {question.key === "priorities" && (
            <p className="setup-hint">
              {priorities.length === 3
                ? "3 of 3 picked · tap one to swap"
                : priorities.length
                  ? `Pick up to 3 · ${priorities.length} picked`
                  : "Pick up to 3"}
            </p>
          )}
          {question.options.length > 0 && (
            <div className="setup-options">
              {question.options.map((option) => {
                const custom =
                  option === "Something else" || option === "Somewhere else";
                const selected =
                  question.key === "priorities"
                    ? priorities.includes(option)
                    : custom
                      ? other
                      : value === option && !other;
                return (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={selected}
                    className={`${selected ? "is-selected" : ""} ${custom ? "custom-option" : ""}`}
                    disabled={
                      question.key === "priorities" &&
                      priorities.length >= 3 &&
                      !selected
                    }
                    onClick={() => {
                      if (question.key === "priorities") {
                        const next = selected
                          ? priorities.filter((p) => p !== option)
                          : [...priorities, option];
                        setPriorities(next);
                        appStore.setDraft(
                          "setup-priorities",
                          JSON.stringify(next),
                        );
                      } else if (custom) {
                        setOther(true);
                        setValue("");
                      } else saveAnswer(option);
                    }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          )}
          {(question.key === "startupName" || other) && (
            <input
              className="setup-input"
              aria-label={
                question.key === "startupName"
                  ? "Startup name"
                  : `Type your ${question.key}`
              }
              placeholder={
                question.key === "startupName"
                  ? "Startup name"
                  : `Type your ${question.key}`
              }
              autoComplete={
                question.key === "city" ? "address-level2" : "organization"
              }
              maxLength={question.key === "startupName" ? 50 : 60}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                appStore.setDraft(`setup-${question.key}`, event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && value.trim()) {
                  event.preventDefault();
                  saveAnswer(value.trim());
                }
              }}
            />
          )}
          {(step > 0 || other) && (
            <div className="setup-controls">
              {step > 0 && (
                <button
                  className="setup-back"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </button>
              )}
              {(question.key === "startupName" ||
                question.key === "priorities" ||
                other) && (
                <Button
                  disabled={
                    question.key === "priorities"
                      ? priorities.length === 0
                      : !value.trim()
                  }
                  onClick={() =>
                    saveAnswer(
                      question.key === "priorities" ? priorities : value.trim(),
                    )
                  }
                >
                  {step === 4 ? "Finish" : "Next"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function DiscoverSymbol({ kind }: { kind: CatalogItem["kind"] }) {
  return (
    <span className={`discover-art discover-art--${kind}`} aria-hidden="true">
      {kind === "mentors"
        ? [
            "priya-sharma.webp",
            "siva-kumar-pasupathi.webp",
            "anjali-kapoor.webp",
          ].map((name) => (
            <FadeImage key={name} src={asset(`images/${name}`)} alt="" />
          ))
        : kind === "challenges"
          ? [
              "honda-logo.webp",
              "challenge-logo-2.svg",
              "challenge-logo-3.webp",
            ].map((name) => (
              <span key={name}>
                <img src={asset(`images/${name}`)} alt="" />
              </span>
            ))
          : ["₹20L", "₹50L", "+11"].map((label) => (
              <span key={label}>{label}</span>
            ))}
    </span>
  );
}

function HomeSavedCard({ item }: { item: CatalogItem }) {
  const nav = useAppNavigation();
  const { show } = useToast();
  const opportunity = [...challenges, ...grants].find(
    (entry) => entry.kind === item.kind && entry.id === item.id,
  );
  const brandColor =
    item.issuer === "Honda" ? "#CC0000" : opportunity?.tileColor || "#F4F5F2";
  return (
    <article className="card home-saved-mini">
      <button
        className="home-saved-open"
        onClick={() => nav.go(`/${item.kind}/${item.id}`)}
      >
        <span
          className={`home-saved-art home-saved-art--${item.kind}`}
          style={
            item.kind === "challenges"
              ? { backgroundColor: brandColor }
              : undefined
          }
        >
          {item.kind === "grants" ? (
            <span className="home-mini-amount">
              <small>Up to</small>
              <strong>{opportunity?.shortAmount || item.amount}</strong>
            </span>
          ) : item.image ? (
            <FadeImage
              src={asset(
                item.kind === "challenges" && item.issuer === "Honda"
                  ? "images/honda-logo.webp"
                  : item.image,
              )}
              alt=""
              className="home-mini-image"
              style={{ objectPosition: item.imagePosition }}
            />
          ) : (
            <span className="home-mini-brand">{item.issuer || item.title}</span>
          )}
        </span>
        <span className="home-saved-copy">
          <strong>{item.title}</strong>
          <small>
            {item.kind === "mentors"
              ? "Mentor"
              : item.kind === "challenges"
                ? "Challenge"
                : "Grant"}{" "}
            · {item.issuer || item.subtitle.split(", ").at(-1)}
          </small>
          <span className="date-label">
            {item.dateLabel === "Next free" ? "Free" : item.dateLabel}{" "}
            {item.date}
          </span>
        </span>
      </button>
      <button
        className="home-saved-bookmark"
        aria-label={`Unsave ${item.title}`}
        aria-pressed="true"
        onClick={() => {
          appStore.setSaved(item.kind, item.id, false);
          show({
            message: "Removed from Saved",
            actionLabel: "Undo",
            onAction: () => appStore.setSaved(item.kind, item.id, true),
          });
        }}
      >
        <span>
          <Icon name="saved" size={13} filled />
        </span>
      </button>
    </article>
  );
}

function HomeSavedEmpty() {
  const nav = useAppNavigation();
  return (
    <div className="card home-saved-empty">
      <div className="home-saved-empty-copy">
        <h3>Build your shortlist</h3>
        <p>Save the mentors, challenges and grants you want to come back to.</p>
      </div>
      <div className="home-saved-ribbon" aria-label="0 saved">
        <strong>0</strong>
        <small>saved</small>
      </div>
      <div className="home-saved-browse">
        <button onClick={() => nav.go("/mentors")}>
          <FadeImage src={asset("images/kishore-varkey.webp")} alt="" />
          Mentors
        </button>
        <button onClick={() => nav.go("/challenges")}>
          <span className="home-saved-challenge-symbol">
            <img src={asset("images/honda-logo.webp")} alt="" />
          </span>
          Challenges
        </button>
        <button onClick={() => nav.go("/grants")}>
          <span className="home-saved-grant-symbol">₹</span>Grants
        </button>
      </div>
    </div>
  );
}

export function HomePage() {
  const nav = useAppNavigation();
  const state = useAppStore();
  const now = useDemoClock(1000);
  const loading = useFirstVisitLoading("/home");
  const [why, setWhy] = useState(false);
  const [sessionOptions, setSessionOptions] = useState(false);
  const complete = setupCompletedCount(state.setup.answers) === 5;
  const saved = catalog().filter((item) =>
    state.saved[item.kind].includes(item.id),
  );
  const upcoming = state.bookings.find(
    (b) => b.status === "waiting" || b.status === "confirmed",
  );
  const bookedMentor =
    upcoming && mentors.find((m) => m.id === upcoming.mentorId);
  const featuredMentors = mentors
    .filter((m) => ["kishore-varkey", "priya-sharma"].includes(m.id))
    .slice(0, 2);
  const honda = challenges.find(
    (c) => c.id.includes("honda") || c.title === "Innovation Challenge 2.0",
  );
  const seed = grants.find((g) => g.title === "Seed Fund Scheme");
  const groups = [
    {
      kind: "mentors",
      title: "Mentors",
      items: featuredMentors.map((item) => ({
        ...item,
        why: complete ? item.why : popularReasons[item.id],
      })),
    },
    {
      kind: "challenges",
      title: "Challenges",
      items: honda
        ? [
            {
              ...honda,
              subtitle: "Honda · up to ₹40L per startup",
              why: complete
                ? "Open to seed-stage startups"
                : popularReasons.challenges,
              dateLabel: "Apply by",
              date: "Fri 2 Oct",
            },
          ]
        : [],
    },
    {
      kind: "grants",
      title: "Grants",
      items: seed
        ? [
            {
              ...seed,
              why: complete
                ? "For DPIIT-recognised startups"
                : popularReasons.grants,
              dateLabel: "Apply",
              date: "Rolling intake",
            },
          ]
        : [],
    },
  ];
  return (
    <Screen variant="home" title="Home" className="home-screen">
      <div className="home-greeting">
        <h1>Good evening, {state.profile.name.split(" ")[0]}</h1>
        <SearchLink
          to="/search"
          placeholder="Try: ‘corporate challenges in fintech’"
        />
      </div>
      <div className="home-content" aria-busy={loading}>
        {loading ? (
          <HomeSkeleton hasSetup={!complete} hasSession={Boolean(upcoming)} />
        ) : (
          <>
            <SetupCard />
            {upcoming && bookedMentor && (
              <section className="home-section">
                <div className="home-section-heading">
                  <h2>Up next</h2>
                  <button onClick={() => nav.switchTab("sessions")}>
                    All sessions <Icon name="chevron" size={14} />
                  </button>
                </div>
                <div className="card home-session">
                  <div className="home-session-heading">
                    <button
                      className="home-session-main"
                      onClick={() => nav.go(`/sessions/${upcoming.id}`)}
                    >
                      <span className="home-session-date">
                        <small>
                          {formatDemoDate(upcoming.startsAt, {
                            weekday: "short",
                          }).toUpperCase()}
                        </small>
                        <strong>
                          {formatDemoDate(upcoming.startsAt, {
                            day: "numeric",
                          })}
                        </strong>
                      </span>
                      <span className="grow">
                        <strong>
                          {formatDemoDate(upcoming.startsAt, {
                            hour: "numeric",
                            minute: "2-digit",
                          }).replace(/\s?[ap]m$/i, "")}{" "}
                          –{" "}
                          {formatDemoDate(upcoming.endsAt, {
                            hour: "numeric",
                            minute: "2-digit",
                          }).toUpperCase()}
                        </strong>
                        <span className="home-session-mentor">
                          <FadeImage src={asset(bookedMentor.image!)} alt="" />
                          <span>{bookedMentor.title}</span>
                        </span>
                      </span>
                    </button>
                    <button
                      className="home-session-more"
                      aria-label="Session options"
                      onClick={() => setSessionOptions(true)}
                    >
                      <span>
                        <Icon name="ellipsis" size={16} />
                      </span>
                    </button>
                  </div>
                  <div className="home-session-footer">
                    <span
                      className={`home-session-status ${upcoming.status === "waiting" ? "is-waiting" : ""}`}
                    >
                      <i aria-hidden="true" />
                      {upcoming.status === "waiting"
                        ? `Waiting for ${bookedMentor.title.replace(/^Dr\. /, "").split(" ")[0]}`
                        : canJoinBooking(upcoming, now)
                          ? minutesUntil(upcoming.startsAt, now) > 0
                            ? `Starts in ${minutesUntil(upcoming.startsAt, now)} min`
                            : "Join call available"
                          : `Confirmed · ${formatDemoDate(upcoming.startsAt, { weekday: "short", day: "numeric", month: "short" }).replace(",", "").replace("Sept", "Sep")}`}
                    </span>
                    {canJoinBooking(upcoming, now) && (
                      <Button
                        onClick={() => nav.go(`/sessions/${upcoming.id}`)}
                      >
                        <Icon name="video" size={15} />
                        Join call
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            )}
            <section className="home-section">
              <h2>Discover</h2>
              <div className="card home-discover">
                {(
                  [
                    ["mentors", "Mentors", "148 people"],
                    ["challenges", "Challenges", "6 opportunities"],
                    ["grants", "Grants", "13 schemes"],
                  ] as const
                ).map(([kind, title, count]) => (
                  <button
                    className="home-discover-row"
                    key={kind}
                    onClick={() => nav.go(`/${kind}`)}
                  >
                    <DiscoverSymbol kind={kind} />
                    <span className="grow">
                      <strong>{title}</strong>
                      <small>{count}</small>
                    </span>
                    <span className="home-discover-arrow">
                      <Icon name="chevron" size={14} />
                    </span>
                  </button>
                ))}
              </div>
            </section>
            <section
              className="home-section home-saved-section"
              aria-label="Saved shortlist"
            >
              <div className="home-section-heading">
                <h2>Saved</h2>
                {saved.length ? (
                  <button
                    className="home-saved-see-all"
                    onClick={() => nav.switchTab("saved")}
                  >
                    <span>
                      See all {saved.length}
                      <Icon name="chevron" size={14} />
                    </span>
                  </button>
                ) : (
                  <span className="home-saved-nothing">Nothing yet</span>
                )}
              </div>
              {saved.length ? (
                <div className="home-saved-carousel">
                  {saved.map((item) => (
                    <HomeSavedCard
                      item={item}
                      key={`${item.kind}-${item.id}`}
                    />
                  ))}
                </div>
              ) : (
                <HomeSavedEmpty />
              )}
            </section>
            <section className="home-section home-recommendations">
              <div className="home-section-heading">
                <h2>
                  {complete
                    ? `Top matches for ${state.profile.startupName}`
                    : "Popular with founders"}
                </h2>
                {complete && (
                  <button
                    className="home-why-link"
                    onClick={() => setWhy(true)}
                  >
                    <Icon name="sparkle" size={14} />
                    <span>Why these?</span>
                  </button>
                )}
              </div>
              {groups.map(
                (group) =>
                  group.items.length > 0 && (
                    <div className="home-recommendation-group" key={group.kind}>
                      <div className="home-group-heading">
                        <h3>{group.title}</h3>
                        <button onClick={() => nav.go(`/${group.kind}`)}>
                          More {group.kind} <Icon name="chevron" size={14} />
                        </button>
                      </div>
                      <div className="card-stack">
                        {group.items.map((item) => (
                          <ItemCard item={item} key={item.id} />
                        ))}
                      </div>
                    </div>
                  ),
              )}
            </section>
          </>
        )}
      </div>
      <BottomSheet
        open={sessionOptions}
        onClose={() => setSessionOptions(false)}
        title="Your session"
      >
        <Button
          onClick={() => {
            setSessionOptions(false);
            if (upcoming) nav.go(`/sessions/${upcoming.id}`);
          }}
        >
          View session
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setSessionOptions(false);
            nav.switchTab("sessions");
          }}
        >
          All sessions
        </Button>
      </BottomSheet>
      <BottomSheet
        open={why}
        onClose={() => setWhy(false)}
        title="Why these matches"
        description="A starting point for your next step."
      >
        <div className="card home-why-card">
          {[
            [
              "leaf",
              "Your startup",
              `${state.profile.sector}, ${state.profile.stage.toLowerCase()} stage, from your profile`,
            ],
            [
              "briefcase",
              "Your needs",
              `${state.setup.answers.priorities.join(" and ") || "Go-to-market and fundraising"}, from your profile`,
            ],
            [
              "sparkle",
              "Available information",
              "Mentor profiles and programme listings",
            ],
          ].map(([icon, title, description]) => (
            <div key={title}>
              <span>
                <Icon
                  name={icon as "leaf" | "briefcase" | "sparkle"}
                  size={16}
                />
              </span>
              <div>
                <strong>{title}</strong>
                <small>{description}</small>
              </div>
            </div>
          ))}
        </div>
        <p className="home-why-note">
          Suggestions don’t confirm eligibility or availability. Check each
          listing before applying or booking. Ratings aren’t used to rank
          mentors.
        </p>
        <Button onClick={() => setWhy(false)}>Got it</Button>
      </BottomSheet>
    </Screen>
  );
}

function HomeSkeleton({
  hasSetup,
  hasSession,
}: {
  hasSetup: boolean;
  hasSession: boolean;
}) {
  return (
    <div className="home-skeleton" aria-hidden="true">
      {hasSetup && (
        <section className="home-section">
          <Skeleton className="line w40" />
          <div className="card setup-card">
            <div className="setup-card-heading">
              <Skeleton style={{ width: 52, height: 56, borderRadius: 12 }} />
              <div className="grow">
                <Skeleton className="line w70" />
                <Skeleton className="line short w90" />
              </div>
              <Skeleton style={{ width: 36, height: 16 }} />
            </div>
            <Skeleton className="line" />
            <Skeleton className="line w90" />
            <div className="setup-options">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton
                  key={i}
                  style={{ width: 82, height: 44, borderRadius: 8 }}
                />
              ))}
            </div>
          </div>
        </section>
      )}
      {hasSession && (
        <section className="home-section">
          <Skeleton className="line w40" />
          <Skeleton style={{ height: 150, borderRadius: 16 }} />
        </section>
      )}
      <section className="home-section">
        <Skeleton className="line w40" />
        <div className="card home-discover">
          {[0, 1, 2].map((i) => (
            <div className="home-discover-row" key={i}>
              <Skeleton style={{ width: 92, height: 38, borderRadius: 20 }} />
              <div className="grow">
                <Skeleton className="line w60" />
                <Skeleton className="line short w40" />
              </div>
              <Skeleton style={{ width: 32, height: 32, borderRadius: 16 }} />
            </div>
          ))}
        </div>
      </section>
      <section className="home-section">
        <Skeleton className="line w70" />
        <Skeleton className="line w40" />
        {[0, 1, 2, 3].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </section>
    </div>
  );
}
