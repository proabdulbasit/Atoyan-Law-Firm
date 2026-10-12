/**
 * Keyword & Practice Area Decomposition Utility
 * Prevents awkward keyword clutter, unnatural repetitions, and title duplications
 * (e.g., eliminates "Glendale Glendale Wrongful Termination Lawyer Attorneys"
 * and "subjected you to Glendale Wrongful Termination Lawyer in Glendale").
 */

export interface DecomposedKeyword {
  city: string;
  cleanTopic: string;
  lawyerTitle: string;
  topicKey:
    | "wrongful_termination"
    | "workplace_harassment"
    | "sexual_harassment"
    | "race_discrimination"
    | "wage_theft"
    | "meal_breaks"
    | "disability"
    | "workplace_retaliation"
    | "family_medical_leave"
    | "age_discrimination"
    | "employment_law";
  subtopic: string;
  heroTitle: string;
  slug: string;
  yoastTitle: string;
  yoastMetaDesc: string;
  yoastFocusKw: string;
  isArticle?: boolean;
}

export const CALIFORNIA_CITIES = [
  "Agoura Hills",
  "Alhambra",
  "Aliso Viejo",
  "Anaheim",
  "Antioch",
  "Apple Valley",
  "Arcadia",
  "Bakersfield",
  "Baldwin Park",
  "Bellflower",
  "Berkeley",
  "Beverly Hills",
  "Brea",
  "Burbank",
  "Calabasas",
  "Camarillo",
  "Carlsbad",
  "Carson",
  "Cerritos",
  "Chico",
  "Chino",
  "Chino Hills",
  "Chula Vista",
  "Citrus Heights",
  "Claremont",
  "Clovis",
  "Compton",
  "Concord",
  "Corona",
  "Costa Mesa",
  "Covina",
  "Culver City",
  "Daly City",
  "Dana Point",
  "Davis",
  "Diamond Bar",
  "Downey",
  "El Cajon",
  "El Monte",
  "El Segundo",
  "Elk Grove",
  "Encinitas",
  "Escondido",
  "Fairfield",
  "Folsom",
  "Fontana",
  "Fountain Valley",
  "Fremont",
  "Fresno",
  "Fullerton",
  "Garden Grove",
  "Gardena",
  "Glendale",
  "Glendora",
  "Hawthorne",
  "Hayward",
  "Hemet",
  "Hesperia",
  "Huntington Beach",
  "Indio",
  "Inglewood",
  "Irvine",
  "La Habra",
  "La Mesa",
  "La Mirada",
  "Laguna Beach",
  "Laguna Hills",
  "Laguna Niguel",
  "Lake Forest",
  "Lakewood",
  "Lancaster",
  "Livermore",
  "Lodi",
  "Long Beach",
  "Los Angeles",
  "Malibu",
  "Manhattan Beach",
  "Manteca",
  "Menifee",
  "Merced",
  "Mission Viejo",
  "Modesto",
  "Monrovia",
  "Montclair",
  "Montebello",
  "Monterey Park",
  "Moorpark",
  "Moreno Valley",
  "Mountain View",
  "Murrieta",
  "Napa",
  "Newport Beach",
  "Norwalk",
  "Novato",
  "Oakland",
  "Oceanside",
  "Ontario",
  "Orange",
  "Oxnard",
  "Palm Desert",
  "Palm Springs",
  "Palmdale",
  "Palo Alto",
  "Pasadena",
  "Perris",
  "Petaluma",
  "Pico Rivera",
  "Placentia",
  "Pleasanton",
  "Pomona",
  "Rancho Cordova",
  "Rancho Cucamonga",
  "Redding",
  "Redlands",
  "Redondo Beach",
  "Redwood City",
  "Rialto",
  "Richmond",
  "Riverside",
  "Rosemead",
  "Roseville",
  "Sacramento",
  "Salinas",
  "San Bernardino",
  "San Clemente",
  "San Diego",
  "San Fernando",
  "San Francisco",
  "San Gabriel",
  "San Jose",
  "San Leandro",
  "San Luis Obispo",
  "San Marcos",
  "San Mateo",
  "San Rafael",
  "San Ramon",
  "Santa Ana",
  "Santa Barbara",
  "Santa Clara",
  "Santa Clarita",
  "Santa Cruz",
  "Santa Maria",
  "Santa Monica",
  "Santa Rosa",
  "Santee",
  "Simi Valley",
  "South Gate",
  "South Pasadena",
  "Stockton",
  "Sunnyvale",
  "Temecula",
  "Thousand Oaks",
  "Torrance",
  "Tracy",
  "Turlock",
  "Tustin",
  "Union City",
  "Upland",
  "Vacaville",
  "Vallejo",
  "Ventura",
  "Victorville",
  "Visalia",
  "Vista",
  "Walnut",
  "Walnut Creek",
  "West Covina",
  "West Hollywood",
  "Westminster",
  "Whittier",
  "Woodland",
  "Yorba Linda",
  "Yuba City",
  // Regions & LA neighborhoods
  "San Fernando Valley",
  "San Gabriel Valley",
  "Orange County",
  "Inland Empire",
  "Van Nuys",
  "Studio City",
  "North Hollywood",
  "Sherman Oaks",
  "Encino",
  "Tarzana",
  "Woodland Hills",
  "Canoga Park",
  "Reseda",
  "Northridge",
  "Chatsworth",
  "Porter Ranch",
  "Granada Hills",
  "Sylmar",
  "Pacoima",
  "Sun Valley",
  "Panorama City",
  "Sunland",
  "Tujunga",
  "Valencia",
  "Canyon Country",
  "Newhall",
  "Saugus",
].sort((a, b) => b.length - a.length);

