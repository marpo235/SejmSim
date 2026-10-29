/** Committee registry. Order drives UI lists and the hemicycle's left→right spectrum. */
export const PARTY_IDS = [
  "RAZ",
  "LEW",
  "KO",
  "RP",
  "P2050",
  "PSL",
  "PIS",
  "KONF",
  "KKP",
] as const;
export type PartyId = (typeof PARTY_IDS)[number];

export interface PartyDef {
  id: PartyId;
  name: string;
  short: string;
  color: string;
  /** Electoral-committee type: formal coalitions need 8%, single parties 5%. */
  coalition: boolean;
  /** Left→right hemicycle ordering key. */
  spectrum: number;
  /**
   * Prior mapping: which column family supplies this committee's geographic
   * shape g_{k,d} from the 2023 Sejm matrix and the 2025 presidential matrix.
   */
  prior23: "KO" | "PIS" | "KONF" | "NL" | "TD" | "FLAT";
  prior25:
    | "TRZASKOWSKI"
    | "NAWROCKI"
    | "MENTZEN"
    | "BRAUN"
    | "ZANDBERG"
    | "BIEJAT"
    | "HOŁOWNIA"
    | "FLAT";
  defaultAlpha: number;
}

export const PARTIES: Record<PartyId, PartyDef> = {
  RAZ: {
    id: "RAZ",
    name: "Razem",
    short: "RAZ",
    color: "#b0268f",
    coalition: false,
    spectrum: 0,
    // Razem ran inside Nowa Lewica in 2023; Zandberg supplies the 2025 shape.
    prior23: "NL",
    prior25: "ZANDBERG",
    defaultAlpha: 1.0,
  },
  LEW: {
    id: "LEW",
    name: "Lewica",
    short: "Lew",
    color: "#e30613",
    coalition: false,
    spectrum: 1,
    prior23: "NL",
    prior25: "BIEJAT",
    defaultAlpha: 1.0,
  },
  KO: {
    id: "KO",
    name: "Koalicja Obywatelska",
    short: "KO",
    color: "#f5a623",
    coalition: true,
    spectrum: 2,
    prior23: "KO",
    prior25: "TRZASKOWSKI",
    defaultAlpha: 1.0,
  },
  RP: {
    id: "RP",
    name: "Rozwój Plus",
    short: "R+",
    color: "#4a90e2",
    coalition: false,
    spectrum: 3,
    // No historical footprint — flat prior; α default 0 keeps it uniform.
    prior23: "FLAT",
    prior25: "FLAT",
    defaultAlpha: 0.0,
  },
  P2050: {
    id: "P2050",
    name: "Polska 2050",
    short: "P2050",
    color: "#e8c832",
    coalition: false,
    spectrum: 4,
    prior23: "TD",
    prior25: "HOŁOWNIA",
    defaultAlpha: 1.0,
  },
  PSL: {
    id: "PSL",
    name: "Polskie Stronnictwo Ludowe",
    short: "PSL",
    color: "#2e9e4f",
    coalition: false,
    spectrum: 5,
    prior23: "TD",
    prior25: "HOŁOWNIA",
    defaultAlpha: 1.0,
  },
  PIS: {
    id: "PIS",
    name: "Prawo i Sprawiedliwość",
    short: "PiS",
    color: "#3570c4",
    coalition: false,
    spectrum: 6,
    prior23: "PIS",
    // Jakubiak's right-wing electorate is folded into the PiS-side shape.
    prior25: "NAWROCKI",
    defaultAlpha: 1.0,
  },
  KONF: {
    id: "KONF",
    name: "Konfederacja",
    short: "Konf",
    color: "#4a7ba6",
    coalition: false,
    spectrum: 7,
    prior23: "KONF",
    prior25: "MENTZEN",
    defaultAlpha: 1.0,
  },
  KKP: {
    id: "KKP",
    name: "Konfederacja Korony Polskiej",
    short: "KKP",
    color: "#8b0000",
    coalition: false,
    spectrum: 8,
    // Braun ran inside Konfederacja WiN in 2023.
    prior23: "KONF",
    prior25: "BRAUN",
    defaultAlpha: 1.0,
  },
};

