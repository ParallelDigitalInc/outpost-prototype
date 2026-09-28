/** Approved copy: Paper 2SPX-0, 1LAB-0, 1NSA-0, H01 and H01a (2S7T-0). */
export const setupSteps = [
  {
    key: "sector",
    title: "Which sector are you building in?",
    options: [
      "Agritech",
      "Healthtech",
      "Fintech",
      "D2C",
      "Deeptech",
      "Something else",
    ],
  },
  {
    key: "stage",
    title: "What stage are you at?",
    options: ["Idea", "Pre-seed", "Seed", "Series A", "Series B+"],
  },
  { key: "startupName", title: "What’s your startup called?", options: [] },
  {
    key: "priorities",
    title: "What do you need help with most?",
    options: [
      "Fundraising",
      "Go-to-market",
      "Finding customers",
      "Pricing",
      "Hiring & team",
      "Product & tech",
      "Legal & compliance",
      "Operations",
      "Something else",
    ],
  },
  {
    key: "city",
    title: "Which city are you based in?",
    options: [
      "Hyderabad",
      "Bengaluru",
      "Mumbai",
      "Delhi NCR",
      "Chennai",
      "Pune",
      "Somewhere else",
    ],
  },
] as const;
export const searchSuggestions = [
  "Help with pricing our product",
  "Corporate challenges in mobility",
  "Grants for a seed-stage startup",
];
export const initialRecentSearches = [
  "Go-to-market and seed funding",
  "Mentors in Hyderabad",
];
export const popularReasons: Record<string, string> = {
  "kishore-varkey": "Most saved mentor this week",
  "priya-sharma": "Popular with seed-stage founders",
  challenges: "Most applied challenge this month",
  grants: "Most saved grant this month",
};
