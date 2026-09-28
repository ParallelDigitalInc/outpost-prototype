import { test } from "node:test";
import assert from "node:assert/strict";
import { createInitialState } from "./store.ts";
import { sessionAllowance, canJoinBooking } from "../data/bookingRules.ts";
import type { Booking } from "./types.ts";
const booking: Booking = {
  id: "test",
  mentorId: "mohit-arora",
  startsAt: 1_000_000,
  endsAt: 3_700_000,
  requestedAt: 0,
  status: "waiting",
  note: "",
  callHappened: null,
};
test("allowance reserves requests, keeps founder absences and refunds mentor absences", () => {
  const state = createInitialState();
  assert.equal(sessionAllowance(state), 6);
  for (const status of ["waiting", "confirmed", "completed"] as const)
    assert.equal(
      sessionAllowance({ ...state, bookings: [{ ...booking, status }] }),
      5,
    );
  assert.equal(
    sessionAllowance({
      ...state,
      bookings: [{ ...booking, status: "completed", callHappened: false }],
      drafts: { "booking:test:attendance": "founder-absent" },
    }),
    5,
  );
  assert.equal(
    sessionAllowance({
      ...state,
      bookings: [{ ...booking, status: "completed", callHappened: false }],
      drafts: { "booking:test:attendance": "mentor-absent" },
    }),
    6,
  );
  assert.equal(
    sessionAllowance({
      ...state,
      bookings: [{ ...booking, status: "cancelled" }],
    }),
    6,
  );
});
test("Join is offered only during confirmed session arrival window", () => {
  assert.equal(canJoinBooking(booking, booking.startsAt), false);
  const confirmed = { ...booking, status: "confirmed" as const };
  assert.equal(canJoinBooking(confirmed, booking.startsAt - 16 * 60000), false);
  assert.equal(canJoinBooking(confirmed, booking.startsAt - 12 * 60000), true);
  assert.equal(canJoinBooking(confirmed, booking.endsAt + 1), false);
});
