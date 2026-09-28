import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Screen } from "../components/Screen";
import { CardSkeleton, Segments } from "../components/shared";
import {
  BottomSheet,
  Button,
  FadeImage,
  useFirstVisitLoading,
  useToast,
} from "../components/primitives";
import { Icon } from "../components/Icon";
import { mentorById } from "../data/mentors";
import { canJoinBooking, sessionAllowance } from "../data/bookingRules";
import { formatDemoDate, minutesUntil } from "../data/clock";
import { useAppNavigation } from "../navigation";
import { appStore, useAppStore, useDemoClock, type Booking } from "../state";
import {
  BookingStatusView,
  BookingSummary,
  bookingDate,
  bookingLabel,
  bookingTime,
} from "./Booking";
import "./mentors.css";

function SessionCard({
  booking,
  primary,
}: {
  booking: Booking;
  primary: boolean;
}) {
  const { go } = useAppNavigation();
  const mentor = mentorById(booking.mentorId);
  const now = useDemoClock();
  const joinAvailable = canJoinBooking(booking, now);
  const past = booking.status === "completed" || booking.status === "cancelled";
  return (
    <article className="session-card">
      <div className="session-card__top">
        <div className="session-date">
          <span>
            {formatDemoDate(booking.startsAt, {
              weekday: "short",
            }).toUpperCase()}
          </span>
          <strong>
            {formatDemoDate(booking.startsAt, { day: "numeric" })}
          </strong>
        </div>
        <div className="session-card__copy">
          <strong>
            {past
              ? bookingLabel(booking)
              : bookingTime(booking.startsAt, booking.endsAt)}
          </strong>
          <span>
            <FadeImage
              className={`session-mentor-thumb ${mentor.id === "mohit-arora" ? "mentor-photo--mohit" : ""}`}
              src={`${import.meta.env.BASE_URL}${mentor.image}`}
              alt=""
            />
            {mentor.title}
          </span>
        </div>
        <button
          className="session-card__open"
          aria-label={`View session with ${mentor.title}`}
          onClick={() => go(`/sessions/${booking.id}`)}
        >
          <Icon name="chevron" size={16} />
        </button>
      </div>
      <div className="session-card__bottom">
        <span
          className={`session-status ${booking.status === "waiting" ? "is-waiting" : ""}`}
        >
          {booking.status === "waiting"
            ? `Waiting for ${mentor.title.replace(/^Dr\. /, "").split(" ")[0]}`
            : booking.status === "cancelled"
              ? "Cancelled"
              : past
                ? booking.callHappened
                  ? "Attendance saved"
                  : "Session didn’t happen"
                : joinAvailable
                  ? `Starts in ${minutesUntil(booking.startsAt, now)} min`
                  : `Confirmed · ${bookingDate(booking.startsAt)}`}
        </span>
        <Button
          variant={primary && joinAvailable ? "primary" : "secondary"}
          onClick={() =>
            go(past ? `/mentors/${mentor.id}/book` : `/sessions/${booking.id}`)
          }
        >
          {booking.status === "waiting"
            ? "View request"
            : past
              ? "Book again"
              : joinAvailable
                ? "Join call"
                : "View session"}
        </Button>
      </div>
      {past && (
        <p className="session-private">
          {booking.status === "cancelled"
            ? "Your session has been cancelled."
            : "Your attendance answer has been recorded."}
        </p>
      )}
    </article>
  );
}

