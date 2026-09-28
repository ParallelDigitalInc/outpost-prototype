import type { AppState, Booking } from "../state";
/** Six of ten sessions remain in the supplied demo account before new requests. */
export function sessionAllowance(state: AppState) {
  return Math.max(
    0,
    6 -
      state.bookings.filter(
        (booking) =>
          booking.status !== "cancelled" &&
          !(
            booking.status === "completed" &&
            state.drafts[`booking:${booking.id}:attendance`] === "mentor-absent"
          ),
      ).length,
  );
}
export function canJoinBooking(booking: Booking, now: number) {
  return (
    booking.status === "confirmed" &&
    now >= booking.startsAt - 15 * 60000 &&
    now <= booking.endsAt
  );
}