/**
 * Detects whether a keyword query is an informational question / legal guide
 * (e.g. "What Should You Do If You're Wrongfully Terminated?", "How to Prove Wrongful Termination in Court?")
 * rather than a geo-targeted practice area landing page (e.g. "Agoura Hills Sexual Harassment Lawyer").
 */
export function isInformationalQuery(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const trimmed = text.trim();
  if (trimmed.endsWith("?")) return true;
  if (/^(what|how|why|when|where|who|can|should|is|are|do|does|will|could|would)\b/i.test(trimmed)) return true;
  if (/^\d+\s+(questions|things|types|steps|ways|signs|reasons|mistakes|tips|facts|rights|rules)\b/i.test(trimmed)) return true;
  if (/:\s*(your\s+)?(legal\s+)?rights\s+explained/i.test(trimmed)) return true;
  if (/\b(explained|guide|overview|faqs?|checklist)\b/i.test(trimmed) && !/\b(lawyer|attorney|law\s*firm)\b/i.test(trimmed)) return true;
  return false;
}

/** Snippet Yoast shows under the blue title, written the same way for every practice area. */
export function practiceMetaDescription(city: string, cleanTopic: string, topicKey: string): string {
  const topic = cleanTopic.toLowerCase();
  const phone = "Call (323) 968-0000.";
  if (/\bpregnancy\b/i.test(cleanTopic)) {
    return `Experienced ${city} pregnancy discrimination attorney protecting employees from bias, denied leave, and retaliation. ${phone}`;
  }
  switch (topicKey) {
    case "disability":
      return `Experienced ${city} disability discrimination attorney fighting for employees denied reasonable accommodations & interactive process. ${phone}`;
    case "wrongful_termination":
      return `Top-rated ${city} wrongful termination attorney fighting for employees fired illegally or facing employer retaliation. ${phone}`;
    case "workplace_retaliation":
      return `Tenacious ${city} workplace retaliation & whistleblower attorney fighting for employees punished for reporting illegal conduct. ${phone}`;
    case "wage_theft":
      return `Experienced ${city} ${topic} attorney fighting for unpaid overtime, off-the-clock pay, misclassification & waiting time penalties. ${phone}`;
    case "meal_breaks":
      return `Aggressive ${city} meal and rest break attorney fighting for unpaid Labor Code § 226.7 premium pay and waiting time penalties. ${phone}`;
    case "workplace_harassment":
      return `Experienced ${city} workplace harassment attorney fighting hostile work environment, supervisor bias, and retaliation under California FEHA. ${phone}`;
    case "race_discrimination":
      return `Top-rated ${city} race discrimination attorney fighting for employees facing workplace bias, harassment, and wrongful termination. ${phone}`;
    case "family_medical_leave":
      return `Experienced ${city} family and medical leave attorney protecting employee rights under CFRA & FMLA. Fighting wrongful termination & retaliation. ${phone}`;
    case "age_discrimination":
      return `Experienced ${city} age discrimination attorney fighting for older workers facing bias, demotion, or wrongful termination. ${phone}`;
    case "sexual_harassment":
      return `Experienced ${city} ${topic} attorney fighting for victims of hostile work environment, quid pro quo & retaliation. ${phone}`;
    default:
      return `Experienced ${city} ${topic} attorney fighting for California workers. Protect your workplace rights & recover compensation. ${phone}`;
  }
}

