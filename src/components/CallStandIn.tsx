import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { appStore, useAppStore, type Booking } from "../state";
import { mentorById } from "../data/mentors";
import { useAppNavigation } from "../navigation";
import { Button, FadeImage } from "./primitives";
import "./call.css";

let callWindow: Window | null = null;
const returnedKey = "outpost:call-returned";
export function openStandInCall(booking: Booking) {
  appStore.setDraft("call:pending", booking.id);
  callWindow = window.open(
    `${import.meta.env.BASE_URL}#/call/${booking.id}`,
    "_blank",
  );
  if (!callWindow) {
    appStore.clearDraft("call:pending");
    return false;
  }
  return true;
}

export function CallReturnLifecycle() {
  const state = useAppStore();
  const pending = state.drafts["call:pending"];
  const { go } = useAppNavigation();
  useEffect(() => {
    if (!pending) return;
    let left = document.visibilityState === "hidden";
    let done = false;
    const finish = () => {
      if (done || document.visibilityState === "hidden") return;
      done = true;
      callWindow = null;
      appStore.clearDraft("call:pending");
      appStore.setDraft(`booking:${pending}:joined`, "1");
      go(`/sessions/${pending}/after`);
    };
    const blur = () => {
      left = true;
    };
    const focus = () => {
      if (left || callWindow?.closed) finish();
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") left = true;
      else focus();
    };
    const storage = (event: StorageEvent) => {
      if (
        event.key === returnedKey &&
        event.newValue?.startsWith(`${pending}:`)
      ) {
        left = true;
        finish();
      }
    };
    const timer = window.setInterval(() => {
      if (callWindow?.closed) {
        left = true;
        finish();
      }
    }, 500);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    window.addEventListener("storage", storage);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      window.removeEventListener("storage", storage);
    };
  }, [pending, go]);
  return null;
}

export function CallPage() {
  const { id } = useParams();
  const state = useAppStore();
  const [left, setLeft] = useState(false);
  const booking = state.bookings.find((item) => item.id === id);
  const mentor = mentorById(booking?.mentorId);
  function leave() {
    try {
      localStorage.setItem(returnedKey, `${id}:${Date.now()}`);
    } catch {
      /* Focus/close still triggers return. */
    }
    setLeft(true);
    window.close();
  }
  return (
    <main className="call-page">
      <div className="call-brand">Cal Video</div>
      <div className="call-content">
        <FadeImage
          className="call-portrait"
          src={`${import.meta.env.BASE_URL}${mentor.image}`}
          alt=""
          loading="eager"
        />
        <h1>{mentor.title}</h1>
        <p role="status">
          {left ? "You’ve left the call" : "You’re in the call"}
        </p>
        {left ? (
          <a href={`${import.meta.env.BASE_URL}#/sessions/${id}/after`}>
            Return to Outpost
          </a>
        ) : (
          <Button onClick={leave}>Leave</Button>
        )}
      </div>
      <span className="call-footer">Outpost · 45-minute mentor session</span>
    </main>
  );
}
