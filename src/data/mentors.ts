import type { CatalogItem } from "./catalog";

/** Approved copy: M01, M03, M06 and M92, All flows [24 Sep 2026]. */
export const mentors: CatalogItem[] = [
  {
    id: "kishore-varkey",
    kind: "mentors",
    title: "Kishore Varkey",
    subtitle: "Startup advisor, Hyderabad",
    image: "images/kishore-varkey.webp",
    imagePosition: "50% 20%",
    tags: ["Go-to-market", "Seed"],
    why: "Works with seed-stage founders in Hyderabad",
    dateLabel: "Next free",
    date: "Thu 1 Oct",
  },
  {
    id: "priya-sharma",
    kind: "mentors",
    title: "Priya Sharma",
    subtitle: "Head of operations, Razorpay",
    image: "images/priya-sharma.webp",
    imagePosition: "50% 20%",
    tags: ["Go-to-market", "Ops"],
    why: "Works on go-to-market across sectors",
    dateLabel: "Next free",
    date: "Sun 27 Sep",
  },
  {
    id: "mohit-arora",
    kind: "mentors",
    title: "Mohit Arora",
    subtitle: "Founder, V2 Startup Incubation",
    image: "images/mohit-arora.webp",
    imagePosition: "50% 8%",
    tags: ["Pricing", "Validation"],
    why: "Pricing and go-to-market, based in Hyderabad",
    dateLabel: "Next free",
    date: "Mon 28 Sep",
  },
  {
    id: "vishal-gandhi",
    kind: "mentors",
    title: "Dr. Vishal Gandhi",
    subtitle: "Founder & CEO, BIORx",
    image: "images/vishal-gandhi.webp",
    imagePosition: "50% 50%",
    tags: ["Go-to-market", "Seed"],
    why: "Go-to-market for seed-stage teams",
    dateLabel: "Next free",
    date: "Fri 25 Sep",
  },
  {
    id: "ramesh-c",
    kind: "mentors",
    title: "Ramesh C",
    subtitle: "Ex R&D Director, BD",
    image: "images/ramesh-c.webp",
    imagePosition: "50% 20%",
    tags: [],
    dateLabel: "Next free",
    date: "Sat 26 Sep",
  },
  {
    id: "siva-kumar-pasupathi",
    kind: "mentors",
    title: "Siva Kumar Pasupathi",
    subtitle: "Director, ESI MedTek Solutions",
    image: "images/siva-kumar-pasupathi.webp",
    imagePosition: "50% 20%",
    tags: ["Go-to-market"],
    why: "First enterprise customers in India",
    dateLabel: "Next free",
    date: "Mon 28 Sep",
  },
  {
    id: "varadharaju-j",
    kind: "mentors",
    title: "Varadharaju J.",
    subtitle: "Former CHRO, Super.money",
    image: "images/varadharaju-j.webp",
    imagePosition: "50% 25%",
    tags: [],
    dateLabel: "Next free",
    date: "Tue 29 Sep",
  },
  {
    id: "anjali-kapoor",
    kind: "mentors",
    title: "Anjali Kapoor",
    subtitle: "Head of Product, HealthSync",
    image: "images/anjali-kapoor.webp",
    imagePosition: "50% 10%",
    tags: [],
    dateLabel: "Next free",
    date: "Tue 6 Oct",
  },
  {
    id: "ravi-mehta",
    kind: "mentors",
    title: "Ravi Mehta",
    subtitle: "UX lead, BrightLabs",
    image: "images/ravi-mehta.webp",
    imagePosition: "50% 20%",
    tags: [],
    dateLabel: "Next free",
    date: "Thu 8 Oct",
  },
  {
    id: "meera-nair",
    kind: "mentors",
    title: "Meera Nair",
    subtitle: "Growth advisor, D2C brands",
    image: "images/meera-nair.webp",
    imagePosition: "50% 15%",
    tags: [],
    dateLabel: "Next free",
    date: "Mon 12 Oct",
  },
];
export const mentorById = (id?: string) =>
  mentors.find((mentor) => mentor.id === id) ?? mentors[2];
