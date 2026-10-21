// Desenho em canvas puro (sem biblioteca de gráficos) do leque e do histograma do Monte Carlo.
import { QUANTILES, histogram, quantileSorted, type GbmResult } from '../lib/gbm.mjs';
import { setupCanvas } from './canvas';

const TEAL = '#2dd4bf';
const PAPER = 'rgba(244,241,234,';
const FONT = '11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

export function drawFan(canvas: HTMLCanvasElement, r: GbmResult, s0: number, fmt: (v: number, d?: number) => string) {
  const { ctx: c, w, h } = setupCanvas(canvas, 340);
  const days = r.times[r.times.length - 1];
  const K = QUANTILES.length;
  const m = { l: 44, r: 12, t: 10, b: 26 };
  const ymax = Math.max(quantileSorted(r.finals, 0.985), s0 * 1.2);
  const ymin = Math.min(quantileSorted(r.finals, 0.01), s0 * 0.8) * 0.95;
  const X = (t: number) => m.l + ((w - m.l - m.r) * t) / days;
  const Y = (v: number) => m.t + (h - m.t - m.b) * (1 - (v - ymin) / (ymax - ymin));

  c.font = FONT;
  c.lineWidth = 1;
  c.strokeStyle = 'rgba(255,255,255,.07)';
  c.fillStyle = `${PAPER}.6)`;
  for (let k = 0; k <= 4; k += 1) {
    const v = ymin + ((ymax - ymin) * k) / 4;
    const y = Y(v);
    c.beginPath();
    c.moveTo(m.l, y);
    c.lineTo(w - m.r, y);
    c.stroke();
    c.fillText(fmt(v, 0), 4, y + 4);
  }
  for (let k = 0; k <= 4; k += 1) {
    const t = Math.round((days * k) / 4);
    c.textAlign = k === 0 ? 'left' : k === 4 ? 'right' : 'center';
    c.fillText(`${t}d`, X(t), h - 8);
  }
  c.textAlign = 'left';

  c.save();
  c.beginPath();
  c.rect(m.l, m.t, w - m.l - m.r, h - m.t - m.b);
  c.clip();

  const n = r.times.length;
  c.strokeStyle = `${PAPER}.08)`;
  for (let i = 0; i < r.keptPaths; i += 1) {
    c.beginPath();
    for (let j = 0; j < n; j += 1) {
      const x = X(r.times[j]);
      const y = Y(r.paths[i * n + j]);
      if (j) c.lineTo(x, y);
      else c.moveTo(x, y);
    }
    c.stroke();
  }

  const q = (j: number, k: number) => r.quantiles[j * K + k];
  const band = (a: number, b: number, fill: string) => {
    c.beginPath();
    for (let j = 0; j < n; j += 1) {
      if (j) c.lineTo(X(r.times[j]), Y(q(j, a)));
      else c.moveTo(X(r.times[j]), Y(q(j, a)));
    }
    for (let j = n - 1; j >= 0; j -= 1) c.lineTo(X(r.times[j]), Y(q(j, b)));
    c.closePath();
    c.fillStyle = fill;
    c.fill();
  };
  band(0, 4, 'rgba(45,212,191,.13)');
  band(1, 3, 'rgba(45,212,191,.26)');

  c.setLineDash([4, 4]);
  c.strokeStyle = `${PAPER}.35)`;
  c.beginPath();
  c.moveTo(m.l, Y(s0));
  c.lineTo(w - m.r, Y(s0));
  c.stroke();
  c.setLineDash([]);

  c.strokeStyle = TEAL;
  c.lineWidth = 2;
  c.beginPath();
  for (let j = 0; j < n; j += 1) {
    if (j) c.lineTo(X(r.times[j]), Y(q(j, 2)));
    else c.moveTo(X(r.times[j]), Y(q(j, 2)));
  }
  c.stroke();
  c.restore();
}

export function drawHistogram(
  canvas: HTMLCanvasElement,
  r: GbmResult,
  s0: number,
  fmt: (v: number, d?: number) => string,
  labels: { s0: string; median: string; tail: (hi: string) => string },
) {
  const { ctx: c, w, h } = setupCanvas(canvas, 190);
  const { lo, hi, counts } = histogram(r.finals, 40);
  const B = counts.length;
  const peak = Math.max(...counts, 1);
  const m = { l: 8, r: 8, t: 22, b: 22 };
  const span = hi - lo || 1;
  const binW = span / B;
  const plotW = w - m.l - m.r;

  counts.forEach((k, i) => {
    const x0 = m.l + (plotW * i) / B;
    const bh = ((h - m.t - m.b) * k) / peak;
    const mid = lo + binW * (i + 0.5);
    c.fillStyle = mid < s0 ? 'rgba(249,115,102,.6)' : 'rgba(45,212,191,.6)';
    c.fillRect(x0, h - m.b - bh, Math.max(1, plotW / B - 1), bh);
  });

  const hx = (v: number) => m.l + (plotW * (v - lo)) / span;
  const median = r.stats.median;
  c.font = FONT;
  c.lineWidth = 1;
  const marks: [number, string, string][] = [
    [s0, `${labels.s0} ${fmt(s0, 0)}`, `${PAPER}.6)`],
    [median, labels.median, TEAL],
  ];
  marks.forEach(([v, label, color], j) => {
    const x = Math.min(w - m.r, Math.max(m.l, hx(v)));
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo(x, m.t - 6);
    c.lineTo(x, h - m.b);
    c.stroke();
    // S₀ e mediana ficam em lados opostos da linha para os rótulos não se sobreporem.
    const right = (j === 1) === median >= s0;
    c.fillStyle = color;
    c.textAlign = right ? 'left' : 'right';
    c.fillText(label, x + (right ? 5 : -5), m.t - 8);
  });
  c.fillStyle = `${PAPER}.6)`;
  c.textAlign = 'left';
  c.fillText(fmt(lo, 0), m.l, h - 6);
  c.textAlign = 'right';
  c.fillText(labels.tail(fmt(hi, 0)), w - m.r, h - 6);
  c.textAlign = 'left';
}
