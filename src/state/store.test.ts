import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDemoClock,
  DEMO_START_MS,
  formatDemoDate,
  minutesUntil,
} from "../data/clock.ts";
import {
  consumeResetFlag,
  createAppStore,
  createInitialState,
  deserializeState,
  savedCount,
  setupCompletedCount,
} from "./store.ts";
import { STORAGE_KEY, type StorageLike } from "./types.ts";

function memoryStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

test("saved items update one immutable snapshot and survive reopening", () => {
  const storage = memoryStorage();
  const store = createAppStore({ storage });
  const first = store.getState();
  let changes = 0;
  const unsubscribe = store.subscribe(() => {
    changes += 1;
  });
  assert.equal(store.toggleSave("mentors", "mohit-arora"), true);
  store.setSaved("mentors", "mohit-arora", true);
  assert.equal(changes, 1, "an already saved item should not rerender the app");
  assert.equal(savedCount(store.getState()), 1);
  assert.deepEqual(
    first.saved.mentors,
    [],
    "old snapshots must remain unchanged",
  );
  assert.ok(Object.isFrozen(store.getState().saved.mentors));
  assert.deepEqual(createAppStore({ storage }).getState().saved.mentors, [
    "mohit-arora",
  ]);
  assert.equal(store.toggleSave("mentors", "mohit-arora"), false);
  store.setSaved("mentors", "mohit-arora", true); // Undo restores the original item.
  assert.deepEqual(store.getState().saved.mentors, ["mohit-arora"]);
  unsubscribe();
  store.setSaved("grants", "performance-grant", true);
  assert.equal(changes, 3);
});

test("bad JSON, incompatible versions, and partially corrupt data are safe", () => {
  assert.deepEqual(deserializeState("{not json"), createInitialState());
  assert.deepEqual(
    deserializeState(JSON.stringify({ version: 99, signedIn: true })),
    createInitialState(),
  );
  const repaired = deserializeState(
    JSON.stringify({
      version: 1,
      signedIn: "true",
      profile: { name: 12, city: "Hyderabad" },
      saved: {
        mentors: ["mohit", "mohit", null, 2],
        challenges: {},
        grants: ["grant"],
      },
      setup: {
        answers: {
          sector: "Agritech",
          priorities: ["Funding", null, "Funding"],
        },
      },
      bookings: [{ id: "broken" }],
      applications: [null],
      drafts: { ask: "Help with funding", invalid: 4 },
    }),
  );
  assert.equal(repaired.profile.name, "Nikhil Batra");
  assert.equal(repaired.signedIn, false);
  assert.deepEqual(repaired.saved.mentors, ["mohit"]);
  assert.deepEqual(repaired.setup.answers.priorities, ["Funding"]);
  assert.deepEqual(repaired.drafts, { ask: "Help with funding" });
  assert.deepEqual(repaired.bookings, []);
  assert.deepEqual(repaired.applications, []);
});

test("blocked storage does not prevent saves, drafts, or reset", () => {
  const fail = () => {
    throw new Error("Storage blocked");
  };
  const store = createAppStore({
    storage: { getItem: fail, setItem: fail, removeItem: fail },
  });
  store.toggleSave("challenges", "honda");
  store.setDraft("challenge-query", "Agritech");
  assert.equal(store.getState().drafts["challenge-query"], "Agritech");
  store.reset();
  assert.deepEqual(store.getState(), createInitialState());
});

test("setup and profile edits remain in sync, including multiselect priorities", () => {
  const store = createAppStore();
  store.setSetupAnswer("sector", "Agritech");
  const priorities = ["Funding", "Mentors"];
  store.setSetupAnswer("priorities", priorities);
  priorities.push("Changed elsewhere");
  assert.equal(setupCompletedCount(store.getState().setup.answers), 2);
  assert.deepEqual(store.getState().setup.answers.priorities, [
    "Funding",
    "Mentors",
  ]);
  store.updateProfile({ city: "Hyderabad", startupName: "Kisanly" });
  assert.equal(setupCompletedCount(store.getState().setup.answers), 4);
  store.dismissSetup();
  assert.equal(store.getState().setup.dismissed, true);
  store.signIn(" nikhil@example.com ");
  assert.equal(store.getState().profile.email, "nikhil@example.com");
});