export interface PracticeAreaRule {
  pattern: RegExp;
  cleanTopic: string;
  subtopic: string;
  slugSuffix: string;
  topicKey: DecomposedKeyword["topicKey"];
}

export const PRACTICE_AREA_RULES: PracticeAreaRule[] = [
  { pattern: /\b(constructive\s+discharge|forced\s+resignation)\b/i, cleanTopic: "Constructive Discharge", subtopic: "Forced Resignation & Intolerable Conditions", slugSuffix: "constructive-discharge-lawyer", topicKey: "wrongful_termination" },
  { pattern: /\b(severance\s+agreements?|severance\s+negotiation)\b/i, cleanTopic: "Severance Agreement", subtopic: "Agreement Review & Negotiation", slugSuffix: "severance-agreement-lawyer", topicKey: "employment_law" },
  { pattern: /\b(employment\s+contracts?|employment\s+agreements?|breach\s+of\s+contract)\b/i, cleanTopic: "Employment Contract", subtopic: "Contract Disputes & Non-Competes", slugSuffix: "employment-contract-lawyer", topicKey: "employment_law" },
  { pattern: /\b(fmla\b|cfra\b|leave\s+of\s+absence|medical\s+leave)\b/i, cleanTopic: "FMLA Leave of Absence", subtopic: "CFRA & Protected Leave Rights", slugSuffix: "fmla-leave-of-absence-lawyer", topicKey: "family_medical_leave" },
  { pattern: /\b(pregnancy\s+discrimination|maternity\s+leave|pregnancy\s+leave)\b/i, cleanTopic: "Pregnancy Discrimination", subtopic: "Maternity Protections & Accommodations", slugSuffix: "pregnancy-discrimination-lawyer", topicKey: "family_medical_leave" },
  { pattern: /\b(disability\s+discrimination|medical\s+condition|reasonable\s+accommodation)\b/i, cleanTopic: "Disability Discrimination", subtopic: "Reasonable Accommodation & FEHA Protections", slugSuffix: "disability-discrimination-lawyer", topicKey: "disability" },
  { pattern: /\b(age\s+discrimination|older\s+workers?)\b/i, cleanTopic: "Age Discrimination", subtopic: "Older Worker Rights & ADEA Claims", slugSuffix: "age-discrimination-lawyer", topicKey: "age_discrimination" },
  { pattern: /\b(race\s+discrimination|racial\s+discrimination|crown\s+act|racial\s+bias)\b/i, cleanTopic: "Race Discrimination", subtopic: "Racial Bias & Equal Workplace Rights", slugSuffix: "race-discrimination-lawyer", topicKey: "race_discrimination" },
  { pattern: /\b(gender\s+discrimination|gender\s+bias)\b/i, cleanTopic: "Gender Discrimination", subtopic: "Gender Equity & Workplace Protections", slugSuffix: "gender-discrimination-lawyer", topicKey: "sexual_harassment" },
  { pattern: /\b(sex\s+discrimination|sex\s+bias)\b/i, cleanTopic: "Sex Discrimination", subtopic: "Sex-Based Workplace Bias", slugSuffix: "sex-discrimination-lawyer", topicKey: "sexual_harassment" },
  { pattern: /\b(employment\s+discrimination|workplace\s+discrimination)\b/i, cleanTopic: "Employment Discrimination", subtopic: "Workplace Bias & FEHA Violations", slugSuffix: "employment-discrimination-lawyer", topicKey: "employment_law" },
  { pattern: /\b(whistleblower(\s+retaliation)?)\b/i, cleanTopic: "Whistleblower Retaliation", subtopic: "Reporting Violations & Worker Protections", slugSuffix: "whistleblower-lawyer", topicKey: "workplace_retaliation" },
  { pattern: /\b(retaliation|retaliatory)\b/i, cleanTopic: "Workplace Retaliation", subtopic: "Worker Rights & Retaliation Claims", slugSuffix: "retaliation-lawyer", topicKey: "workplace_retaliation" },
  { pattern: /\b(hostile\s+work\s+environment)\b/i, cleanTopic: "Hostile Work Environment", subtopic: "Severe & Pervasive Harassment", slugSuffix: "hostile-work-environment-lawyer", topicKey: "workplace_harassment" },
  { pattern: /\b(workplace\s+harassment)\b/i, cleanTopic: "Workplace Harassment", subtopic: "Unlawful Workplace Conduct", slugSuffix: "workplace-harassment-lawyer", topicKey: "workplace_harassment" },
  { pattern: /\b(sexual\s+harassment|quid\s+pro\s+quo)\b/i, cleanTopic: "Sexual Harassment", subtopic: "Misconduct & Quid Pro Quo Defense", slugSuffix: "sexual-harassment-lawyer", topicKey: "sexual_harassment" },
  { pattern: /\b(unpaid\s+overtime|overtime\s+violations?)\b/i, cleanTopic: "Unpaid Overtime", subtopic: "Overtime Pay & Misclassification", slugSuffix: "unpaid-overtime-lawyer", topicKey: "wage_theft" },
  { pattern: /\b(unpaid\s+wages|wage\s+theft)\b/i, cleanTopic: "Unpaid Wages", subtopic: "Earned Compensation & Wage Theft", slugSuffix: "unpaid-wages-lawyer", topicKey: "wage_theft" },
  { pattern: /\b(wage\s+and\s+hour|labor\s+code\s+violations?)\b/i, cleanTopic: "Wage and Hour", subtopic: "Labor Code Violations & Rest Breaks", slugSuffix: "wage-and-hour-lawyer", topicKey: "wage_theft" },
  { pattern: /\b(meal\s+and\s+rest|meal\s+breaks?|rest\s+breaks?)\b/i, cleanTopic: "Meal and Rest Breaks", subtopic: "Labor Code Violations & Meal Penalties", slugSuffix: "meal-and-rest-breaks-lawyer", topicKey: "meal_breaks" },
  { pattern: /\b(wrongful\s+termination|unlawful\s+termination|wrongful\s+discharge|unlawful\s+firing)\b/i, cleanTopic: "Wrongful Termination", subtopic: "Unlawful Firing & Retaliation", slugSuffix: "wrongful-termination-lawyer", topicKey: "wrongful_termination" }
];

