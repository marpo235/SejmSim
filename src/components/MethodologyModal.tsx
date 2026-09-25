import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function MethodologyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl focus:outline-none">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <DialogPrimitive.Title className="text-lg font-bold text-slate-100">
                Mathematical methodology
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-xs text-slate-500">
                Six-stage disaggregated D'Hondt engine — runs entirely in your browser via a Web Worker.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 cursor-pointer">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>

          <div className="space-y-4 text-sm leading-relaxed text-slate-300">
            <Stage n={1} title="Logit-normal polling sampler">
              National vectors are drawn in log-ratio space. With the residual
              "others" bucket as reference (Z=0):
              <Formula>{"Zₖ ~ N(μₖ, Σ),  μₖ = ln(C̄ₖ / C̄_ref),  C = softmax(Z)"}</Formula>
              Σ combines independent poll error σ (configurable) with an
              equicorrelated common shock (ρ = 0.25), so correlated polling
              misses are represented. Every draw satisfies ΣCₖ = 1.
            </Stage>

            <Stage n={2} title="Prior construction g(k,d)">
              Smoothed geographic shapes from official PKW matrices — the 2023
              Sejm per-district results and the 2025 presidential first round
              (32k precincts re-aggregated into the 41 sejm districts):
              <Formula>{"gₖ,𝒹 ∝ w₂₅·s²⁵ₖ,𝒹 + (1−w₂₅)·s²³ₖ,𝒹 + ε_Laplace"}</Formula>
              Candidate→committee mapping: Trzaskowski→KO, Nawrocki+Jakubiak→PiS,
              Mentzen→Konfederacja, Braun→KKP, Zandberg→Razem, Biejat→Lewica,
              Hołownia→PSL/P2050 (PSL fielded no candidate). Parties without a
              historical footprint (R+) use a flat prior.
            </Stage>

            <Stage n={3} title="Disaggregation & dispersion">
              Latent support per district combines the sampled national share
              with the committee's geographic shape raised to a persistence
              exponent:
              <Formula>{"Lₖ,𝒹 = Cₖ · (gₖ,𝒹)^αₖ,   V_raw = L / ΣⱼLⱼ,𝒹"}</Formula>
              α ∈ [0, 1.5]: 0 flattens to the national share everywhere, 1 keeps
              the empirical shape, &gt;1 exaggerates regional concentration.
            </Stage>

            <Stage n={4} title="National gatekeeper">
              Committees below their national threshold (5% single party, 8%
              formal coalition) are masked to zero in every district. Their
              votes are eliminated locally — not reallocated — replicating
              wasted-vote mechanics:
              <Formula>{"Cₖ < τₖ ⇒ V⁹ₖ,𝒹 = 0  ∀𝒹"}</Formula>
            </Stage>

            <Stage n={5} title="District D'Hondt">
              Inside each of the 41 districts, quotients are generated for every
              qualifying list and the M𝒹 seats (7–20 per district) go to the
              highest:
              <Formula>{"qₖ,𝒹,𝓂 = V⁹ₖ,𝒹 / m,  m ∈ {1..M𝒹}"}</Formula>
              Non-monotonicity vs national simulators appears naturally —
              mid-size committees stranded near thresholds lose seats to
              geographically efficient rivals.
            </Stage>

            <Stage n={6} title="Flip diagnostics">
              For each committee in each district, the exact additional
              qualified share needed to capture the marginal quotient q*:
              <Formula>{"ΔVₖ,𝒹 = (Sₖ,𝒹 + 1)·q*𝒹 − V⁹ₖ,𝒹"}</Formula>
            </Stage>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
              <b className="text-slate-300">Data sources (official PKW):</b>{" "}
              Sejm 2023 per-district list results; 2025 presidential R1
              per-precinct protocols (31,628 domestic precincts re-aggregated
              via TERYT gmina→okręg bridge); district magnitudes from PKW
              okręgi registry. Map geometry derived from open MIT-licensed
              district boundaries. Abroad/ship precincts are excluded (not part
              of any sejm district).
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function Stage({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1 text-[13px] font-semibold text-slate-200">
        <span className="num mr-1.5 text-amber-500">{n}.</span>
        {title}
      </h3>
      <div className="text-[13px] text-slate-400">{children}</div>
    </div>
  );
}

function Formula({ children }: { children: string }) {
  return (
    <pre className="num my-1.5 overflow-x-auto rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-[12px] text-emerald-300/90">
      {children}
    </pre>
  );
}