test("booking and application lifecycle survives persistence and prevents duplicates", () => {
  const storage = memoryStorage();
  const store = createAppStore({ storage });
  const booking = store.addBooking({
    mentorId: "mohit",
    startsAt: DEMO_START_MS + 12 * 60_000,
    endsAt: DEMO_START_MS + 57 * 60_000,
  });
  assert.equal(booking.status, "waiting");
  assert.deepEqual(store.confirmPendingBookings(), [booking.id]);
  assert.deepEqual(store.confirmPendingBookings(), []);
  store.setCallHappened(booking.id, true);
  assert.equal(store.getState().bookings[0].status, "completed");
  const first = store.markApplied("grants", "performance-grant");
  assert.equal(store.markApplied("grants", "performance-grant").id, first.id);
  store.setApplicationStatus("grants", "performance-grant", "heard-back");
  store.markApplied("challenges", "performance-grant");
  const reopened = createAppStore({ storage }).getState();
  assert.equal(
    reopened.applications.length,
    2,
    "equal IDs in different categories are distinct",
  );
  assert.equal(reopened.applications[0].status, "heard-back");
  assert.equal(reopened.bookings[0].callHappened, true);
  assert.throws(() =>
    store.addBooking({ mentorId: "mohit", startsAt: 100, endsAt: 90 }),
  );
});

test("reset and sign-out clear progress and restart the monotonic demo clock", () => {
  let elapsed = 123;
  const clock = createDemoClock(() => elapsed);
  const storage = memoryStorage();
  const store = createAppStore({ storage, clock });
  store.signIn("nikhil@example.com");
  store.toggleSave("mentors", "mohit");
  elapsed += 60_000;
  assert.equal(clock.now(), DEMO_START_MS + 60_000);
  store.signOut();
  assert.equal(clock.now(), DEMO_START_MS);
  assert.deepEqual(store.getState(), createInitialState());
  assert.deepEqual(
    deserializeState(storage.getItem(STORAGE_KEY)),
    createInitialState(),
  );
});

test("reset URL flags work before and inside hash routes while preserving other parameters", () => {
  const before = consumeResetFlag(
    "https://example.com/outpost/?reset&campaign=demo#/saved?kind=mentors",
  );
  assert.equal(before.shouldReset, true);
  assert.equal(
    before.href,
    "https://example.com/outpost/?campaign=demo#/saved?kind=mentors",
  );
  const both = consumeResetFlag(
    "https://example.com/outpost/?reset=1&campaign=demo#/sessions?reset&card=mohit",
  );
  assert.equal(both.shouldReset, true);
  assert.equal(
    both.href,
    "https://example.com/outpost/?campaign=demo#/sessions?card=mohit",
  );
  assert.deepEqual(consumeResetFlag("https://example.com/#/?reset"), {
    shouldReset: true,
    href: "https://example.com/#/",
  });
  assert.equal(
    consumeResetFlag("https://example.com/#/saved?sort=recent").shouldReset,
    false,
  );
});

test("clock and countdown follow monotonic elapsed time and the approved IST date", () => {
  let elapsed = 500;
  const clock = createDemoClock(() => elapsed);
  const startsAt = DEMO_START_MS + 12 * 60_000;
  assert.equal(minutesUntil(startsAt, clock.now()), 12);
  elapsed += 60_000;
  assert.equal(minutesUntil(startsAt, clock.now()), 11);
  elapsed += 12 * 60_000;
  assert.equal(minutesUntil(startsAt, clock.now()), 0);
  assert.match(
    formatDemoDate(DEMO_START_MS, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    /Friday, 25 September 2026/,
  );
  assert.equal(
    formatDemoDate(DEMO_START_MS, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
    "15:48",
  );
  let resets = 0;
  const stop = clock.subscribe(() => {
    resets += 1;
  });
  clock.reset();
  assert.equal(resets, 1);
  assert.equal(clock.now(), DEMO_START_MS);
  stop();
});
