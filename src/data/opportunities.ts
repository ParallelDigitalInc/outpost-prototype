import type { CatalogItem } from "./catalog";
import type { ApplicationKind } from "../state";

// Copy and programme attributes come from the approved C·A / G·A / Home boards.
export interface Opportunity extends CatalogItem {
  kind: ApplicationKind;
  amountLabel: string;
  shortAmount: string;
  status: "Open" | "Opening soon" | "Closed" | "Apply anytime" | "Opens later";
  group: string;
  source: string;
  officialUrl: string;
  tileLabel?: string;
  tileColor?: string;
  focus?: string[];
  products?: string[];
  closesIn?: number;
  directory?: boolean;
}
const asset = (name: string) => `images/opportunities/${name}.png`;
export const challenges: Opportunity[] = [
  {
    id: "honda-innovation",
    kind: "challenges",
    title: "Innovation Challenge 2.0",
    subtitle: "Honda",
    issuer: "Honda",
    image: asset("honda"),
    tags: ["Mobility", "Paid pilot"],
    why: "Open to seed-stage startups",
    dateLabel: "Apply by",
    date: "Fri 2 Oct",
    amount: "₹40 lakh",
    shortAmount: "₹40L",
    amountLabel: "Up to, per startup",
    status: "Open",
    group: "Accepting applications",
    source: "Corporate",
    officialUrl: "https://t-hub.co",
    focus: ["Mobility"],
    products: ["Working product", "Market-ready"],
    closesIn: 7,
  },
  {
    id: "kotak-bizlabs",
    kind: "challenges",
    title: "BizLabs · Season 3",
    subtitle: "Kotak",
    issuer: "Kotak",
    image: asset("kotak"),
    tags: ["Agritech", "Grant"],
    why: "Agritech is a listed focus area",
    dateLabel: "Apply by",
    date: "Tue 6 Oct",
    amount: "₹30 lakh",
    shortAmount: "₹30L",
    amountLabel: "Up to, grant",
    status: "Open",
    group: "Accepting applications",
    source: "Corporate",
    officialUrl: "https://www.kotak.com/bizlabs",
    focus: [
      "Agritech",
      "Climate tech",
      "Clean tech",
      "Deep tech",
      "Fintech",
      "Health tech",
    ],
    products: ["Market-ready"],
    closesIn: 11,
  },
  {
    id: "lilly-accelerator",
    kind: "challenges",
    title: "Solution Accelerator",
    subtitle: "Lilly",
    issuer: "Lilly",
    image: asset("lilly"),
    tags: ["Health tech"],
    dateLabel: "Opens",
    date: "Mon 12 Oct",
    amount: "PoC",
    shortAmount: "PoC",
    amountLabel: "Support",
    status: "Opening soon",
    group: "Opening soon",
    source: "Corporate",
    officialUrl: "https://t-hub.co",
    tileLabel: "Lilly",
    tileColor: "#D52B1E",
    focus: ["Health tech"],
  },
  {
    id: "boeing-build",
    kind: "challenges",
    title: "BUILD 5.0",
    subtitle: "Boeing",
    issuer: "Boeing",
    image: asset("boeing"),
    tags: [],
    dateLabel: "",
    date: "Dates TBA",
    amount: "₹10L",
    shortAmount: "₹10L",
    amountLabel: "Up to",
    status: "Opening soon",
    group: "Opening soon",
    source: "Corporate",
    officialUrl: "https://t-hub.co",
    tileLabel: "BOEING",
    tileColor: "#0039A6",
  },
  {
    id: "feg-hackathon",
    kind: "challenges",
    title: "Innovation Hackathon",
    subtitle: "FEG India",
    issuer: "FEG India",
    image: asset("feg"),
    tags: [],
    dateLabel: "Ended",
    date: "9 Sep",
    amount: "₹1L",
    shortAmount: "₹1L",
    amountLabel: "Up to",
    status: "Closed",
    group: "Closed",
    source: "Corporate",
    officialUrl: "https://t-hub.co",
    tileLabel: "FEG",
    tileColor: "#2A2A2A",
  },
  {
    id: "maruti-mobility",
    kind: "challenges",
    title: "Mobility Challenge",
    subtitle: "Maruti Suzuki",
    issuer: "Maruti Suzuki",
    image: asset("maruti"),
    tags: ["Mobility", "Applications closed"],
    why: "Last-mile mobility, close to your ask",
    dateLabel: "Demo day",
    date: "Wed 14 Oct",
    amount: "₹25 lakh",
    shortAmount: "₹25L",
    amountLabel: "Up to, with a pilot",
    status: "Closed",
    group: "Closed",
    source: "Corporate",
    officialUrl: "https://t-hub.co",
    tileLabel: "MARUTI SUZUKI",
    tileColor: "#252D82",
    focus: ["Mobility"],
    products: ["Working product", "Market-ready"],
  },
  {
    id: "honda-innovation-1",
    kind: "challenges",
    title: "Innovation Challenge 1.0",
    subtitle: "Honda",
    issuer: "Honda",
    image: asset("honda"),
    tags: [],
    dateLabel: "Ended",
    date: "Mar 2026",
    amount: "₹25L",
    shortAmount: "₹25L",
    amountLabel: "Up to",
    status: "Closed",
    group: "Past programme",
    source: "Corporate",
    officialUrl: "https://t-hub.co",
    directory: false,
  },
];
const grant = (
  item: Partial<Opportunity> &
    Pick<Opportunity, "id" | "title" | "subtitle" | "amount" | "shortAmount">,
): Opportunity => ({
  kind: "grants",
  issuer: item.subtitle,
  tags: [],
  dateLabel: "Apply",
  date: "Anytime",
  amountLabel: "Up to",
  status: "Apply anytime",
  group: "Apply anytime",
  source: "Telangana",
  officialUrl: "https://t-hub.co",
  ...item,
});
export const grants: Opportunity[] = [
  grant({
    id: "seed-fund",
    title: "Seed Fund Scheme",
    subtitle: "Startup India · DPIIT",
    tags: ["Seed stage", "Pan-India"],
    why: "For DPIIT-recognised startups",
    amount: "₹20L",
    shortAmount: "₹20L",
    dateLabel: "Apply",
    date: "Rolling intake",
    source: "Central",
    directory: false,
  }),
  grant({
    id: "performance-grant",
    title: "Performance Grant",
    subtitle: "Govt of Telangana",
    issuer: "Telangana",
    image: asset("telangana"),
    tags: ["Reimbursement", "No equity"],
    why: "For Telangana startups with revenue",
    amount: "₹10 lakh",
    shortAmount: "₹10L",
    amountLabel: "Up to, 5% of sales",
    dateLabel: "Claim by",
    date: "Thu 31 Dec",
    officialUrl: "https://startup.telangana.gov.in",
  }),
  grant({
    id: "samridh",
    title: "SAMRIDH",
    subtitle: "MeitY · Govt of India",
    issuer: "MeitY",
    image: asset("meity"),
    tags: ["Matched 1:1", "Through T-Hub"],
    why: "T-Hub runs a SAMRIDH cohort",
    amount: "₹40 lakh",
    shortAmount: "₹40L",
    amountLabel: "Up to, matched 1:1",
    dateLabel: "Next cohort",
    date: "Dates TBA",
    status: "Opens later",
    group: "Opens later",
    source: "Central",
  }),
  grant({
    id: "idex-open",
    title: "iDEX Open Challenge",
    subtitle: "Ministry of Defence · Grant",
    issuer: "iDEX",
    image: asset("idex"),
    tileLabel: "iDEX",
    tileColor: "#233E65",
    tags: ["Grant"],
    amount: "₹1.5Cr",
    shortAmount: "₹1.5Cr",
    dateLabel: "Closes",
    date: "Wed 30 Sep",
    status: "Open",
    group: "Open now",
    source: "Central",
    closesIn: 5,
  }),
  grant({
    id: "kotak-bizlabs",
    title: "Kotak BizLabs S3",
    subtitle: "Kotak × T-Hub · Grant",
    issuer: "Kotak × T-Hub",
    image: asset("kotak"),
    tags: ["Grant", "Through T-Hub", "No equity"],
    why: "Agritech is a listed focus area",
    amount: "₹30 lakh",
    shortAmount: "₹30L",
    amountLabel: "Up to, grant",
    dateLabel: "Closes",
    date: "Tue 6 Oct",
    status: "Open",
    group: "Open now",
    source: "Corporate",
    officialUrl: "https://kotakbizlabs.accubate.app",
    focus: [
      "Agritech",
      "Climate tech",
      "Clean tech",
      "Deep tech",
      "Fintech",
      "Health tech",
    ],
    closesIn: 11,
  }),
  grant({
    id: "sgst-reimbursement",
    title: "SGST reimbursement",
    subtitle: "Telangana · Reimbursement",
    issuer: "Telangana",
    image: asset("telangana"),
    tags: ["Reimbursement", "For 3 years"],
    why: "The next claim window closes on Wednesday",
    amount: "100%",
    shortAmount: "100%",
    amountLabel: "Refund of SGST paid",
    dateLabel: "Claim by",
    date: "Wed 30 Sep",
    officialUrl: "https://startup.telangana.gov.in",
    closesIn: 5,
  }),
  grant({
    id: "recruitment-assistance",
    title: "Recruitment assistance",
    subtitle: "Telangana · Incentive",
    issuer: "Telangana",
    image: asset("telangana"),
    tags: ["Incentive", "Per employee"],
    why: "Paid for each person Kisanly hires",
    amount: "₹10,000",
    shortAmount: "₹10K",
    amountLabel: "Per new hire",
    dateLabel: "",
    date: "For each new hire",
    officialUrl: "https://startup.telangana.gov.in",
  }),
  grant({
    id: "international-marketing",
    title: "International marketing",
    subtitle: "Telangana · Reimbursement",
    issuer: "Telangana",
    image: asset("telangana"),
    tags: ["Reimbursement", "Endorsed"],
    why: "For taking Kisanly to buyers abroad",
    amount: "₹5 lakh",
    shortAmount: "₹5L",
    amountLabel: "Up to, 30% of costs",
    dateLabel: "",
    date: "30% of costs, capped",
    officialUrl: "https://startup.telangana.gov.in",
  }),
  grant({
    id: "villgro-incubation",
    title: "Villgro incubation",
    subtitle: "Villgro · Seed money",
    issuer: "Villgro",
    image: asset("villgro"),
    tileLabel: "villgro",
    tileColor: "#477D51",
    tags: ["Seed money"],
    amount: "~₹25L",
    shortAmount: "~₹25L",
    dateLabel: "",
    date: "Grant or equity",
    source: "Corporate",
  }),
  grant({
    id: "aws-activate",
    title: "AWS Activate",
    subtitle: "Amazon · Credits",
    issuer: "Amazon",
    image: asset("aws"),
    tileLabel: "aws",
    tileColor: "#263344",
    tags: ["Credits"],
    amount: "$5K",
    shortAmount: "$5K",
    dateLabel: "",
    date: "In cloud credits",
    source: "Corporate",
  }),
  grant({
    id: "tax-holiday",
    title: "80-IAC tax holiday",
    subtitle: "DPIIT · Tax benefit",
    issuer: "DPIIT",
    image: asset("dpiit"),
    tileLabel: "DPIIT",
    tileColor: "#465B7F",
    tags: ["Tax benefit"],
    amount: "3 yrs",
    shortAmount: "3 yrs",
    dateLabel: "",
    date: "Needs DPIIT",
    source: "Central",
  }),
  grant({
    id: "birac-big",
    title: "BIRAC BIG",
    subtitle: "DBT · BIRAC · Grant",
    issuer: "BIRAC",
    image: asset("birac"),
    tileLabel: "BIRAC",
    tileColor: "#16786A",
    tags: ["Grant"],
    amount: "₹50L",
    shortAmount: "₹50L",
    dateLabel: "",
    date: "Usually Jan and Jul",
    status: "Opens later",
    group: "Opens later",
    source: "Central",
  }),
  grant({
    id: "innovation-network",
    title: "Innovation Network",
    subtitle: "Wadhwani × IIT-H · Grant",
    issuer: "Wadhwani",
    image: asset("wadhwani"),
    tileLabel: "Wadhwani",
    tileColor: "#6B476C",
    tags: ["Grant"],
    amount: "₹1Cr",
    shortAmount: "₹1Cr",
    dateLabel: "",
    date: "Dates TBA",
    status: "Opens later",
    group: "Opens later",
    source: "Corporate",
  }),
  grant({
    id: "tsiri-fund",
    title: "TSIRI Grassroots Fund",
    subtitle: "TSIC Telangana · Grant",
    issuer: "TSIC",
    image: asset("tsic"),
    tileLabel: "TSIC",
    tileColor: "#705834",
    tags: ["Grant"],
    amount: "₹30L pool",
    shortAmount: "₹30L pool",
    dateLabel: "",
    date: "Dates TBA",
    status: "Opens later",
    group: "Opens later",
  }),
];
export const opportunities = { challenges, grants };
export function getOpportunity(kind: ApplicationKind, id: string | undefined) {
  return (
    opportunities[kind].find((item) => item.id === id) ?? opportunities[kind][0]
  );
}

