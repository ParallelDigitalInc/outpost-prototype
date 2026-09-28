import { demoClock, type DemoClock } from "../data/clock.ts";
import {
  STATE_VERSION,
  STORAGE_KEY,
  SETUP_QUESTIONS,
  type AppState,
  type Application,
  type ApplicationKind,
  type ApplicationStatus,
  type Booking,
  type BookingInput,
  type BookingStatus,
  type FounderProfile,
  type SavedKind,
  type SetupAnswers,
  type SetupQuestion,
  type StorageLike,
} from "./types.ts";

export function createInitialState(): AppState {
  return {
    version: STATE_VERSION,
    signedIn: false,
    profile: {
      name: "Nikhil Batra",
      email: "",
      initials: "NB",
      startupName: "Kisanly",
      sector: "Agritech",
      stage: "Seed",
      city: "Hyderabad",
    },
    setup: {
      answers: {
        sector: null,
        stage: null,
        startupName: null,
        priorities: [],
        city: null,
      },
      dismissed: false,
    },
    saved: { mentors: [], challenges: [], grants: [] },
    bookings: [],
    applications: [],
    drafts: {},
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const nullableText = (value: unknown) =>
  typeof value === "string" && value.length > 0 ? value : null;
const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const uniqueStrings = (value: unknown): string[] =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.filter(
            (item): item is string =>
              typeof item === "string" && item.length > 0,
          ),
        ),
      ]
    : [];
const bookingStatuses: readonly string[] = [
  "waiting",
  "confirmed",
  "completed",
  "cancelled",
];
const applicationStatuses: readonly string[] = [
  "applied",
  "heard-back",
  "decision",
];

function validBooking(value: unknown): value is Booking {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.mentorId === "string" &&
    value.mentorId.length > 0 &&
    finite(value.startsAt) &&
    finite(value.endsAt) &&
    value.endsAt > value.startsAt &&
    finite(value.requestedAt) &&
    bookingStatuses.includes(text(value.status)) &&
    typeof value.note === "string" &&
    (value.callHappened === null || typeof value.callHappened === "boolean")
  );
}

function validApplication(value: unknown): value is Application {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id.length > 0 &&
    (value.kind === "challenges" || value.kind === "grants") &&
    typeof value.itemId === "string" &&
    value.itemId.length > 0 &&
    applicationStatuses.includes(text(value.status)) &&
    finite(value.appliedAt) &&
    finite(value.updatedAt)
  );
}

/** Never trust persisted JSON: repair bad fields, and reject unsupported versions. */
export function deserializeState(raw: string | null): AppState {
  const initial = createInitialState();
  if (!raw) return initial;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== STATE_VERSION) return initial;
    const profile = isRecord(value.profile) ? value.profile : {};
    const setup = isRecord(value.setup) ? value.setup : {};
    const answers = isRecord(setup.answers) ? setup.answers : {};
    const saved = isRecord(value.saved) ? value.saved : {};
    const drafts = isRecord(value.drafts)
      ? (Object.fromEntries(
          Object.entries(value.drafts).filter(
            (entry) => typeof entry[1] === "string",
          ),
        ) as Record<string, string>)
      : {};
    return {
      version: STATE_VERSION,
      signedIn: value.signedIn === true,
      profile: Object.fromEntries(
        Object.entries(initial.profile).map(([key, fallback]) => [
          key,
          key === "name" && profile[key] === "Nikhil"
            ? "Nikhil Batra"
            : text(profile[key], fallback),
        ]),
      ) as unknown as FounderProfile,
      setup: {
        dismissed: setup.dismissed === true,
        answers: {
          sector: nullableText(answers.sector),
          stage: nullableText(answers.stage),
          startupName: nullableText(answers.startupName),
          priorities: uniqueStrings(answers.priorities),
          city: nullableText(answers.city),
        },
      },
      saved: {
        mentors: uniqueStrings(saved.mentors),
        challenges: uniqueStrings(saved.challenges),
        grants: uniqueStrings(saved.grants),
      },
      bookings: Array.isArray(value.bookings)
        ? value.bookings.filter(validBooking)
        : [],
      applications: Array.isArray(value.applications)
        ? value.applications.filter(validApplication)
        : [],
      drafts,
    };
  } catch {
    return initial;
  }
}

function freezeState<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.values(value).forEach(freezeState);
    Object.freeze(value);
  }
  return value;
}

export function setupCompletedCount(answers: SetupAnswers): number {
  return SETUP_QUESTIONS.filter((question) =>
    question === "priorities"
      ? answers.priorities.length > 0
      : Boolean(answers[question]),
  ).length;
}

export function savedCount(state: AppState): number {
  return (
    state.saved.mentors.length +
    state.saved.challenges.length +
    state.saved.grants.length
  );
}

