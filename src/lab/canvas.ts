// Utilitários de canvas puro para os gráficos do /lab/ (sem biblioteca de gráficos).

export const TEAL = '#2dd4bf';
export const CORAL = '#f97366';
export const AMBER = '#fbbf24';
export const PAPER = (a: number) => `rgba(244,241,234,${a})`;
export const FONT = '11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

/** Ajusta o canvas ao tamanho CSS com devicePixelRatio. Altura base reduzida em telas estreitas. */
export function setupCanvas(canvas: HTMLCanvasElement, baseHeight: number) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = Math.round(baseHeight * (w < 500 ? 0.72 : 1));
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

export type Margins = { l: number; r: number; t: number; b: number };

export type Scale = {
  X: (v: number) => number;
  Y: (v: number) => number;
  m: Margins;
  w: number;
  h: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  logY: boolean;
};

export function makeScale(
  w: number,
  h: number,
  m: Margins,
  [x0, x1]: [number, number],
  [y0, y1]: [number, number],
  logY = false,
): Scale {
  const ly0 = logY ? Math.log(y0) : y0;
  const ly1 = logY ? Math.log(y1) : y1;
  const spanX = x1 - x0 || 1;
  const spanY = ly1 - ly0 || 1;
  return {
    X: (v) => m.l + ((w - m.l - m.r) * (v - x0)) / spanX,
    Y: (v) => m.t + (h - m.t - m.b) * (1 - ((logY ? Math.log(v) : v) - ly0) / spanY),
    m,
    w,
    h,
    x0,
    x1,
    y0,
    y1,
    logY,
  };
}

export function niceTicks(lo: number, hi: number, count = 4) {
  const span = hi - lo || 1;
  const raw = span / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((k) => k * mag).find((s) => s >= raw) ?? raw;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

export function drawGrid(
  c: CanvasRenderingContext2D,
  s: Scale,
  { xTicks, yTicks, fmtX, fmtY }: { xTicks: number[]; yTicks: number[]; fmtX: (v: number) => string; fmtY: (v: number) => string },
) {
  c.font = FONT;
  c.lineWidth = 1;
  c.strokeStyle = 'rgba(255,255,255,.07)';
  c.fillStyle = PAPER(0.6);
  c.textAlign = 'left';
  for (const v of yTicks) {
    const y = s.Y(v);
    c.beginPath();
    c.moveTo(s.m.l, y);
    c.lineTo(s.w - s.m.r, y);
    c.stroke();
    c.fillText(fmtY(v), 4, y + 4);
  }
  xTicks.forEach((v, i) => {
    c.textAlign = i === 0 && s.X(v) - s.m.l < 12 ? 'left' : i === xTicks.length - 1 && s.w - s.m.r - s.X(v) < 12 ? 'right' : 'center';
    c.fillText(fmtX(v), s.X(v), s.h - 8);
  });
  c.textAlign = 'left';
}

export function clipPlot(c: CanvasRenderingContext2D, s: Scale) {
  c.save();
  c.beginPath();
  c.rect(s.m.l, s.m.t - 2, s.w - s.m.l - s.m.r, s.h - s.m.t - s.m.b + 4);
  c.clip();
}

export function polyline(
  c: CanvasRenderingContext2D,
  s: Scale,
  xs: ArrayLike<number>,
  ys: ArrayLike<number>,
  { color, width = 1.5, dash }: { color: string; width?: number; dash?: number[] },
) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.setLineDash(dash ?? []);
  c.beginPath();
  let started = false;
  for (let i = 0; i < xs.length; i += 1) {
    const y = ys[i];
    if (!Number.isFinite(y)) {
      started = false;
      continue;
    }
    if (started) c.lineTo(s.X(xs[i]), s.Y(y));
    else c.moveTo(s.X(xs[i]), s.Y(y));
    started = true;
  }
  c.stroke();
  c.setLineDash([]);
}

export function hline(c: CanvasRenderingContext2D, s: Scale, v: number, color: string, dash: number[] = [4, 4]) {
  c.strokeStyle = color;
  c.lineWidth = 1;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(s.m.l, s.Y(v));
  c.lineTo(s.w - s.m.r, s.Y(v));
  c.stroke();
  c.setLineDash([]);
}

export function vline(c: CanvasRenderingContext2D, s: Scale, v: number, color: string, dash: number[] = [4, 4]) {
  c.strokeStyle = color;
  c.lineWidth = 1;
  c.setLineDash(dash);
  c.beginPath();
  c.moveTo(s.X(v), s.m.t);
  c.lineTo(s.X(v), s.h - s.m.b);
  c.stroke();
  c.setLineDash([]);
}

export function dot(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, stroke?: string) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1.5;
    c.stroke();
  }
}

/** Rótulo que não sai do gráfico: troca de lado perto das bordas. */
export function tag(
  c: CanvasRenderingContext2D,
  s: Scale,
  x: number,
  y: number,
  text: string,
  color: string,
  prefer: 'left' | 'right' = 'right',
) {
  c.font = FONT;
  c.fillStyle = color;
  const w = c.measureText(text).width;
  const right = prefer === 'right' ? x + 8 + w < s.w - s.m.r : x - 8 - w < s.m.l;
  c.textAlign = right ? 'left' : 'right';
  c.fillText(text, right ? x + 8 : x - 8, Math.max(s.m.t + 10, Math.min(s.h - s.m.b - 4, y - 6)));
  c.textAlign = 'left';
}