export function extractCityFromText(text: string): string {
  if (!text || typeof text !== "string") return "California";

  // Informational guides and questions pertain to statewide California law
  if (isInformationalQuery(text)) {
    return "California";
  }

  // 1. Exact match against known California cities & regions (sorted by length desc)
  for (const city of CALIFORNIA_CITIES) {
    const pattern = new RegExp(`\\b${city.replace(/\s+/g, "\\s+")}\\b`, "i");
    if (pattern.test(text)) {
      return city;
    }
  }

  // 2. Dynamic regex fallback: strip legal topic & suffixes to discover custom cities
  const legalSuffixes = /\b(employment\s+lawyers?|employment\s+attorneys?|labor\s+lawyers?|labor\s+attorneys?|lawyers?|attorneys?|law\s*firm|legal\s*representation|legal\s*advocacy|law\s*office|counsel|group|advocates?)\b/gi;
  const legalTopics = /\b(sexual\s+harassment|wrongful\s+termination|unlawful\s+termination|unlawful\s+firing|wrongful\s+discharge|wage\s+theft|unpaid\s+wages|overtime\s+violations?|overtime|wage\s+and\s+hour|race\s+discrimination|racial\s+discrimination|disability\s+discrimination|pregnancy\s+discrimination|age\s+discrimination|gender\s+discrimination|sex\s+discrimination|religious\s+discrimination|national\s+origin\s+discrimination|workplace\s+harassment|hostile\s+work\s+environment|quid\s+pro\s+quo|meal\s+and\s+rest\s+breaks?|meal\s+breaks?|rest\s+breaks?|workplace\s+retaliation|whistleblower\s+retaliation|whistleblower|retaliation|severance\s+agreements?|severance|family\s+and\s+medical\s+leave|family\s+medical\s+leave|fmla|cfra|employment\s+law|labor\s+law)\b/gi;

  let candidate = text.trim();
  candidate = candidate.replace(/\b(in|for|near|around|at)\s+/gi, " ");
  candidate = candidate.replace(legalSuffixes, " ");
  candidate = candidate.replace(legalTopics, " ");
  candidate = candidate.replace(/[-–—:,]/g, " ").replace(/\s+/g, " ").trim();

  if (
    candidate.length >= 2 &&
    candidate.toLowerCase() !== "california" &&
    candidate.toLowerCase() !== "ca"
  ) {
    return candidate
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return "California";
}

export function decomposeKeyword(rawKeyword: string, rawCity?: string): DecomposedKeyword {
  const kwTrimmed = (rawKeyword || "").trim();

  // Branch 1: Informational legal guides / question articles
  if (isInformationalQuery(kwTrimmed)) {
    const city = "California";
    const cleanQuestion = kwTrimmed.replace(/\?+$/, "").trim();

    let cleanTopic = "Wrongful Termination";
    let topicKey: DecomposedKeyword["topicKey"] = "wrongful_termination";

    const rule = PRACTICE_AREA_RULES.find((r) => r.pattern.test(kwTrimmed));
    if (rule) {
      cleanTopic = rule.cleanTopic;
      topicKey = rule.topicKey;
    }

    const slug = kwTrimmed
      .toLowerCase()
      .replace(/[\x27\x22\x60]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const heroTitle = cleanQuestion;
    const lawyerTitle = `${cleanQuestion} | WP Post Project`;
    const yoastTitle = `${cleanQuestion} | WP Post Project`;
    const yoastMetaDesc = `Comprehensive California employee guide: ${cleanQuestion}. Learn your legal rights under California employment law & FEHA. Free consultation: (323) 968-0000.`;
    const yoastFocusKw = `${cleanTopic.toLowerCase()} in California`;

    return {
      city,
      cleanTopic,
      lawyerTitle,
      topicKey,
      subtopic: "California Legal Guide",
      heroTitle,
      slug,
      yoastTitle,
      yoastMetaDesc,
      yoastFocusKw,
      isArticle: true,
    };
  }

  // Branch 2: Geo-targeted practice area pages
  let city = (rawCity || "").trim();
  if (!city || city === "California") {
    city = extractCityFromText(kwTrimmed);
  }

  const rule = PRACTICE_AREA_RULES.find((r) => r.pattern.test(kwTrimmed));

  let cleanTopic = "Employment Law";
  let topicKey: DecomposedKeyword["topicKey"] = "employment_law";
  let subtopic = "Worker Rights & Advocacy";
  let slugSuffix = "employment-lawyer";

  if (rule) {
    cleanTopic = rule.cleanTopic;
    topicKey = rule.topicKey;
    subtopic = rule.subtopic;
    slugSuffix = rule.slugSuffix;
  } else {
    // Dynamic fallback for unlisted custom practice areas
    let cleaned = kwTrimmed;
    if (city && city !== "California") {
      cleaned = cleaned.replace(new RegExp(`\\b${city.replace(/\s+/g, "\\s+")}\\b`, "gi"), "");
    }
    cleaned = cleaned.replace(
      /\b(employment\s+lawyers?|employment\s+attorneys?|labor\s+lawyers?|labor\s+attorneys?|lawyers?|attorneys?|law\s*firm|legal\s*representation|legal\s*advocacy|law\s*office|counsel|group|advocates?)\b/gi,
      ""
    );
    cleaned = cleaned.replace(/\b(in|for|near|around)\s+[A-Za-z\s]+\b/gi, "");
    cleaned = cleaned.trim().replace(/^[-–—:,\s]+|[-–—:,\s]+$/g, "");
    if (cleaned.length >= 3) {
      cleanTopic = cleaned
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
      subtopic = "Workplace Justice";
      const topicSlugPart = cleanTopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      slugSuffix = `${topicSlugPart}-lawyer`;
    }
  }

  const lawyerTitle = `${city} ${cleanTopic} Lawyer`;
  const heroTitle = `${city} ${cleanTopic} Employment Lawyers - ${subtopic}`;
  const citySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const slug = `${citySlug}-${slugSuffix}`.replace(/-+/g, "-").replace(/^-|-$/g, "");

  const yoastTitle = `${city} ${cleanTopic} Lawyer | WP Post Project`;
  const yoastMetaDesc = practiceMetaDescription(city, cleanTopic, topicKey);
  const yoastFocusKw = `${city} ${cleanTopic.toLowerCase()} lawyer`;

  return {
    city,
    cleanTopic,
    lawyerTitle,
    topicKey,
    subtopic,
    heroTitle,
    slug,
    yoastTitle,
    yoastMetaDesc,
    yoastFocusKw,
    isArticle: false,
  };
}