export const demoDays = [
  {
    id: "maruti-demo",
    title: "Mobility Challenge demo day",
    subtitle: "Finalists pitch live to Maruti Suzuki",
    month: "OCT",
    day: "14",
    weekday: "WED",
    date: "Wednesday, 14 October",
    time: "4:00 – 6:00 PM",
    place: "T-Hub",
    location: "Hyderabad",
    relative: "In 20 days",
    note: "Applications are closed. You can still watch.",
    logo: asset("maruti-logo"),
    issuer: "Maruti Suzuki",
    color: "#252D82",
    start: "20261014T103000Z",
    end: "20261014T123000Z",
  },
  {
    id: "feg-demo",
    title: "Innovation Hackathon finals",
    subtitle: "Shortlisted teams present to FEG India",
    month: "OCT",
    day: "22",
    weekday: "THU",
    date: "Thursday, 22 October",
    time: "5:00 – 7:00 PM",
    place: "T-Hub",
    location: "Hyderabad",
    relative: "In 4 weeks",
    note: "Manage RSVP and email reminders",
    issuer: "FEG India",
    color: "#2A2A2A",
    start: "20261022T113000Z",
    end: "20261022T133000Z",
  },
  {
    id: "kotak-showcase",
    title: "BizLabs Season 2 showcase",
    subtitle: "Last season's cohort presents to Kotak",
    month: "NOV",
    day: "5",
    weekday: "THU",
    date: "Thursday, 5 November",
    time: "11:00 AM – 1:00 PM",
    place: "Online",
    location: "Link arrives after you RSVP",
    relative: "In 6 weeks",
    note: "Watch from anywhere.",
    issuer: "Kotak",
    color: "#003874",
    start: "20261105T053000Z",
    end: "20261105T073000Z",
  },
] as const;