export function createAppStore(
  options: { storage?: StorageLike | null; clock?: DemoClock } = {},
) {
  const storage = options.storage;
  const clock = options.clock ?? demoClock;
  let raw: string | null = null;
  try {
    raw = storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    /* Restricted storage still permits an in-memory demo. */
  }
  let state = freezeState(deserializeState(raw));
  const listeners = new Set<() => void>();
  let sequence = state.bookings.length + state.applications.length;

  const commit = (next: AppState) => {
    if (next === state) return;
    state = freezeState(next);
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* Quota/private-mode failures must not break a tap. */
    }
    listeners.forEach((listener) => listener());
  };
  const makeId = (prefix: string) =>
    `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Math.floor(clock.now()).toString(36)}-${++sequence}`}`;

  const store = {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    reset() {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        /* The in-memory reset still succeeds. */
      }
      clock.reset();
      commit(createInitialState());
    },
    signIn(email: string, name = state.profile.name) {
      commit({
        ...state,
        signedIn: true,
        profile: {
          ...state.profile,
          email: email.trim(),
          name: name.trim() || state.profile.name,
        },
      });
    },
    signOut() {
      store.reset();
    },
    updateProfile(updates: Partial<FounderProfile>) {
      const profile = { ...state.profile, ...updates };
      const answers = { ...state.setup.answers };
      for (const question of [
        "sector",
        "stage",
        "startupName",
        "city",
      ] as const) {
        if (updates[question] !== undefined)
          answers[question] = nullableText(updates[question]);
      }
      commit({ ...state, profile, setup: { ...state.setup, answers } });
    },
    setSetupAnswer<K extends SetupQuestion>(
      question: K,
      answer: SetupAnswers[K],
    ) {
      const answers = {
        ...state.setup.answers,
        [question]:
          question === "priorities"
            ? [...(answer as readonly string[])]
            : answer,
      };
      const profile =
        question === "priorities"
          ? state.profile
          : { ...state.profile, [question]: answer ?? "" };
      commit({ ...state, profile, setup: { ...state.setup, answers } });
    },
    dismissSetup(dismissed = true) {
      commit({ ...state, setup: { ...state.setup, dismissed } });
    },
    isSaved(kind: SavedKind, id: string) {
      return state.saved[kind].includes(id);
    },
    setSaved(kind: SavedKind, id: string, saved: boolean) {
      if (!id || state.saved[kind].includes(id) === saved) return;
      const ids = saved
        ? [...state.saved[kind], id]
        : state.saved[kind].filter((item) => item !== id);
      commit({ ...state, saved: { ...state.saved, [kind]: ids } });
    },
    toggleSave(kind: SavedKind, id: string) {
      const saved = !store.isSaved(kind, id);
      store.setSaved(kind, id, saved);
      return saved;
    },
    setDraft(key: string, value: string) {
      if (state.drafts[key] === value) return;
      commit({ ...state, drafts: { ...state.drafts, [key]: value } });
    },
    clearDraft(key: string) {
      if (!(key in state.drafts)) return;
      const drafts = { ...state.drafts };
      delete drafts[key];
      commit({ ...state, drafts });
    },
    addBooking(input: BookingInput): Booking {
      if (
        !input.mentorId ||
        !finite(input.startsAt) ||
        !finite(input.endsAt) ||
        input.endsAt <= input.startsAt
      )
        throw new Error("A booking needs a mentor and a valid time slot.");
      const booking: Booking = {
        ...input,
        id: makeId("booking"),
        requestedAt: clock.now(),
        note: input.note ?? "",
        status: "waiting",
        callHappened: null,
      };
      commit({ ...state, bookings: [...state.bookings, booking] });
      return booking;
    },
    setBookingStatus(id: string, status: BookingStatus) {
      if (
        !state.bookings.some(
          (booking) => booking.id === id && booking.status !== status,
        )
      )
        return;
      commit({
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === id ? { ...booking, status } : booking,
        ),
      });
    },
    confirmPendingBookings(): readonly string[] {
      const ids = state.bookings
        .filter((booking) => booking.status === "waiting")
        .map((booking) => booking.id);
      if (ids.length)
        commit({
          ...state,
          bookings: state.bookings.map((booking) =>
            booking.status === "waiting"
              ? { ...booking, status: "confirmed" }
              : booking,
          ),
        });
      return ids;
    },
    setCallHappened(id: string, happened: boolean) {
      if (!state.bookings.some((booking) => booking.id === id)) return;
      commit({
        ...state,
        bookings: state.bookings.map((booking) =>
          booking.id === id
            ? { ...booking, callHappened: happened, status: "completed" }
            : booking,
        ),
      });
    },
    markApplied(kind: ApplicationKind, itemId: string): Application {
      const existing = state.applications.find(
        (application) =>
          application.kind === kind && application.itemId === itemId,
      );
      if (existing) return existing;
      if (!itemId) throw new Error("An application needs an item.");
      const now = clock.now();
      const application: Application = {
        id: makeId("application"),
        kind,
        itemId,
        status: "applied",
        appliedAt: now,
        updatedAt: now,
      };
      commit({ ...state, applications: [...state.applications, application] });
      return application;
    },
    setApplicationStatus(
      kind: ApplicationKind,
      itemId: string,
      status: ApplicationStatus,
    ) {
      store.markApplied(kind, itemId);
      commit({
        ...state,
        applications: state.applications.map((application) =>
          application.kind === kind && application.itemId === itemId
            ? { ...application, status, updatedAt: clock.now() }
            : application,
        ),
      });
    },
    removeApplication(kind: ApplicationKind, itemId: string) {
      const applications = state.applications.filter(
        (application) =>
          application.kind !== kind || application.itemId !== itemId,
      );
      if (applications.length !== state.applications.length)
        commit({ ...state, applications });
    },
  };
  return store;
}

/** Remove only reset flags, including the query belonging to a hash route. */
export function consumeResetFlag(href: string): {
  shouldReset: boolean;
  href: string;
} {
  const url = new URL(href);
  let shouldReset = url.searchParams.has("reset");
  url.searchParams.delete("reset");
  const hashQueryIndex = url.hash.indexOf("?");
  if (hashQueryIndex !== -1) {
    const route = url.hash.slice(0, hashQueryIndex);
    const params = new URLSearchParams(url.hash.slice(hashQueryIndex + 1));
    if (params.has("reset")) {
      shouldReset = true;
      params.delete("reset");
      url.hash = `${route}${params.size ? `?${params.toString()}` : ""}`;
    }
  }
  return { shouldReset, href: url.href };
}
