export const STATE_VERSION = 1 as const;
export const STORAGE_KEY = "outpost.prototype.v1";

export type SavedKind = "mentors" | "challenges" | "grants";
export type ApplicationKind = Exclude<SavedKind, "mentors">;
export type BookingStatus = "waiting" | "confirmed" | "completed" | "cancelled";
export type ApplicationStatus = "applied" | "heard-back" | "decision";

export interface FounderProfile {
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly startupName: string;
  readonly sector: string;
  readonly stage: string;
  readonly city: string;
}

export interface SetupAnswers {
  readonly sector: string | null;
  readonly stage: string | null;
  readonly startupName: string | null;
  readonly priorities: readonly string[];
  readonly city: string | null;
}

export type SetupQuestion = keyof SetupAnswers;
export const SETUP_QUESTIONS: readonly SetupQuestion[] = [
  "sector",
  "stage",
  "startupName",
  "priorities",
  "city",
];

export interface Booking {
  readonly id: string;
  readonly mentorId: string;
  readonly startsAt: number;
  readonly endsAt: number;
  readonly requestedAt: number;
  readonly status: BookingStatus;
  readonly note: string;
  readonly callHappened: boolean | null;
}

export interface Application {
  readonly id: string;
  readonly kind: ApplicationKind;
  readonly itemId: string;
  readonly status: ApplicationStatus;
  readonly appliedAt: number;
  readonly updatedAt: number;
}

export interface AppState {
  readonly version: typeof STATE_VERSION;
  readonly signedIn: boolean;
  readonly profile: FounderProfile;
  readonly setup: {
    readonly answers: SetupAnswers;
    readonly dismissed: boolean;
  };
  readonly saved: Readonly<Record<SavedKind, readonly string[]>>;
  readonly bookings: readonly Booking[];
  readonly applications: readonly Application[];
  readonly drafts: Readonly<Record<string, string>>;
}

export interface BookingInput {
  readonly mentorId: string;
  readonly startsAt: number;
  readonly endsAt: number;
  readonly note?: string;
}

export interface StorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}