export const SPECTRUM_ORDER: PartyId[] = [...PARTY_IDS].sort(
  (a, b) => PARTIES[a].spectrum - PARTIES[b].spectrum
);

/**
 * Konfederacja sub-faction breakout — display layer only.
 * KONF remains a single electoral committee in the engine; this mapping only
 * decides which faction occupies each seat Konfederacja wins in a district.
 * "NN" = Nowa Nadzieja (Mentzen), "RN" = Ruch Narodowy (Bosak).
 */
export type KonfFaction = "NN" | "RN";
export const KONF_FACTIONS: Record<
  KonfFaction,
  { name: string; short: string; color: string }
> = {
  NN: { name: "Nowa Nadzieja", short: "NN", color: "#7fb3d4" },
  RN: { name: "Ruch Narodowy", short: "RN", color: "#14294b" },
};

/**
 * Historical Konfederacja list leaders ("jedynki") per district from the
 * 2023 election, compressed to the two factions modelled here — KKP
 * (Korona/Braun) runs as its own committee, so its 2023 list leaders are
 * reassigned to the remaining factions in the 23 NN / 18 RN proportion.
 * Index 0..40 = district 1..41.
 */
export const KONF_JEDYNKI: readonly KonfFaction[] = [
  "NN", "RN", "RN", "RN", "NN", "NN", "RN", "RN", "NN", "RN", // 1-10
  "RN", "NN", "NN", "NN", "NN", "RN", "RN", "RN", "NN", "NN", // 11-20
  "NN", "NN", "NN", "RN", "RN", "NN", "NN", "RN", "NN", "RN", // 21-30
  "NN", "NN", "RN", "NN", "RN", "RN", "RN", "NN", "NN", "NN", // 31-40
  "NN",                                                       // 41
];

export interface Scenario {
  /** National vote share inputs in percent; residual is "others". */
  shares: Record<PartyId, number>;
  autoNormalize: boolean;
  /** Per-party geographic persistence exponent α_k ∈ [0, 1.5]. */
  alpha: Record<PartyId, number>;
  /** Weight of the 2025 presidential shape vs the 2023 Sejm shape. */
  w25: number;
  /** Logit-space sampling volatility σ. */
  sigma: number;
  /** Committee-type overrides: true = 8% coalition threshold. */
  coalitionFlag: Record<PartyId, boolean>;
  iterations: number;
  /**
   * Merged-committee geography: target → { component → national-share weight }.
   * The target's district shape becomes the share-weighted mean of the
   * components' prior shapes (e.g. a KO+PSL+P2050+Lewica superlist blends
   * all four geographies before α is applied). Set by merged presets.
   */
  dispersionBlend?: Partial<Record<PartyId, Partial<Record<PartyId, number>>>>;
}

export const DEFAULT_SHARES: Record<PartyId, number> = {
  KO: 31.0,
  PIS: 21.0,
  KONF: 17.0,
  KKP: 12.0,
  LEW: 6.0,
  RP: 5.5,
  RAZ: 3.8,
  PSL: 2.6,
  P2050: 1.0,
};

export function defaultScenario(): Scenario {
  const alpha = {} as Record<PartyId, number>;
  const coalitionFlag = {} as Record<PartyId, boolean>;
  for (const id of PARTY_IDS) {
    alpha[id] = PARTIES[id].defaultAlpha;
    coalitionFlag[id] = PARTIES[id].coalition;
  }
  return {
    shares: { ...DEFAULT_SHARES },
    autoNormalize: true,
    alpha,
    w25: 0.75,
    sigma: 0.08,
    coalitionFlag,
    iterations: 10000,
  };
}

/**
 * Coalition-builder member: a real committee or — when the KONF split
 * toggle is on — one of the two Konfederacja factions.
 */
export type CoalitionMember = PartyId | KonfFaction;
export const KONF_MEMBER_IDS: KonfFaction[] = ["NN", "RN"];