export const mentorGroups = [
  {
    title: "This week",
    dates: "25–27 Sep",
    ids: ["vishal-gandhi", "ramesh-c", "priya-sharma"],
  },
  {
    title: "Next week",
    dates: "28 Sep – 4 Oct",
    ids: [
      "mohit-arora",
      "siva-kumar-pasupathi",
      "varadharaju-j",
      "kishore-varkey",
    ],
  },
  {
    title: "Later",
    dates: "From 5 Oct",
    ids: ["anjali-kapoor", "ravi-mehta", "meera-nair"],
  },
];
export const shortMentorRole: Record<string, string> = {
  "mohit-arora": "Founder, V2 Incubation",
  "priya-sharma": "Head of ops, Razorpay",
  "siva-kumar-pasupathi": "Director, ESI MedTek",
};
/** LinkedIn: Outpost Test Data.xlsx, Sheet1 D2, D4:D6, D8. Other names use people search. */
const mentorLinkedInUrls: Record<string, string> = {
  "ramesh-c": "https://www.linkedin.com/in/rameshcenggdir/",
  "siva-kumar-pasupathi": "https://www.linkedin.com/in/siva-kumar-04689a1b/",
  "mohit-arora": "https://www.linkedin.com/in/mohitarora-india/",
  "vishal-gandhi": "https://www.linkedin.com/in/drvishal-gandhi/",
  "varadharaju-j":
    "https://www.linkedin.com/in/varadharaju-janardhanan-889118b/",
};
export const mentorLinkedIn = (mentor: CatalogItem) =>
  mentorLinkedInUrls[mentor.id] ||
  `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(mentor.title)}`;
export const mentorFirstName = (mentor: CatalogItem) =>
  mentor.title.replace(/^Dr\.\s*/, "").split(" ")[0];
export const mentorCompany = (mentor: CatalogItem) =>
  mentor.subtitle.includes(",")
    ? mentor.subtitle.slice(mentor.subtitle.indexOf(",") + 1).trim()
    : mentor.subtitle;
/** P0-12/13 explicitly authorize this approved template for every mentor. */
export const mentorProfileCopy = {
  why: (name: string) =>
    `You need help with pricing and go-to-market. ${name} works with early-stage founders on exactly that, and is based in Hyderabad.`,
  quote:
    "I work with early-stage founders on validation, pricing and go-to-market. Bring your current pricing or your first customer list, and we'll work out the next step together.",
  workedWith: "Pre-seed and seed teams",
};

export const mentorPrompts = [
  "Who can help me price our product?",
  "How do we find our first customers?",
  "Someone who has raised a seed round",
];
export const bookingCopy = {
  note: "We’re testing pricing at Kisanly and looking for our first customers. I’d like a clear offer and next steps for go-to-market.",
  whyMohit:
    "You need help with pricing and go-to-market. Mohit works with early-stage founders on exactly that, and he's based in Hyderabad.",
  cancellation:
    "Free to cancel until Sat 26 Sep, 4:00 PM IST. Late cancellations and missed calls use one session.",
};
export const slots = [
  { time: "09:30", label: "9:30am" },
  { time: "11:00", label: "11:00am" },
  { time: "14:00", label: "2:00pm" },
  { time: "16:00", label: "4:00pm" },
];
/** Search/filter attributes follow M01/M03's approved demo matches, separately
 * from P0's intentionally reused profile prose so generic copy cannot match everyone.
 */
export const mentorSearchAttributes: Record<
  string,
  { help: string[]; sectors: string[]; stages: string[]; location: string }
