import {
  PARTY_IDS,
  PARTIES,
  defaultScenario,
  type PartyId,
  type Scenario,
} from "@/data/parties";
import type { Lang } from "./i18n";

/** Serialize the full scenario + view state into a compact query string. */
export interface AppState {
  scenario: Scenario;
  coalition: PartyId[];
  district: number | null;
  tab: "det" | "mc";
  lang: Lang;
}

export function encodeState(s: AppState): string {
  const p = new URLSearchParams();
  for (const id of PARTY_IDS) {
    if (s.scenario.shares[id] !== defaultShares()[id]) {
      p.set(id.toLowerCase(), trim(s.scenario.shares[id]));
    }
  }
  if (!s.scenario.autoNormalize) p.set("norm", "0");
  if (s.scenario.w25 !== 0.75) p.set("w25", trim(s.scenario.w25));
  if (s.scenario.sigma !== 0.08) p.set("sig", trim(s.scenario.sigma));
  if (s.scenario.iterations !== 10000) p.set("it", String(s.scenario.iterations));
  const alphaParts = PARTY_IDS.filter(
    (id) => s.scenario.alpha[id] !== PARTIES[id].defaultAlpha
  ).map((id) => `${id.toLowerCase()}${trim(s.scenario.alpha[id])}`);
  if (alphaParts.length) p.set("a", alphaParts.join(","));
  const coalFlags = PARTY_IDS.filter(
    (id) => s.scenario.coalitionFlag[id] !== PARTIES[id].coalition
  ).map((id) => `${id.toLowerCase()}${s.scenario.coalitionFlag[id] ? "1" : "0"}`);
  if (coalFlags.length) p.set("cf", coalFlags.join(","));
  if (s.coalition.length) p.set("coal", s.coalition.join(",").toLowerCase());
  if (s.district != null) p.set("d", String(s.district));
  if (s.tab !== "det") p.set("t", s.tab);
  p.set("lang", s.lang);
  const q = p.toString();
  return q ? `?${q}` : "";
}

const DEFAULTS = defaultScenario();
function defaultShares() {
  return DEFAULTS.shares;
}
function trim(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

const SHORT: Record<string, PartyId> = {
  raz: "RAZ",
  lew: "LEW",
  ko: "KO",
  rp: "RP",
  p2050: "P2050",
  psl: "PSL",
  pis: "PIS",
  konf: "KONF",
  kkp: "KKP",
};

export function decodeState(search: string): AppState {
  const p = new URLSearchParams(search);
  const s = defaultScenario();
  for (const id of PARTY_IDS) {
    const v = p.get(id.toLowerCase());
    if (v != null) {
      const n = parseFloat(v);
      if (Number.isFinite(n)) s.shares[id] = Math.min(100, Math.max(0, n));
    }
  }
  if (p.get("norm") === "0") s.autoNormalize = false;
  const w25 = parseFloat(p.get("w25") ?? "");
  if (Number.isFinite(w25)) s.w25 = Math.min(1, Math.max(0, w25));
  const sig = parseFloat(p.get("sig") ?? "");
  if (Number.isFinite(sig)) s.sigma = Math.min(0.5, Math.max(0.01, sig));
  const it = parseInt(p.get("it") ?? "", 10);
  if (Number.isFinite(it)) s.iterations = Math.min(100000, Math.max(100, it));
  const a = p.get("a");
  if (a) {
    for (const part of a.split(",")) {
      const m = part.match(/^([a-z0-9]+?)([\d.]+)$/);
      if (m && SHORT[m[1]]) {
        s.alpha[SHORT[m[1]]] = Math.min(1.5, Math.max(0, parseFloat(m[2])));
      }
    }
  }
  const cf = p.get("cf");
  if (cf) {
    for (const part of cf.split(",")) {
      const m = part.match(/^([a-z0-9]+?)([01])$/);
      if (m && SHORT[m[1]]) s.coalitionFlag[SHORT[m[1]]] = m[2] === "1";
    }
  }
  const coalition = (p.get("coal") ?? "")
    .split(",")
    .map((x) => SHORT[x.trim()])
    .filter((x): x is PartyId => !!x);
  const d = parseInt(p.get("d") ?? "", 10);
  const district = Number.isFinite(d) && d >= 1 && d <= 41 ? d : null;
  const tab = p.get("t") === "mc" ? "mc" : "det";
  const lang: Lang = p.get("lang") === "en" ? "en" : "pl";
  return { scenario: s, coalition, district, tab, lang };
}
