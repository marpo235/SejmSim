// Sanity-check the built worker bundle in Node (ESM worker, stubbed self).
import { fileURLToPath, pathToFileURL } from "node:url";
import { readdirSync } from "node:fs";

const assets = fileURLToPath(new URL("../dist/assets/", import.meta.url));
const workerFile = readdirSync(assets).find((f) => f.startsWith("worker-") && f.endsWith(".js"));
if (!workerFile) throw new Error("worker bundle not found — run `npm run build` first");

const scenario = {
  shares: { RAZ: 3.8, LEW: 5.8, KO: 30.5, RP: 5.5, P2050: 0.8, PSL: 2.6, PIS: 21.5, KONF: 6.2, KKP: 11.5 },
  autoNormalize: true,
  alpha: { RAZ: 1, LEW: 1, KO: 1, RP: 0, P2050: 1, PSL: 1, PIS: 1, KONF: 1, KKP: 1 },
  w25: 0.75,
  sigma: 0.08,
  coalitionFlag: { RAZ: false, LEW: false, KO: true, RP: false, P2050: false, PSL: false, PIS: false, KONF: false, KKP: false },
  iterations: 10000,
};

const t0 = Date.now();
let resolve;
const done = new Promise((r) => (resolve = r));
globalThis.self = {
  onmessage: null,
  postMessage: (msg) => {
    if (msg.type === "done") resolve(msg.result);
  },
};

await import(pathToFileURL(assets + workerFile).href);
self.onmessage({
  data: { type: "run", scenario, seed: 12345, coalition: ["KO", "LEW", "RAZ"] },
});

const r = await done;
console.log(`iterations: ${r.iterations} in ${r.elapsedMs.toFixed(0)}ms (wall ${Date.now() - t0}ms)`);
console.log("party | p10 p50 p90 | P(S=0) | P(C<thr)");
for (const d of r.distributions) {
  console.log(
    `${d.party.padEnd(5)} | ${String(d.p10).padStart(3)} ${String(d.p50).padStart(3)} ${String(d.p90).padStart(3)} | ${(d.pZeroSeats * 100).toFixed(1).padStart(5)}% | ${(d.pBelowThreshold * 100).toFixed(1).padStart(5)}%`
  );
}
const detSum = Object.values(r.deterministicSeats).reduce((a, b) => a + b, 0);
console.log("deterministic seats:", r.deterministicSeats, "sum:", detSum);
for (const c of r.coalitions) {
  console.log(`${c.name}: P(231)=${(c.pMajority * 100).toFixed(1)}% P(276)=${(c.pConstitutional * 100).toFixed(1)}% med=${c.medianSeats}`);
}
if (r.customCoalition) {
  console.log(`custom KO+LEW+RAZ: P(231)=${(r.customCoalition.pMajority * 100).toFixed(1)}% med=${r.customCoalition.medianSeats}`);
}