// A deliberately small local ranking model for the prototype: a result needs
// overlap with the ask, and known phrases map to explicit catalogue attributes.
export function opportunityMatchScore(
  item: Opportunity,
  query: string,
): number {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^\p{L}\p{N}\s-]/gu, " ");
  const q = normalize(query);
  const stop = new Set([
    "for",
    "the",
    "and",
    "with",
    "can",
    "startup",
    "startups",
    "help",
    "need",
    "want",
    "looking",
    "find",
    "some",
    "any",
    "anything",
    "from",
    "that",
    "this",
    "have",
    "dont",
    "back",
    "pay",
    "not",
    "open",
    "now",
  ]);
  const tokens = [
    ...new Set(
      q.split(/[\s-]+/).filter((token) => token.length > 2 && !stop.has(token)),
    ),
  ];
  const identity = normalize(
    `${item.title} ${item.subtitle} ${item.issuer || ""}`,
  );
  const attributes = normalize(
    [
      ...(item.tags || []),
      ...(item.focus || []),
      ...(item.products || []),
      item.source,
      item.why || "",
    ].join(" "),
  );
  let score = tokens.reduce(
    (total, token) =>
      total +
      (identity.includes(token) ? 5 : attributes.includes(token) ? 4 : 0),
    0,
  );
  if (/hyderabad|telangana/.test(q) && item.source === "Telangana") score += 7;
  if (/claim|reimburse/.test(q) && item.tags.includes("Reimbursement"))
    score += 8;
  if (
    /no equity|dont have to pay|not a loan/.test(q) &&
    (item.tags.includes("No equity") ||
      item.tags.includes("Reimbursement") ||
      item.tags.includes("Grant"))
  )
    score += 7;
  if (
    /funding|money|financial/.test(q) &&
    (item.kind === "grants" || item.tags.includes("Grant"))
  )
    score += 3;
  if (/pilot/.test(q) && item.tags.includes("Paid pilot")) score += 5;
  if (
    /closing|this month/.test(q) &&
    item.closesIn !== undefined &&
    item.closesIn <= 7
  )
    score += 6;
  if (/through t-hub/.test(q) && item.tags.includes("Through T-Hub"))
    score += 8;
  // Sector overlap outranks broad words such as “grant” or “money”.
  for (const sector of item.focus || [])
    if (q.includes(normalize(sector))) score += 6;
  return score;
}
