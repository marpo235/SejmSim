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
    coalition: true,
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
}

export const DEFAULT_SHARES: Record<PartyId, number> = {
  KO: 30.5,
  PIS: 21.5,
  KONF: 17.5,
  KKP: 11.5,
  LEW: 5.8,
  RP: 5.5,
  RAZ: 3.8,
  PSL: 2.6,
  P2050: 0.8,
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

export interface Preset {
  name: string;
  description: string;
  shares: Partial<Record<PartyId, number>>;
}

export const PRESETS: Preset[] = [
  {
    name: "Pałade Baseline",
    description: "Fragmented right surge; Lewica and R+ barely over the line.",
    shares: {
      KO: 30.5,
      PIS: 21.5,
      KONF: 17.5,
      KKP: 11.5,
      LEW: 5.8,
      RP: 5.5,
      RAZ: 3.8,
      PSL: 2.6,
      P2050: 0.8,
    },
  },
  {
    name: "Bipolar Maximum",
    description: "Two-bloc consolidation; R+ dies below the threshold.",
    shares: {
      KO: 34,
      PIS: 25,
      KONF: 18,
      KKP: 10,
      LEW: 5.5,
      RP: 4.8,
      RAZ: 0,
      PSL: 0,
      P2050: 0,
    },
  },
  {
    name: "Right-Wing Majority",
    description: "PiS + Konfederacja + KKP combined majority path.",
    shares: {
      PIS: 24,
      KONF: 18,
      KKP: 12,
      KO: 29,
      LEW: 6,
      RP: 5,
      RAZ: 0,
      PSL: 0,
      P2050: 0,
    },
  },
  {
    name: "Tusk Megalist",
    description: "KO absorbs PSL & P2050 into a single joint committee.",
    shares: {
      KO: 40,
      PIS: 23,
      KONF: 16,
      KKP: 8,
      LEW: 6.5,
      RP: 4,
      RAZ: 2.5,
      PSL: 0,
      P2050: 0,
    },
  },
];
