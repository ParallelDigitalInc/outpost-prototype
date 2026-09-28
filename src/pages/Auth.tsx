import { useEffect, useRef, useState, type FormEvent } from "react";
import { Screen } from "../components/Screen";
import { Icon } from "../components/Icon";
import { Button, FadeImage, useToast } from "../components/primitives";
import { useAppNavigation } from "../navigation";
import { appStore, useAppStore } from "../state";
import "./auth.css";

const image = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

/** The current approved splash is isolated so a future chosen treatment can replace it. */
export function SplashPage() {
  const nav = useAppNavigation();
  return (
    <Screen variant="auth" className="splash-screen">
      <div className="splash-mosaic" aria-hidden="true">
        <div className="splash-column splash-column--one">
          <FadeImage src={image("vishal-gandhi.webp")} loading="eager" />
          <FadeImage src={image("meera-nair.webp")} loading="eager" />
          <FadeImage src={image("ramesh-c.webp")} loading="eager" />
        </div>
        <div className="splash-column splash-column--two">
          <FadeImage src={image("kishore-varkey.webp")} loading="eager" />
          <div className="splash-tile splash-tile--honda">
            <img src={image("honda-logo.webp")} alt="" />
            <div>
              <strong>₹40 lakh</strong>
              <small>Innovation Challenge</small>
            </div>
          </div>
          <FadeImage src={image("anjali-kapoor.webp")} loading="eager" />
        </div>
        <div className="splash-column splash-column--three">
          <FadeImage src={image("priya-sharma.webp")} loading="eager" />
          <div className="splash-tile splash-tile--grant">
            <small>Grant</small>
            <div>
              <strong>₹20L</strong>
              <small>Seed Fund Scheme</small>
            </div>
          </div>
          <FadeImage src={image("mohit-arora.webp")} loading="eager" />
        </div>
        <div className="splash-column splash-column--four">
          <FadeImage src={image("siva-kumar-pasupathi.webp")} loading="eager" />
          <FadeImage src={image("ravi-mehta.webp")} loading="eager" />
          <FadeImage src={image("varadharaju-j.webp")} loading="eager" />
        </div>
      </div>
      <div className="splash-copy">
        <div className="splash-brand">
          <strong>outpost</strong>
          <span>by T-Hub</span>
        </div>
        <h1>
          <span>Everything a</span>
          <span>founder needs in</span>
          <span>one place</span>
        </h1>
        <p>
          Book a mentor, apply to a challenge or find a grant you qualify for.
        </p>
      </div>
      <div className="splash-actions">
        <Button onClick={() => nav.go("/sign-in")}>Get started</Button>
        <div>
          Already on Outpost?{" "}
          <button onClick={() => nav.go("/sign-in")}>Sign in</button>
        </div>
      </div>
    </Screen>
  );
}

function AuthBack() {
  const nav = useAppNavigation();
  return (
    <div className="auth-back-row">
      <button className="auth-back" aria-label="Back" onClick={nav.back}>
        <Icon name="back" size={20} />
      </button>
    </div>
  );
}

function ProviderLogo({ provider }: { provider: "Google" | "LinkedIn" }) {
  if (provider === "LinkedIn")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <rect width="24" height="24" rx="4" fill="#0A66C2" />
        <path
          d="M7.1 9.3H4.6V19h2.5V9.3zM5.85 8.2a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9zM19.4 19h-2.5v-4.7c0-1.12-.02-2.56-1.56-2.56-1.56 0-1.8 1.22-1.8 2.48V19H11V9.3h2.4v1.33h.03c.34-.63 1.15-1.3 2.37-1.3 2.54 0 3.6 1.67 3.6 3.85V19z"
          fill="#FFF"
        />
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        fill="#EA4335"
      />
      <path
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        fill="#4285F4"
      />
      <path
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"
        fill="#FBBC05"
      />
      <path
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        fill="#34A853"
      />
    </svg>
  );
}