> = {
  "kishore-varkey": {
    help: ["Go-to-market", "Fundraising"],
    sectors: ["Agritech"],
    stages: ["Pre-seed", "Seed"],
    location: "Hyderabad",
  },
  "priya-sharma": {
    help: ["Go-to-market", "Operations"],
    sectors: ["Consumer", "B2B SaaS"],
    stages: ["Seed", "Series A"],
    location: "Hyderabad",
  },
  "mohit-arora": {
    help: ["Pricing", "Go-to-market", "Validation"],
    sectors: ["Agritech", "Consumer", "B2B SaaS", "D2C"],
    stages: ["Pre-seed", "Seed"],
    location: "Hyderabad",
  },
  "vishal-gandhi": {
    help: ["Pricing", "Go-to-market", "Fundraising"],
    sectors: ["Agritech", "Healthtech"],
    stages: ["Pre-seed", "Seed"],
    location: "Hyderabad",
  },
  "ramesh-c": {
    help: ["Product", "Research"],
    sectors: ["Healthtech"],
    stages: ["Seed", "Series A"],
    location: "Hyderabad",
  },
  "siva-kumar-pasupathi": {
    help: ["Pricing", "Go-to-market", "Enterprise customers"],
    sectors: ["Agritech", "Healthtech", "B2B SaaS"],
    stages: ["Pre-seed", "Seed"],
    location: "Hyderabad",
  },
  "varadharaju-j": {
    help: ["Hiring", "Human resources"],
    sectors: ["Consumer", "B2B SaaS"],
    stages: ["Series A", "Series B+"],
    location: "Hyderabad",
  },
  "anjali-kapoor": {
    help: ["Product"],
    sectors: ["Healthtech"],
    stages: ["Seed", "Series A"],
    location: "Hyderabad",
  },
  "ravi-mehta": {
    help: ["UX", "Design", "Product"],
    sectors: ["B2B SaaS"],
    stages: ["Pre-seed", "Seed"],
    location: "Hyderabad",
  },
  "meera-nair": {
    help: ["Growth", "Marketing"],
    sectors: ["D2C", "Consumer"],
    stages: ["Seed", "Series A"],
    location: "Hyderabad",
  },
};
const normalizeMentorSearch = (value: string) =>
  value
    .toLowerCase()
    .replace(/go.to.market/g, "gotomarket")
    .replace(/pric(?:e|es|ing)/g, "price")
    .replace(/fundrais\w*|rais(?:ed|ing)/g, "fundraise")
    .replace(/operations|\bops\b/g, "operations")
    .replace(/customers/g, "customer")
    .replace(/[’'–-]/g, " ");
const mentorStopWords = new Set([
  "the",
  "and",
  "our",
  "for",
  "with",
  "help",
  "need",
  "who",
  "can",
  "someone",
  "has",
  "that",
  "this",
  "their",
  "your",
  "our",
  "startup",
  "startups",
  "mentor",
  "mentors",
  "stage",
  "round",
  "about",
  "how",
  "find",
  "finding",
  "first",
  "teams",
  "team",
]);
export function mentorMatchScore(item: CatalogItem, query: string): number {
  if (item.kind !== "mentors") return 0;
  const words = [
    ...new Set(
      normalizeMentorSearch(query)
        .split(/\W+/)
        .filter(
          (word) =>
            (word.length > 2 || ["ux", "hr", "ai"].includes(word)) &&
            !mentorStopWords.has(word),
        ),
    ),
  ];
  if (!words.length) return 0;
  const name = normalizeMentorSearch(item.title);
  const copy = normalizeMentorSearch(
    [item.subtitle, item.why, ...item.tags].join(" "),
  );
  const attributes = mentorSearchAttributes[item.id];
  const metadata = normalizeMentorSearch(
    attributes
      ? [
          ...attributes.help,
          ...attributes.sectors,
          ...attributes.stages,
          attributes.location,
        ].join(" ")
      : "",
  );
  return words.reduce(
    (score, word) =>
      score +
      (name.includes(word)
        ? 8
        : copy.includes(word)
          ? 4
          : metadata.includes(word)
            ? 2
            : 0),
    0,
  );
}
export function mentorMatches(query: string): CatalogItem[] {
  return mentors
    .map((item) => ({ item, score: mentorMatchScore(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ item }) => item);
}
