import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Screen } from "../components/Screen";
import {
  BottomSheet,
  Button,
  FadeImage,
  Skeleton,
  useFirstVisitLoading,
  useToast,
} from "../components/primitives";
import { openStandInCall } from "../components/CallStandIn";
import { Icon } from "../components/Icon";
import {
  bookingCopy,
  mentorById,
  mentorFirstName,
  slots,
} from "../data/mentors";
import { demoClock, formatDemoDate } from "../data/clock";
import { useAppNavigation } from "../navigation";
import { appStore, useAppStore, type Booking } from "../state";
import "./mentors.css";

export const bookingDate = (startsAt: number) =>
  formatDemoDate(startsAt, { weekday: "short", day: "numeric", month: "short" })
    .replace(/,/g, "")
    .replace("Sept", "Sep");
export const bookingTime = (startsAt: number, endsAt: number) =>
  `${formatDemoDate(startsAt, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .replace(/ (am|pm)/i, "")
    .toUpperCase()}–${formatDemoDate(endsAt, { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase()}`;
export const bookingLabel = (booking: Pick<Booking, "startsAt" | "endsAt">) =>
  `${bookingDate(booking.startsAt)} · ${bookingTime(booking.startsAt, booking.endsAt)}`;

/** Lives above the routes so pending requests resolve even while browsing elsewhere. */
export function BookingLifecycle() {
  const state = useAppStore();
  const { pathname } = useLocation();
  const { go } = useAppNavigation();
  const toast = useToast();
  const waitingKey = state.bookings
    .filter((booking) => booking.status === "waiting")
    .map((booking) => booking.id)
    .join(",");
  useEffect(() => {
    const timers: number[] = [];
    for (const booking of appStore
      .getState()
      .bookings.filter((item) => item.status === "waiting")) {
      const confirm = () => {
        if (
          appStore.getState().bookings.find((item) => item.id === booking.id)
            ?.status !== "waiting"
        )
          return;
        appStore.setBookingStatus(booking.id, "confirmed");
        toast.show({
          message: `${mentorFirstName(mentorById(booking.mentorId))} confirmed your session`,
          actionLabel: "View",
          onAction: () => go(`/sessions/${booking.id}`),
        });
      };
      if (pathname.startsWith("/sessions")) confirm();
      else
        timers.push(
          window.setTimeout(
            confirm,
            Math.min(
              8000,
              Math.max(0, 8000 - (demoClock.now() - booking.requestedAt)),
            ),
          ),
        );
    }
    return () => timers.forEach(clearTimeout);
  }, [waitingKey, pathname, go, toast]);
  return null;
}

export function BookingSummary({
  booking,
  change,
}: {
  booking: Pick<Booking, "mentorId" | "startsAt" | "endsAt">;
  change?: () => void;
}) {
  const mentor = mentorById(booking.mentorId);
  return (
    <div className="booking-summary">
      <div className="booking-summary__mentor">
        <FadeImage
          className={`booking-photo ${mentor.id === "mohit-arora" ? "mentor-photo--mohit" : ""}`}
          src={`${import.meta.env.BASE_URL}${mentor.image}`}
          alt=""
        />
        <div>
          <strong>{mentor.title}</strong>
          <span>45 min · video call</span>
        </div>
      </div>
      <div className="booking-summary__time">
        <Icon name="sessions" size={22} />
        <div>
          <strong>{bookingLabel(booking)}</strong>
          <span>India Standard Time</span>
        </div>
        {change && (
          <button className="text-button" onClick={change}>
            Change
          </button>
        )}
      </div>
    </div>
  );
}

