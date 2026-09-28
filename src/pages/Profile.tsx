import { useRef, useState, useEffect, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Screen } from "../components/Screen";
import { Icon } from "../components/Icon";
import {
  Button,
  BottomSheet,
  resetLoadingVisits,
  useToast,
} from "../components/primitives";
import { useAppNavigation } from "../navigation";
import { appStore, useAppStore, type FounderProfile } from "../state";
import {
  profileSectors,
  profileStages,
  profilePriorities,
  helpQuestions,
} from "../data/profile";
import "./profile.css";
function reset() {
  resetLoadingVisits();
  const url = new URL(location.href);
  url.searchParams.set("reset", "");
  url.hash = "/splash";
  location.replace(url.href);
}
export function ProfilePage() {
  const { profile, setup } = useAppStore();
  const nav = useAppNavigation();
  const [signout, setSignout] = useState(false);
  const row = (title: string, subtitle: string, path: string) => (
    <button
      className="profile-row"
      key={path}
      onClick={() => nav.go("/profile/" + path)}
    >
      <span className="grow">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <Icon name="chevron" size={16} />
    </button>
  );
  return (
    <Screen
      title="Profile"
      subtitle="Make Outpost work for you"
      className="profile-page"
    >
      <div className="content-body profile-content">
        <div className="profile-identity">
          <span className="profile-initials">{profile.initials}</span>
          <div>
            <h2>{profile.name}</h2>
            <p>Founder at {profile.startupName}</p>
            <small>{profile.city}, India</small>
          </div>
        </div>
        <section>
          <h2 className="section-title">Your profile</h2>
          <div className="card">
            {row(
              "You & your city",
              `${profile.name} · ${profile.city}`,
              "personal",
            )}
            {row(
              "Your startup",
              `${profile.startupName} · ${profile.sector} · ${profile.stage}`,
              "startup",
            )}
            {row(
              "What you need",
              setup.answers.priorities.join(" · ") ||
                "What do you need help with most?",
              "interests",
            )}
          </div>
        </section>
        <section>
          <h2 className="section-title">Account & preferences</h2>
          <div className="card">
            {row("Email & sign-in", profile.email, "email")}
            {row("Notifications", "Manage opportunity emails", "notifications")}
            {row(
              "Help & support",
              "Booking, applications and your account",
              "help",
            )}
            {row(
              "Privacy & terms",
              "Your data and the terms of using Outpost",
              "privacy",
            )}
          </div>
        </section>
        <Button variant="secondary" onClick={() => setSignout(true)}>
          Sign out
        </Button>
      </div>
      <BottomSheet
        open={signout}
        onClose={() => setSignout(false)}
        title="Sign out"
      >
        <Button onClick={reset}>Sign out</Button>
        <Button variant="ghost" onClick={() => setSignout(false)}>
          Cancel
        </Button>
      </BottomSheet>
    </Screen>
  );
}
type ProfileFormDraft = {
  form: FounderProfile;
  priorities: string[];
  notification: { grants: boolean; challenges: boolean };
  role: string;
  website: string;
  supportTopic: string;
  supportMessage: string;
};
const formDraftKey = (section: string) => `profile:form:${section}`;
function normalizePriorities(values: readonly unknown[]): string[] {
  const aliases: Record<string, string> = {
    Pricing: "Pricing & unit economics",
    Operations: "Operations & supply chain",
    "Something else": "Other",
    Hiring: "Hiring & team",
    Product: "Product & tech",
  };
  return [
    ...new Set(
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => aliases[value] || value)
        .filter((value) => profilePriorities.includes(value)),
    ),
  ].slice(0, 3);
}
function readFormDraft(section: string): ProfileFormDraft {
  const state = appStore.getState();
  const fallback: ProfileFormDraft = {
    form: { ...state.profile },
    priorities: normalizePriorities(state.setup.answers.priorities),
    notification: {
      grants: state.drafts["notifications.grants"] !== "off",
      challenges: state.drafts["notifications.challenges"] !== "off",
    },
    role: state.drafts["profile.role"] || "Founder",
    website: state.drafts["profile.website"] || "",
    supportTopic: "Mentor session",
    supportMessage: state.drafts["support.message"] || "",
  };
  try {
    const raw: unknown = JSON.parse(
      state.drafts[formDraftKey(section)] || "null",
    );
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return fallback;
    const draft = raw as Record<string, unknown>;
    if (
      draft.form &&
      typeof draft.form === "object" &&
      !Array.isArray(draft.form)
    ) {
      const values = draft.form as Record<string, unknown>;
      fallback.form = Object.fromEntries(
        Object.entries(fallback.form).map(([key, value]) => [
          key,
          typeof values[key] === "string" ? values[key] : value,
        ]),
      ) as unknown as FounderProfile;
    }
    if (Array.isArray(draft.priorities))
      fallback.priorities = normalizePriorities(draft.priorities);
    if (
      draft.notification &&
      typeof draft.notification === "object" &&
      !Array.isArray(draft.notification)
    ) {
      const values = draft.notification as Record<string, unknown>;
      for (const kind of ["grants", "challenges"] as const)
        if (typeof values[kind] === "boolean")
          fallback.notification[kind] = values[kind];
    }
    for (const key of [
      "role",
      "website",
      "supportTopic",
      "supportMessage",
    ] as const)
      if (typeof draft[key] === "string") fallback[key] = draft[key];
    return fallback;
  } catch {
    return fallback;
  }
}
export function ProfileEditPage() {
  const { section = "personal" } = useParams();
  return <ProfileEditor key={section} section={section} />;
}
function ProfileEditor({ section }: { section: string }) {
  const state = useAppStore();
  const nav = useAppNavigation();
  const { show } = useToast();
  const [draft, setDraft] = useState<ProfileFormDraft>(() =>
    readFormDraft(section),
  );
  const {
    form,
    priorities,
    notification,
    role,
    website,
    supportTopic,
    supportMessage,
  } = draft;
  const [busy, setBusy] = useState(false);
  const [changeEmail, setChangeEmail] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function updateDraft(updates: Partial<ProfileFormDraft>) {
    const next = { ...draft, ...updates };
    setDraft(next);
    appStore.setDraft(formDraftKey(section), JSON.stringify(next));
  }
  const setForm = (form: FounderProfile) => updateDraft({ form });
  const setPriorities = (priorities: string[]) => updateDraft({ priorities });
  const setNotification = (notification: ProfileFormDraft["notification"]) =>
    updateDraft({ notification });
  const names: Record<string, string> = {
    personal: "You & your city",
    startup: "Your startup",
    interests: "What do you need help with?",
    email: "Email & sign-in",
    notifications: "Notifications",
    help: "Help & support",
    privacy: "Privacy & terms",
    support: "How can we help?",
  };
  const explanations: Record<string, string> = {
    personal: "Your city helps us show relevant mentors and opportunities.",
    startup: "Help us put relevant people and opportunities in front of you.",
    interests:
      "Choose up to three. You can change these whenever your priorities shift.",
    email: "Your email is used to sign in and receive session updates.",
    notifications: "Choose the opportunity emails you’d like to receive.",
    help: "A few answers to keep you moving.",
    privacy: "Information about your account and using Outpost.",
    support:
      "Tell us what happened. Include the mentor, session or opportunity name so we can help.",
  };
  function save(event?: FormEvent) {
    event?.preventDefault();
    setBusy(true);
    timer.current = setTimeout(
      () => {
        if (section === "interests")
          appStore.setSetupAnswer(
            "priorities",
            normalizePriorities(priorities),
          );
        else if (section === "notifications") {
          appStore.setDraft(
            "notifications.grants",
            notification.grants ? "on" : "off",
          );
          appStore.setDraft(
            "notifications.challenges",
            notification.challenges ? "on" : "off",
          );
        } else if (section === "startup") {
          appStore.updateProfile({
            startupName: form.startupName,
            sector: form.sector,
            stage: form.stage,
          });
          appStore.setDraft("profile.role", role);
          appStore.setDraft("profile.website", website);
        } else if (section === "email")
          appStore.updateProfile({ email: form.email });
        else appStore.updateProfile({ name: form.name, city: form.city });
        appStore.clearDraft(formDraftKey(section));
        setBusy(false);
        show({
          message:
            section === "notifications"
              ? "Preferences saved"
              : "Profile updated",
        });
        nav.back();
      },
      650 + Math.random() * 180,
    );
  }
  const input = (
    label: string,
    key: "name" | "city" | "startupName" | "email",
    type = "text",
  ) => (
    <label className="field">
      {label}
      <input
        required
        type={type}
        value={form[key]}
        autoComplete={
          key === "name" ? "name" : key === "email" ? "email" : "off"
        }
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </label>
  );
  const editable = [
    "personal",
    "startup",
    "interests",
    "notifications",
  ].includes(section);
  return (
    <Screen
      title={names[section] || "Profile"}
      subtitle={explanations[section]}
      action={
        editable ? (
          <Button type="submit" form="profile-form" busy={busy}>
            {" "}
            {section === "notifications" ? "Save preferences" : "Save changes"}
          </Button>
        ) : undefined
      }
    >
      <div className="content-body">
        <form id="profile-form" className="form-stack" onSubmit={save}>
          {section === "personal" && (
            <>
              {input("Full name", "name")}
              {input("City", "city")}
              <small>Enter the city where your startup is based.</small>
            </>
          )}
          {section === "startup" && (
            <>
              {input("Startup name", "startupName")}
              <label className="field">
                Your role
                <input
                  value={role}
                  onChange={(e) => updateDraft({ role: e.target.value })}
                />
              </label>
              <label className="field">
                Website or LinkedIn (optional)
                <input
                  type="url"
                  value={website}
                  onChange={(e) => updateDraft({ website: e.target.value })}
                />
              </label>
              <div className="field">
                Sector
                <div className="option-grid">
                  {profileSectors.map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={`option-chip ${form.sector === value ? "selected" : ""}`}
                      aria-pressed={form.sector === value}
                      onClick={() => setForm({ ...form, sector: value })}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                Stage
                <div className="option-grid">
                  {profileStages.map((value) => (
                    <button
                      type="button"
                      key={value}
                      className={`option-chip ${form.stage === value ? "selected" : ""}`}
                      aria-pressed={form.stage === value}
                      onClick={() => setForm({ ...form, stage: value })}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
          {section === "interests" && (
            <>
              <p>{priorities.length} of 3 selected</p>
              <h3>Your priorities</h3>
              <div className="option-grid">
                {profilePriorities.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={`option-chip ${priorities.includes(value) ? "selected" : ""}`}
                    aria-pressed={priorities.includes(value)}
                    onClick={() =>
                      setPriorities(
                        priorities.includes(value)
                          ? priorities.filter((v) => v !== value)
                          : priorities.length < 3
                            ? [...priorities, value]
                            : priorities,
                      )
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
            </>
          )}
          {section === "notifications" && (
            <>
              <small>SEND EMAILS TO</small>
              <strong>{state.profile.email}</strong>
              {(["grants", "challenges"] as const).map((kind) => (
                <label className="notification-row" key={kind}>
                  <span>
                    <strong>
                      {kind === "grants" ? "Grant" : "Challenge"} opening emails
                    </strong>
                    <small>
                      For {kind} you request and issuers you follow.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={notification[kind]}
                    onChange={(e) =>
                      setNotification({
                        ...notification,
                        [kind]: e.target.checked,
                      })
                    }
                  />
                </label>
              ))}
              <div>
                <strong>Session updates</strong>
                <small>
                  Booking confirmations and changes to your sessions.
                </small>
                <span className="chip">Essential</span>
              </div>
              <p>
                Turning off opportunity emails won’t remove anything from Saved.
              </p>
            </>
          )}
        </form>
        {section === "email" && (
          <>
            <div className="card account-email">
              <small>CURRENT EMAIL</small>
              <strong>{state.profile.email}</strong>
              <span className="chip">Verified</span>
            </div>
            <Button variant="secondary" onClick={() => setChangeEmail(true)}>
              Change email
            </Button>
          </>
        )}
        {section === "help" && (
          <>
            <h3>COMMON QUESTIONS</h3>
            {helpQuestions.map(([question, answer]) => (
              <details className="help-question" key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
            <Button
              variant="secondary"
              onClick={() => nav.go("/profile/support")}
            >
              Contact support
            </Button>
          </>
        )}
        {section === "privacy" && (
          <>
            <p>These documents open in your browser.</p>
            <a
              className="button button--secondary"
              href="https://t-hub.co"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy policy
            </a>
            <a
              className="button button--secondary"
              href="https://t-hub.co"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of use
            </a>
            <Button onClick={() => nav.back()}>Back to Profile</Button>
          </>
        )}
        {section === "support" && (
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setBusy(true);
              timer.current = setTimeout(() => {
                appStore.clearDraft(formDraftKey(section));
                appStore.clearDraft("support.message");
                setBusy(false);
                show({ message: "Message received" });
                nav.back();
              }, 750);
            }}
          >
            <label className="field">
              Topic
              <select
                value={supportTopic}
                onChange={(e) => updateDraft({ supportTopic: e.target.value })}
              >
                <option>Mentor session</option>
                <option>Applications</option>
                <option>Your account</option>
              </select>
            </label>
            <label className="field">
              Your message
              <textarea
                required
                value={supportMessage}
                onChange={(e) =>
                  updateDraft({ supportMessage: e.target.value })
                }
              />
            </label>
            <small>
              Please leave out passwords and sensitive account details.
            </small>
            <p>
              We’ll reply to <strong>{state.profile.email}</strong>
            </p>
            <Button type="submit" busy={busy}>
              Send message
            </Button>
          </form>
        )}
      </div>
      <BottomSheet
        open={changeEmail}
        onClose={() => setChangeEmail(false)}
        title="Change email"
      >
        <form className="form-stack" onSubmit={save}>
          {input("Email", "email", "email")}
          <Button type="submit" busy={busy}>
            Save changes
          </Button>
        </form>
      </BottomSheet>
    </Screen>
  );
}