/**
 * Vote-transfer rule for merged committees: `keep` of `from`'s share follows
 * `into`, `redirect` fractions flow to named parties, the remainder drops to
 * the "other"/abstention residual. `from` is zeroed out.
 */
export interface MergeSpec {
  into: PartyId;
  from: PartyId;
  /** fraction of `from`'s share that follows onto the joint list */
  keep: number;
  /** fractions of `from`'s share redirected to other committees */
  redirect?: Partial<Record<PartyId, number>>;
}

export interface Preset {
  name: string;
  description: string;
  /**
   * Poll-source / scenario bucket shown in the sidebar:
   * "palade" & "ewybory" live under SONDAŻE, the "tusk*" buckets under
   * SCENARIUSZE (one superlist family per poll source).
   */
  group: "palade" | "ewybory" | "tuskpalade" | "tuskewybory";
  /**
   * Poll period tag "MM/YY". The top-bar preset dropdown only lists presets
   * from the most recent period found here.
   */
  period: string;
  shares: Partial<Record<PartyId, number>>;
  merges?: MergeSpec[];
}

/**
 * Shared superlist transfer model: PSL & P2050 fold into KO at 100% (centrist
 * transfer — near-guaranteed same-list partners); Lewica keeps ~67% on the
 * joint list, ~13% defects to Razem (bounded — NL's older electorate vs
 * Razem's young one), ~20% stays home / poll inflation.
 */
const TUSK_MERGES: MergeSpec[] = [
  { into: "KO", from: "PSL", keep: 1 },
  { into: "KO", from: "P2050", keep: 1 },
  { into: "KO", from: "LEW", keep: 0.67, redirect: { RAZ: 0.13 } },
];

/**
 * Short labels used inside a merged committee's composite name
 * (e.g. "KO+NL+PSL+PL2050"); falls back to PARTIES[p].short.
 */
export const MERGE_MEMBER_SHORTS: Partial<Record<PartyId, string>> = {
  LEW: "NL",
  P2050: "PL2050",
};