export function SessionsPage() {
  const state = useAppStore();
  const { go } = useAppNavigation();
  const [segment, setSegment] = useState(
    state.drafts["sessions:segment"] || "upcoming",
  );
  const [limitOpen, setLimitOpen] = useState(false);
  const loading = useFirstVisitLoading("/sessions");
  const upcoming = state.bookings
    .filter(
      (booking) =>
        booking.status === "waiting" || booking.status === "confirmed",
    )
    .sort((a, b) => a.startsAt - b.startsAt);
  const past = state.bookings
    .filter(
      (booking) =>
        booking.status === "completed" || booking.status === "cancelled",
    )
    .sort((a, b) => b.startsAt - a.startsAt);
  const bookings = segment === "upcoming" ? upcoming : past;
  const remaining = sessionAllowance(state);
  function changeSegment(value: string) {
    setSegment(value);
    appStore.setDraft("sessions:segment", value);
  }
  return (
    <Screen variant="inner" title="Your sessions" className="sessions-page">
      <div className="sessions-content">
        <div className="session-allowance">
          <span>{remaining} of 10 left this month</span>
          <button className="text-button" onClick={() => setLimitOpen(true)}>
            View limit
          </button>
        </div>
        <Segments
          value={segment}
          onChange={changeSegment}
          options={[
            { value: "upcoming", label: "Upcoming" },
            { value: "past", label: "Past" },
          ]}
        />
        {loading ? (
          <div className="sessions-list">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : bookings.length ? (
          <div className="sessions-list">
            {bookings.map((booking, index) => (
              <section key={booking.id}>
                <div className="session-section-label">
                  <h2>
                    {booking.status === "waiting"
                      ? "Waiting for a reply"
                      : segment === "past"
                        ? formatDemoDate(booking.startsAt, { month: "long" })
                        : `${formatDemoDate(booking.startsAt, { weekday: "long" })} · ${bookingDate(booking.startsAt).split(" ").slice(1).join(" ")}`}
                  </h2>
                  {index === 0 && <span>All times IST</span>}
                </div>
                <SessionCard booking={booking} primary={index === 0} />
              </section>
            ))}
          </div>
        ) : (
          <div className="sessions-intro">
            <div className="sessions-intro__icon">
              <Icon name="sessions" size={36} />
            </div>
            <h2>
              {segment === "upcoming"
                ? "Your next good conversation"
                : "Your past conversations"}
            </h2>
            <p>
              {segment === "upcoming"
                ? "Find a mentor for the question on your mind. Your requests and confirmed sessions will live here."
                : "Your completed sessions and attendance answers will live here."}
            </p>
            <Button onClick={() => go("/mentors")}>
              {state.bookings.length
                ? "Find a mentor"
                : "Find your first mentor"}
            </Button>
          </div>
        )}
      </div>
      <BottomSheet
        open={limitOpen}
        onClose={() => setLimitOpen(false)}
        title="Your session allowance"
      >
        <div className="booking-manage">
          <h3>{remaining} of 10 sessions left</h3>
          <p>Late cancellations and missed calls use one session.</p>
          <Button onClick={() => setLimitOpen(false)}>Got it</Button>
        </div>
      </BottomSheet>
    </Screen>
  );
}

export function SessionDetailPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const state = useAppStore();
  const { go, switchTab } = useAppNavigation();
  const toast = useToast();
  const [answer, setAnswer] = useState("yes");
  const [busy, setBusy] = useState(false);
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) return <SessionsPage />;
  const mentor = mentorById(booking.mentorId);
  const firstName = mentor.title.replace(/^Dr\. /, "").split(" ")[0];
  const after = pathname.endsWith("/after");
  function saveAnswer() {
    setBusy(true);
    window.setTimeout(
      () => {
        appStore.setDraft(`booking:${booking!.id}:attendance`, answer);
        appStore.setCallHappened(booking!.id, answer === "yes");
        appStore.setDraft("sessions:segment", "past");
        toast.show({ message: "Your attendance answer has been recorded." });
        switchTab("sessions");
      },
      650 + Math.random() * 200,
    );
  }
  if (after)
    return (
      <>
        <SessionsPage />
        <BottomSheet
          open
          onClose={() => switchTab("sessions")}
          title={`Did your call with ${firstName} happen?`}
          description={bookingLabel(booking)}
        >
          <div className="attendance-content">
            <FadeImage
              className="attendance-photo"
              src={`${import.meta.env.BASE_URL}${mentor.image}`}
              alt=""
            />
            <div className="attendance-answers">
              {[
                { value: "yes", label: "Yes, it happened" },
                {
                  value: "mentor-absent",
                  label: `${firstName} didn’t show up`,
                },
                { value: "founder-absent", label: "I couldn’t make it" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={answer === option.value ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="attendance"
                    value={option.value}
                    checked={answer === option.value}
                    onChange={() => setAnswer(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <p>
              Only T-Hub sees this. It never shows on {firstName}’s profile.
            </p>
            <Button busy={busy} onClick={saveAnswer}>
              Continue
            </Button>
          </div>
        </BottomSheet>
      </>
    );
  if (booking.status === "completed")
    return (
      <Screen
        variant="inner"
        title="Your session"
        action={
          <Button onClick={() => go(`/mentors/${mentor.id}/book`)}>
            Book again
          </Button>
        }
      >
        <div className="booking-status-content">
          <BookingSummary booking={booking} />
          <div className="mentor-fit">
            <h2>
              {booking.callHappened
                ? "Attendance saved"
                : "Session didn’t happen"}
            </h2>
            <p>Your attendance answer has been recorded.</p>
            <p>Your feedback is private.</p>
          </div>
        </div>
      </Screen>
    );
  return (
    <BookingStatusView
      booking={booking}
      ready={booking.status === "confirmed"}
    />
  );
}
