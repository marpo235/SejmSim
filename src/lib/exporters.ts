import { PARTIES, SPECTRUM_ORDER } from "@/data/parties";
import type { DeterministicResult } from "@/engine/types";

/** Serialize an inline SVG to a PNG download. */
export function exportSvgAsPng(svgId: string, filename: string, scale = 3): void {
  const el = document.getElementById(svgId) as SVGSVGElement | null;
  if (!el) return;
  const clone = el.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const vb = el.viewBox.baseVal;
  clone.setAttribute("width", String(vb.width * scale));
  clone.setAttribute("height", String(vb.height * scale));
  // dark background plate
  const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  bg.setAttribute("x", String(vb.x));
  bg.setAttribute("y", String(vb.y));
  bg.setAttribute("width", String(vb.width));
  bg.setAttribute("height", String(vb.height));
  bg.setAttribute("fill", "#020617");
  clone.insertBefore(bg, clone.firstChild);
  const xml = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = vb.width * scale;
    canvas.height = vb.height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, "image/png");
  };
  img.src = url;
}

export function exportCsv(det: DeterministicResult, filename: string): void {
  const lines: string[] = [];
  lines.push("level,id,name,party,share_pct,seats");
  for (const p of SPECTRUM_ORDER) {
    lines.push(`national,,,"${PARTIES[p].name}",${(det.nationalShares[p] * 100).toFixed(2)},${det.seats[p]}`);
  }
  for (const d of det.districts) {
    for (const v of d.votes) {
      lines.push(
        `district,${d.id},"${d.name}","${PARTIES[v.party].name}",${(v.qualified * 100).toFixed(2)},${v.seats}`
      );
    }
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
