import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useLang, useT } from "@/lib/i18n";

export function MethodologyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const t = useT();
  const lang = useLang();
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl focus:outline-none">
          <div className="mb-4 flex items-start justify-between">
            <DialogPrimitive.Title className="text-lg font-bold text-slate-100">
              {t.methodologyTitle}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 cursor-pointer">
              <X size={18} />
            </DialogPrimitive.Close>
          </div>
          <DialogPrimitive.Description className="sr-only">
            {t.methodologyTitle}
          </DialogPrimitive.Description>

          {lang === "en" ? <EnContent /> : <div className="space-y-5 text-sm leading-relaxed text-slate-300">
            <section>
              <h3 className="mb-1.5 text-[14px] font-semibold text-slate-100">
                Dlaczego standardowe symulatory się mylą?
              </h3>
              <p className="text-slate-400">
                Większość kalkulatorów wyborczych przelicza poparcie krajowe na mandaty za
                pomocą jednego, ogólnopolskiego wzoru D'Hondta. W polskim systemie
                wyborczym jest to błąd – wybory do Sejmu nie odbywają się w jednym okręgu,
                lecz w <b className="text-slate-200">41 odrębnych okręgach wyborczych</b> o
                wielkości od 7 do 20 mandatów.
              </p>
              <p className="mt-2 text-slate-400">
                Model <b className="text-slate-200">SejmSim 2027</b> eliminuje ten błąd,
                wykonując pełną dysagregację poparcia krajowego do poziomu poszczególnych
                okręgów przed obliczeniem ilorazów D'Hondta.
              </p>
            </section>

            <hr className="border-slate-800" />

            <section>
              <h3 className="mb-3 text-[14px] font-semibold uppercase tracking-wider text-slate-200">
                Kluczowe Filary Symulatora
              </h3>

              <div className="space-y-4">
                <Pillar n={1} title="Rzeczywisty Próg Wyborczy (Krajowa Bramka)">
                  <p>
                    Zgodnie z Kodeksem Wyborczym, w podziale mandatów uczestniczą wyłącznie
                    komitety, które przekroczą progi krajowe:
                  </p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-slate-400">
                    <li>
                      <b className="text-slate-200">5%</b> dla komitetów partyjnych (np. KO,
                      PiS, Konfederacja, Lewica, KKP).
                    </li>
                    <li>
                      <b className="text-slate-200">8%</b> dla formalnych koalicji
                      wyborczych.
                    </li>
                  </ul>
                  <p className="mt-1.5">
                    Głosy oddane na komitety, które nie przekraczają progu, są odrzucane.
                    Model nie tworzy „centralnej puli zmarnowanych głosów” – ich eliminacja
                    następuje lokalnie w każdym z 41 okręgów.
                  </p>
                </Pillar>

                <Pillar n={2} title="Dwuetapowa Projekcja Przestrzenna (Matryca 41 Okręgów)">
                  <p>
                    Poparcie z sondaży krajowych jest przekładane na poparcie w okręgach na
                    podstawie unikalnego profilu geograficznego każdego ugrupowania. Profil
                    ten bazuje na danych przestrzennych z{" "}
                    <b className="text-slate-200">wyborów parlamentarnych 2023</b> oraz{" "}
                    <b className="text-slate-200">I tury wyborów prezydenckich 2025</b>.
                  </p>
                  <p className="mt-1.5">
                    Pozwala to precyzyjnie odwzorować rzeczywiste bastiony i zagęszczenie
                    elektoratów (np. wyższą efektywność ugrupowań prawicowych w okręgach
                    wschodnich czy koncentrację Lewicy w wielkich miastach).
                  </p>
                </Pillar>

                <Pillar n={3} title="Parametr Geograficznej Persystencji i Dyspersji">
                  <p>
                    Model odróżnia ugrupowania o zakorzenionej geografii (np. KO, PiS) od
                    ugrupowań o poparciu „płaskim” lub nowych inicjatyw bez zaplecza
                    regionalnego. Zapobiega to sztucznemu zawyżaniu lub zaniżaniu liczby
                    mandatów dla ugrupowań krążących wokół progu wyborczego.
                  </p>
                </Pillar>

                <Pillar
                  n={4}
                  title={
                    <>
                      Lokalny D'Hondt i Wskaźnik Odwrócenia Mandatu (
                      <span className="num">ΔV<sup>flip</sup></span>)
                    </>
                  }
                >
                  <p>
                    W każdym z 41 okręgów symulator wykonuje niezależny podział mandatów
                    metodą D'Hondta. Dodatkowo model oblicza diagnostyczny{" "}
                    <b className="text-slate-200">
                      wskaźnik odwrócenia mandatu (
                      <span className="num">ΔV<sup>flip</sup></span>)
                    </b>{" "}
                    – pokazuje on w czasie rzeczywistym, ile punktów procentowych (i
                    głosów) brakuje danej partii w konkretnym okręgu, aby odebrać ostatni
                    przyznany mandat konkurentowi.
                  </p>
                </Pillar>

                <Pillar n={5} title="Symulacja Stochastyczna Monte Carlo (10 000 Iteracji)">
                  <p>
                    Aby uwzględnić błąd próby sondażowej oraz przepływy między partiami,
                    silnik przeprowadza 10 000 niezależnych losowań w tle (za pomocą Web
                    Workerów). Daje to pełen obraz prawdopodobieństwa:
                  </p>
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-slate-400">
                    <li>
                      Przedziały ufności mandatów (
                      <span className="num">
                        P<sub>10</sub>, P<sub>50</sub>, P<sub>90</sub>
                      </span>
                      ).
                    </li>
                    <li>
                      Ryzyko śmiertelności progowej (prawdopodobieństwo wypadnięcia z
                      Sejmu).
                    </li>
                    <li>
                      Prawdopodobieństwo zbudowania większości rządzącej (
                      <span className="num">≥ 231</span> mandatów).
                    </li>
                  </ul>
                </Pillar>
              </div>
            </section>

            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-500">
              <b className="text-slate-400">Źródła danych:</b> oficjalne wyniki PKW — Sejm
              2023 (wyniki list per okręg) oraz I tura prezydenckich 2025 (protokoły
              obwodowe zagregowane do okręgów sejmowych). Obwody za granicą i na statkach
              pominięte — nie należą do żadnego okręgu sejmowego.
            </div>
          </div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function EnContent() {
  return (
    <div className="space-y-5 text-sm leading-relaxed text-slate-300">
      <section>
        <h3 className="mb-1.5 text-[14px] font-semibold text-slate-100">
          Why National Simulators Fail
        </h3>
        <p className="text-slate-400">
          Most election calculators translate national polling into seats using a
          single, nationwide D'Hondt formula. Under the Polish electoral system that
          is simply wrong — Sejm elections are not held in one constituency, but in{" "}
          <b className="text-slate-200">41 separate electoral districts</b> electing
          between 7 and 20 members each.
        </p>
        <p className="mt-2 text-slate-400">
          <b className="text-slate-200">SejmSim 2027</b> eliminates this bias by
          fully disaggregating national support down to individual districts before
          computing the D'Hondt quotients.
        </p>
      </section>

      <hr className="border-slate-800" />

      <section>
        <h3 className="mb-3 text-[14px] font-semibold uppercase tracking-wider text-slate-200">
          Five Core Model Pillars
        </h3>

        <div className="space-y-4">
          <Pillar n={1} title="The Real Electoral Threshold (National Gatekeeper)">
            <p>
              In line with the Electoral Code, only committees that clear the
              national thresholds take part in seat allocation:
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-slate-400">
              <li>
                <b className="text-slate-200">5%</b> for party committees (e.g. KO,
                PiS, Konfederacja, Lewica, KKP).
              </li>
              <li>
                <b className="text-slate-200">8%</b> for formal electoral
                coalitions.
              </li>
            </ul>
            <p className="mt-1.5">
              Votes cast for committees that fall below the threshold are
              discarded. The model does not pool "wasted votes" nationally — they
              are eliminated locally, independently in each of the 41 districts.
            </p>
          </Pillar>

          <Pillar n={2} title="Two-Stage Spatial Projection (41-District Matrix)">
            <p>
              National polling numbers are translated into district-level support
              using each party's unique geographic profile. That profile is built
              from spatial data of the{" "}
              <b className="text-slate-200">2023 parliamentary election</b> and the{" "}
              <b className="text-slate-200">2025 presidential first round</b>.
            </p>
            <p className="mt-1.5">
              This lets the model faithfully reproduce real strongholds and voter
              density patterns (e.g. the higher efficiency of right-wing parties in
              eastern districts, or Lewica's concentration in large cities).
            </p>
          </Pillar>

          <Pillar n={3} title="Geographic Persistence & Dispersion Parameter">
            <p>
              The model distinguishes parties with deeply rooted geography (e.g.
              KO, PiS) from "flat" electorates and new initiatives without a
              regional base. This prevents artificially inflating or deflating the
              seat counts of parties hovering around the electoral threshold.
            </p>
          </Pillar>

          <Pillar
            n={4}
            title={
              <>
                Local D'Hondt & the Vote-Flip Margin (
                <span className="num">ΔV<sup>flip</sup></span>)
              </>
            }
          >
            <p>
              In each of the 41 districts the simulator performs an independent
              D'Hondt seat allocation. On top of that, the model computes the{" "}
              <b className="text-slate-200">
                vote-flip margin (
                <span className="num">ΔV<sup>flip</sup></span>)
              </b>{" "}
              — a real-time diagnostic showing how many percentage points (and raw
              votes) a given party lacks in a specific district to take the last
              allocated seat away from a competitor.
            </p>
          </Pillar>

          <Pillar n={5} title="Stochastic Monte Carlo Simulation (10,000 Iterations)">
            <p>
              To account for polling sample error and inter-party vote flows, the
              engine runs 10,000 independent draws in the background (inside Web
              Workers). This produces a full probabilistic picture:
            </p>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-slate-400">
              <li>
                Seat confidence intervals (
                <span className="num">
                  P<sub>10</sub>, P<sub>50</sub>, P<sub>90</sub>
                </span>
                ).
              </li>
              <li>
                Threshold mortality risk (probability of falling out of the Sejm).
              </li>
              <li>
                Probability of assembling a governing majority (
                <span className="num">≥ 231</span> seats).
              </li>
            </ul>
          </Pillar>
        </div>
      </section>

      <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-[11px] leading-relaxed text-slate-500">
        <b className="text-slate-400">Data sources:</b> official PKW results — 2023
        Sejm election (list results per district) and the 2025 presidential first
        round (precinct protocols aggregated into Sejm districts). Abroad and ship
        precincts are excluded — they belong to no Sejm district.
      </div>
    </div>
  );
}

function Pillar({
  n,
  title,
  children,
}: {
  n: number;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="mb-1 text-[13px] font-semibold text-slate-200">
        <span className="num mr-1.5 text-amber-500">{n}.</span>
        {title}
      </h4>
      <div className="text-[13px] text-slate-400">{children}</div>
    </div>
  );
}