export const PRESETS: Preset[] = [
  {
    name: "Marcin Palade Baseline",
    description: "Fragmented right surge; Lewica and R+ barely over the line.",
    group: "palade",
    period: "09/26",
    shares: {
      KO: 31.0,
      PIS: 21.0,
      KONF: 17.0,
      KKP: 12.0,
      LEW: 6.0,
      RP: 5.5,
      RAZ: 3.8,
      PSL: 2.6,
      P2050: 1.0,
    },
  },
  {
    name: "ewybory.eu Average",
    description: "Public polling average baseline from ewybory.eu.",
    group: "ewybory",
    period: "09/26",
    shares: {
      KO: 30.8,
      PIS: 19.1,
      KONF: 13.5,
      KKP: 8.4,
      LEW: 7.2,
      RP: 5.1,
      RAZ: 3.8,
      PSL: 3.0,
      P2050: 2.5,
    },
  },
  {
    name: "09/26 wg Marcin Palade",
    description: "Marcin Palade September 2026 polling baseline.",
    group: "palade",
    period: "09/26",
    shares: {
      KO: 32.4,
      PIS: 21.2,
      KONF: 16.3,
      KKP: 10.9,
      LEW: 6.2,
      RP: 5.7,
      RAZ: 4.3,
      PSL: 2.6,
      P2050: 0.4,
    },
  },
  {
    name: "10/26 wg Marcin Palade",
    description: "Marcin Palade October 2026 polling.",
    group: "palade",
    period: "10/26",
    shares: {
      KO: 31.9,
      PIS: 20.8,
      KONF: 15.2,
      KKP: 11.9,
      LEW: 6.3,
      RP: 5.5,
      RAZ: 4.0,
      PSL: 3.6,
      P2050: 0.8,
    },
  },
  {
    name: "10/26 wg ewybory.eu",
    description: "Public polling average from ewybory.eu, October 2026.",
    group: "ewybory",
    period: "10/26",
    shares: {
      KO: 31.4,
      PIS: 20.0,
      KONF: 12.9,
      KKP: 9.1,
      LEW: 6.4,
      RP: 4.9,
      RAZ: 3.8,
      PSL: 3.0,
      P2050: 1.3,
    },
  },
  {
    name: "Tusk Megalist Palade 09/26",
    description:
      "Joint KO+PSL+P2050+NL committee on the Marcin Palade September 2026 poll. PSL & P2050 transfer fully; Lewica keeps ~67% (13% defects to Razem, 20% stays home / poll inflation).",
    group: "tuskpalade",
    period: "09/26",
    shares: {
      KO: 32.4,
      PIS: 21.2,
      KONF: 16.3,
      KKP: 10.9,
      LEW: 6.2,
      RP: 5.7,
      RAZ: 4.3,
      PSL: 2.6,
      P2050: 0.4,
    },
    merges: TUSK_MERGES,
  },
  {
    name: "Tusk Megalist Palade 10/26",
    description:
      "Joint KO+PSL+P2050+NL committee on the Marcin Palade October 2026 poll. PSL & P2050 transfer fully; Lewica keeps ~67% (13% defects to Razem, 20% stays home / poll inflation).",
    group: "tuskpalade",
    period: "10/26",
    shares: {
      KO: 31.9,
      PIS: 20.8,
      KONF: 15.2,
      KKP: 11.9,
      LEW: 6.3,
      RP: 5.5,
      RAZ: 4.0,
      PSL: 3.6,
      P2050: 0.8,
    },
    merges: TUSK_MERGES,
  },
  {
    name: "Tusk Megalist ewybory 09/26",
    description:
      "Joint KO+PSL+P2050+NL committee on the ewybory.eu September 2026 average. PSL & P2050 transfer fully; Lewica keeps ~67% (13% defects to Razem, 20% stays home / poll inflation).",
    group: "tuskewybory",
    period: "09/26",
    shares: {
      KO: 30.8,
      PIS: 19.1,
      KONF: 13.5,
      KKP: 8.4,
      LEW: 7.2,
      RP: 5.1,
      RAZ: 3.8,
      PSL: 3.0,
      P2050: 2.5,
    },
    merges: TUSK_MERGES,
  },
  {
    name: "Tusk Megalist ewybory 10/26",
    description:
      "Joint KO+PSL+P2050+NL committee on the ewybory.eu October 2026 average. PSL & P2050 transfer fully; Lewica keeps ~67% (13% defects to Razem, 20% stays home / poll inflation).",
    group: "tuskewybory",
    period: "10/26",
    shares: {
      KO: 31.4,
      PIS: 20.0,
      KONF: 12.9,
      KKP: 9.1,
      LEW: 6.4,
      RP: 4.9,
      RAZ: 3.8,
      PSL: 3.0,
      P2050: 1.3,
    },
    merges: TUSK_MERGES,
  },
];

/** Sidebar group ordering: poll sources vs hypothetical scenarios. */
export const POLL_GROUPS = ["palade", "ewybory"] as const;
export const SCENARIO_GROUPS = ["tuskpalade", "tuskewybory"] as const;
export type PresetGroupId = (typeof POLL_GROUPS)[number] | (typeof SCENARIO_GROUPS)[number];

export function presetsInGroup(group: PresetGroupId): Preset[] {
  return PRESETS.filter((p) => p.group === group);
}

/** "MM/YY" → comparable numeric key (year*12+month); garbage → -1. */
export function periodValue(period: string): number {
  const m = period.match(/^(\d{2})\/(\d{2})$/);
  return m ? +m[2] * 12 + +m[1] : -1;
}

/** Most recent period tag across all presets — drives the top-bar filter. */
export function latestPresetPeriod(): string | null {
  let best: string | null = null;
  let bestV = -1;
  for (const pr of PRESETS) {
    const v = periodValue(pr.period);
    if (v > bestV) {
      bestV = v;
      best = pr.period;
    }
  }
  return best;
}