export function downloadCalendar(booking: Booking) {
  const iso = (timestamp: number) =>
    new Date(timestamp)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Outpost//Mentor Session//EN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@outpost`,
    `DTSTAMP:${iso(demoClock.now())}`,
    `DTSTART:${iso(booking.startsAt)}`,
    `DTEND:${iso(booking.endsAt)}`,
    `SUMMARY:Outpost session with ${mentorById(booking.mentorId).title}`,
    "DESCRIPTION:45 min video call. Open Outpost to join your session.",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/calendar;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "outpost-session.ics";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BookingStatusView({
  booking,
  ready = false,
}: {
  booking: Booking;
  ready?: boolean;
}) {
  const { go, switchTab } = useAppNavigation();
  const [manage, setManage] = useState(false);
  const toast = useToast();
  const mentor = mentorById(booking.mentorId);
  const firstName = mentorFirstName(mentor);
  const waiting = booking.status === "waiting";
  const cancelled = booking.status === "cancelled";
  const day = formatDemoDate(booking.startsAt, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const title = cancelled
    ? "Request withdrawn"
    : waiting
      ? "Request sent"
      : ready
        ? "It’s time to connect"
        : "You’re booked";
  const description = cancelled
    ? "Your session has been cancelled."
    : waiting
      ? `${firstName} has 48 hours to accept. We’ll let you know as soon as there’s a reply.`
      : ready
        ? `Your 45-minute conversation with ${firstName} is ready. Bring your questions and join when you’re ready.`
        : `${firstName} accepted your request. Your conversation is set for ${day}.`;
  const status = waiting
    ? `Waiting for ${firstName}`
    : ready
      ? "Ready to join"
      : "Confirmed";
  return (
    <Screen
      variant="inner"
      title={title}
      className="booking-status-page"
      action={
        <div className="booking-status-actions">
          {cancelled ? (
            <Button onClick={() => go(`/mentors/${mentor.id}/book`)}>
              Book a session
            </Button>
          ) : waiting ? (
            <>
              <Button onClick={() => switchTab("sessions")}>
                See your sessions
              </Button>
              <Button variant="ghost" onClick={() => setManage(true)}>
                Withdraw request
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  if (ready) {
                    if (!openStandInCall(booking))
                      toast.show({
                        message:
                          "Allow pop-ups to open your call, then try again.",
                      });
                  } else downloadCalendar(booking);
                }}
              >
                {ready ? "Join call" : "Add to calendar"}
              </Button>
              <Button variant="ghost" onClick={() => setManage(true)}>
                Move or cancel
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => switchTab("home")}>
            Done
          </Button>
        </div>
      }
    >
      <div className="booking-status-content">
        <div className="booking-status-symbol">
          <Icon name={waiting ? "sessions" : "check"} size={26} />
        </div>
        <p className="booking-status-description">{description}</p>
        {!cancelled && (
          <>
            <div className="booking-state-chip">{status}</div>
            <BookingSummary booking={booking} />
            <div className="booking-call-link">
              <Icon name="sessions" size={18} />
              <span>
                {waiting
                  ? `Call link arrives once ${firstName} accepts`
                  : ready
                    ? "Cal Video · link available"
                    : "Cal Video · opens at session time"}
              </span>
            </div>
            {!waiting && (
              <p className="booking-cancel-note">
                {booking.startsAt === Date.parse("2026-09-28T16:00:00+05:30")
                  ? bookingCopy.cancellation
                  : `Free to cancel until ${bookingDate(booking.startsAt - 2 * 86400000)}, ${formatDemoDate(booking.startsAt, { hour: "numeric", minute: "2-digit" }).toUpperCase()} IST. Late cancellations and missed calls use one session.`}
              </p>
            )}
          </>
        )}
      </div>
      <BottomSheet
        open={manage}
        onClose={() => setManage(false)}
        title={waiting ? "Withdraw request?" : "Move or cancel"}
      >
        <div className="booking-manage">
          <p>{bookingLabel(booking)}</p>
          {!waiting && (
            <Button
              onClick={() => {
                appStore.setDraft("booking:reschedule", booking.id);
                setManage(false);
                go(`/mentors/${mentor.id}/book`);
              }}
            >
              Choose a new session time
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              appStore.setBookingStatus(booking.id, "cancelled");
              setManage(false);
            }}
          >
            {waiting ? "Withdraw request" : "Cancel session"}
          </Button>
          <Button variant="ghost" onClick={() => setManage(false)}>
            Keep session
          </Button>
        </div>
      </BottomSheet>
    </Screen>
  );
}

export function BookingPage() {
  const { id } = useParams();
  const location = useLocation();
  const { go, back, exitFlow, completeFlow } = useAppNavigation();
  const state = useAppStore();
  const mentor = mentorById(id);
  const step = location.pathname.split("/").at(-1);
  const initialDate = state.drafts[`booking:${mentor.id}:date`] || "2026-09-28";
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [month, setMonth] = useState(Number(initialDate.split("-")[1]) - 1);
  const [hour24, setHour24] = useState(false);
  const [name, setName] = useState(
    state.drafts["booking:name"] ?? state.profile.name,
  );
  const [email, setEmail] = useState(
    state.drafts["booking:email"] ?? state.profile.email,
  );
  const [note, setNote] = useState(
    state.drafts[`booking:${mentor.id}:note`] ||
      bookingCopy.note.replace("Kisanly", state.profile.startupName),
  );
  const [guests, setGuests] = useState(state.drafts["booking:guests"] || "");
  const [showGuests, setShowGuests] = useState(Boolean(guests));
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    setBusy(false);
    return () => window.clearTimeout(confirmTimer.current);
  }, [location.pathname]);
  const loading = useFirstVisitLoading(`/mentors/${mentor.id}/${step}`);
  const time = state.drafts[`booking:${mentor.id}:time`] || "16:00";
  const startsAt = Date.parse(`${selectedDate}T${time}:00+05:30`);
  const selected = {
    mentorId: mentor.id,
    startsAt,
    endsAt: startsAt + 45 * 60000,
  };
  const booking = [...state.bookings]
    .reverse()
    .find((item) => item.mentorId === mentor.id);
  if (step === "requested" && booking)
    return <BookingStatusView booking={booking} />;
  function chooseDate(day: number) {
    const value = `2026-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setSelectedDate(value);
    appStore.setDraft(`booking:${mentor.id}:date`, value);
  }
  function changeMonth(next: number) {
    setMonth(next);
    const value = next === 8 ? "2026-09-28" : "2026-10-01";
    setSelectedDate(value);
    appStore.setDraft(`booking:${mentor.id}:date`, value);
  }
  function chooseTime(value: string) {
    appStore.setDraft(`booking:${mentor.id}:date`, selectedDate);
    appStore.setDraft(`booking:${mentor.id}:time`, value);
    go(`/mentors/${mentor.id}/review`);
  }
  function confirm() {
    if (!formRef.current?.reportValidity() || busy) return;
    setBusy(true);
    confirmTimer.current = window.setTimeout(
      () => {
        const rescheduleId = appStore.getState().drafts["booking:reschedule"];
        if (rescheduleId) {
          appStore.setBookingStatus(rescheduleId, "cancelled");
          appStore.clearDraft("booking:reschedule");
        }
        appStore.updateProfile({ name: name.trim(), email: email.trim() });
        appStore.addBooking({ ...selected, note });
        navigator.vibrate?.(10);
        completeFlow(`/mentors/${mentor.id}/requested`);
      },
      650 + Math.random() * 200,
    );
  }
  const review = step === "review";
  const monthDate = new Date(Date.UTC(2026, month, 1));
  const monthName = monthDate.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const offset = monthDate.getUTCDay();
  const days = new Date(Date.UTC(2026, month + 1, 0)).getUTCDate();
  if (review && loading)
    return (
      <Screen
        variant="inner"
        title="Review your request"
        className="booking-page"
        hideTabs
        center={
          <span className="booking-progress" aria-label="Step 2 of 2">
            <i className="complete" />
            <i className="complete" />
          </span>
        }
        right={
          <button
            className="icon-button outlined"
            aria-label="Close booking"
            onClick={exitFlow}
          >
            <Icon name="close" size={18} />
          </button>
        }
      >
        <div className="booking-content booking-review-skeleton">
          <Skeleton style={{ height: 161, borderRadius: 16 }} />
          <Skeleton
            style={{ height: 17, width: "90%", margin: "16px 4px 10px" }}
          />
          <div className="booking-form">
            {[0, 1].map((key) => (
              <div key={key}>
                <Skeleton
                  style={{ width: "45%", height: 18, marginBottom: 6 }}
                />
                <Skeleton style={{ height: 48, borderRadius: 14 }} />
              </div>
            ))}
            <div>
              <Skeleton style={{ width: "80%", height: 18, marginBottom: 6 }} />
              <Skeleton style={{ height: 136, borderRadius: 14 }} />
            </div>
            <Skeleton style={{ height: 44, width: "40%" }} />
            <Skeleton style={{ height: 34 }} />
            <div className="booking-form-actions">
              <Skeleton style={{ flex: 1, height: 50, borderRadius: 25 }} />
              <Skeleton style={{ flex: 1.6, height: 50, borderRadius: 25 }} />
            </div>
          </div>
        </div>
      </Screen>
    );
  return (
    <Screen
      variant={review ? "inner" : "detail"}
      title={review ? "Review your request" : "Pick a time"}
      className="booking-page"
      hideTabs
      center={
        <span
          className="booking-progress"
          aria-label={`Step ${review ? 2 : 1} of 2`}
        >
          <i className="complete" />
          <i className={review ? "complete" : ""} />
        </span>
      }
      right={
        <button
          className="icon-button outlined"
          aria-label="Close booking"
          onClick={exitFlow}
        >
          <Icon name="close" size={18} />
        </button>
      }
    >
      <div className="booking-content">
        {review ? (
          <>
            <BookingSummary
              booking={selected}
              change={() => go(`/mentors/${mentor.id}/book`)}
            />
            <p className="booking-prefill">
              <Icon name="sparkle" size={14} />
              We filled this in from your search. Edit anything.
            </p>
            <form
              ref={formRef}
              className="booking-form"
              onSubmit={(event) => {
                event.preventDefault();
                confirm();
              }}
            >
              <label>
                Your name *
                <input
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    appStore.setDraft("booking:name", event.target.value);
                  }}
                />
              </label>
              <label>
                Email address *
                <input
                  name="email"
                  autoComplete="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    appStore.setDraft("booking:email", event.target.value);
                  }}
                />
              </label>
              <label>
                What would you like to work on? *
                <textarea
                  name="note"
                  required
                  rows={5}
                  value={note}
                  onChange={(event) => {
                    setNote(event.target.value);
                    appStore.setDraft(
                      `booking:${mentor.id}:note`,
                      event.target.value,
                    );
                  }}
                />
              </label>
              <button
                type="button"
                className="booking-add-guests"
                onClick={() => setShowGuests((value) => !value)}
              >
                + {showGuests ? "Remove guests" : "Add guests"}
              </button>
              {showGuests && (
                <label>
                  Guest email addresses
                  <input
                    value={guests}
                    type="email"
                    multiple
                    onChange={(event) => {
                      setGuests(event.target.value);
                      appStore.setDraft("booking:guests", event.target.value);
                    }}
                    placeholder="name@example.com"
                  />
                </label>
              )}
              <p className="booking-terms">
                By proceeding, you agree to Cal.com’s{" "}
                <a
                  href="https://cal.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Terms
                </a>{" "}
                and{" "}
                <a
                  href="https://cal.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                .
              </p>
              <div className="booking-form-actions">
                <Button variant="secondary" onClick={back}>
                  Back
                </Button>
                <Button type="submit" busy={busy}>
                  Confirm
                </Button>
              </div>
            </form>
            <div className="booking-footer">
              <span>{mentorFirstName(mentor)} has 48 hours to accept</span>
              <strong>Cal.com</strong>
            </div>
          </>
        ) : (
          <>
            <div className="booking-intro">
              <FadeImage
                src={`${import.meta.env.BASE_URL}${mentor.image}`}
                className="booking-avatar"
                alt=""
              />
              <span>{mentor.title} · 45 min · video call</span>
            </div>
            <h1 data-detail-title className="booking-pick-title">
              Pick a time
            </h1>
            {loading ? (
              <div className="booking-calendar-skeleton">
                <Skeleton style={{ height: 320, borderRadius: 16 }} />
                <Skeleton style={{ height: 240, borderRadius: 16 }} />
              </div>
            ) : (
              <div className="booking-calendar">
                <div className="booking-month">
                  <strong>{monthName}</strong>
                  <div>
                    <button
                      aria-label="Previous month"
                      disabled={month <= 8}
                      onClick={() => changeMonth(month - 1)}
                    >
                      <Icon name="back" size={16} />
                    </button>
                    <button
                      aria-label="Next month"
                      disabled={month >= 9}
                      onClick={() => changeMonth(month + 1)}
                    >
                      <Icon name="chevron" size={16} />
                    </button>
                  </div>
                </div>
                <div className="booking-weekdays">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                    (day) => (
                      <span key={day}>{day}</span>
                    ),
                  )}
                </div>
                <div className="booking-days">
                  {Array.from({ length: offset }, (_, index) => (
                    <span key={`offset-${index}`} />
                  ))}
                  {Array.from({ length: days }, (_, index) => index + 1).map(
                    (day) => (
                      <button
                        key={day}
                        disabled={month === 8 && day < 28}
                        aria-label={`${day} ${monthName}`}
                        aria-pressed={
                          selectedDate ===
                          `2026-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                        }
                        onClick={() => chooseDate(day)}
                      >
                        {day}
                      </button>
                    ),
                  )}
                </div>
                <div className="booking-slots">
                  <div className="booking-slots-head">
                    <strong>
                      {formatDemoDate(
                        Date.parse(`${selectedDate}T12:00:00+05:30`),
                        { weekday: "short", day: "numeric" },
                      ).replace(/,/g, "")}
                    </strong>
                    <div className="booking-hour-format">
                      <button
                        aria-pressed={!hour24}
                        onClick={() => setHour24(false)}
                      >
                        12h
                      </button>
                      <button
                        aria-pressed={hour24}
                        onClick={() => setHour24(true)}
                      >
                        24h
                      </button>
                    </div>
                  </div>
                  {slots.map((slot) => (
                    <button
                      className="booking-time-slot"
                      key={slot.time}
                      onClick={() => chooseTime(slot.time)}
                    >
                      {hour24 ? slot.time : slot.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="booking-footer">
              <span>Asia/Kolkata · tap a time to continue</span>
              <strong>Cal.com</strong>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