export function SignInPage() {
  const nav = useAppNavigation();
  const state = useAppStore();
  const [email, setEmail] = useState(
    state.drafts["sign-in-email"] || state.profile.email,
  );
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function sendCode(event?: FormEvent, provider?: string) {
    event?.preventDefault();
    if (busy || (!provider && !email.trim())) return;
    const address = provider
      ? state.profile.email && state.profile.email !== "founder@example.com"
        ? state.profile.email
        : "nikhil@kisanly.in"
      : email.trim();
    appStore.setDraft("sign-in-email", address);
    appStore.clearDraft("verify-code");
    setBusy(true);
    timer.current = window.setTimeout(
      () => nav.go("/verify"),
      650 + Math.random() * 200,
    );
  }
  return (
    <Screen variant="auth" title="Sign in" className="auth-screen">
      <AuthBack />
      <form className="auth-form" onSubmit={sendCode} noValidate>
        <div className="auth-heading">
          <h1>
            Sign in or
            <br />
            create an account
          </h1>
          <p>One account for mentors, challenges and grants.</p>
        </div>
        <div className="auth-providers">
          {(["Google", "LinkedIn"] as const).map((provider) => (
            <button
              type="button"
              key={provider}
              disabled={busy}
              onClick={() => sendCode(undefined, provider)}
            >
              <ProviderLogo provider={provider} />
              <span>Continue with {provider}</span>
              <i />
            </button>
          ))}
        </div>
        <div className="auth-divider">
          <span />
          or with email
          <span />
        </div>
        <div className="auth-email">
          <input
            aria-label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@startup.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              appStore.setDraft("sign-in-email", event.target.value);
            }}
          />
          <p>We’ll email you a 6-digit code.</p>
        </div>
        <div className="auth-footer">
          <Button type="submit" busy={busy} disabled={!email.trim()}>
            Send code
          </Button>
          <p>By continuing you agree to the Terms and Privacy policy.</p>
        </div>
      </form>
    </Screen>
  );
}

export function VerifyPage() {
  const nav = useAppNavigation();
  const state = useAppStore();
  const { show } = useToast();
  const email = state.drafts["sign-in-email"] || "nikhil@kisanly.in";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [focused, setFocused] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<number | null>(null);
  const resendTimer = useRef<number | null>(null);
  useEffect(() => {
    input.current?.focus({ preventScroll: true });
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (resendTimer.current) clearTimeout(resendTimer.current);
    };
  }, []);
  const verify = () => {
    if (busy || code.length !== 6) return;
    setBusy(true);
    timer.current = window.setTimeout(
      () => {
        appStore.signIn(email);
        appStore.clearDraft("verify-code");
        nav.go("/home", { replace: true });
      },
      650 + Math.random() * 200,
    );
  };
  useEffect(() => {
    if (code.length === 6) verify();
  }, [code]);
  return (
    <Screen variant="auth" title="Check your email" className="auth-screen">
      <AuthBack />
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          verify();
        }}
      >
        <div className="auth-heading">
          <h1>Check your email</h1>
          <p>Enter the 6-digit code we sent to</p>
          <div className="auth-address">
            <strong>{email}</strong>
            <button
              type="button"
              onClick={() => nav.go("/sign-in", { replace: true })}
            >
              Change
            </button>
          </div>
        </div>
        <div className="auth-code">
          <div
            className="otp-field"
            data-busy={busy}
            onClick={() => input.current?.focus()}
          >
            <input
              ref={input}
              aria-label="6-digit verification code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              disabled={busy}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <div className="otp-boxes" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <span
                  className={
                    focused && i === Math.min(code.length, 5)
                      ? "is-current"
                      : ""
                  }
                  key={i}
                >
                  {code[i] || ""}
                </span>
              ))}
            </div>
          </div>
          <p>
            {code.length === 6
              ? "Code complete. Tap verify to continue."
              : "You can paste the whole code."}
          </p>
        </div>
        <div className="auth-resend">
          Didn’t get it?{" "}
          <button
            type="button"
            disabled={resendBusy}
            onClick={() => {
              setResendBusy(true);
              setCode("");
              resendTimer.current = window.setTimeout(() => {
                setResendBusy(false);
                show({ message: "We’ll email you a 6-digit code." });
                input.current?.focus();
              }, 650);
            }}
          >
            Resend code
          </button>
        </div>
        <div className="auth-footer">
          <Button type="submit" busy={busy} disabled={code.length !== 6}>
            Verify and continue
          </Button>
        </div>
      </form>
    </Screen>
  );
}
