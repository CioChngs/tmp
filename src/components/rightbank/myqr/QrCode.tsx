/**
 * The QR code on `my-qr` — Figma `14656:64139`.
 *
 * The design's own code is a placeholder, so this cannot be an exported asset:
 * it has to encode the real account. What is reproduced instead is the way the
 * design *draws* a code, measured off that export and rebuilt around a real
 * encoder, so the two are the same drawing with different data.
 *
 * The shape rules, all from `figmaMyQr.card`:
 *
 * - The matrix sits inside a 23/6.44 ≈ 3.57 module quiet zone. That is not the
 *   4 the spec asks for, but it is what the design leaves, and the panel it is
 *   drawn on is light enough to read as quiet zone either way.
 * - A data module is a circle one module across, so a vertical or horizontal
 *   run of them closes into a capsule — which is what gives the design's code
 *   its beaded look.
 * - The three eyes are not modules at all: a 7-module rounded square hollowed
 *   to 6 — a half-module ring — with a round three-module pupil. The corner
 *   radius is the same 2.6785 modules on the outside and the inside, which is
 *   the design's, and is why the ring thins towards the corners.
 *
 * The encoder is `qrcode-generator`: pure JS, no native side, and it hands over
 * the matrix rather than a rendered image, which is the whole point here.
 */
import createQr from 'qrcode-generator';
import { memo, useMemo } from 'react';
import { Circle, Path, Rect, Svg } from 'react-native-svg';

import { figmaMyQr } from '@/constants/rightbank-theme';

/**
 * `@types/qrcode-generator` stops at the tag helpers and never declares the two
 * accessors that matter, so they are named here rather than reaching for `any`.
 */
type QrModel = {
  addData(data: string): void;
  make(): void;
  getModuleCount(): number;
  isDark(row: number, col: number): boolean;
};
const encode = createQr as unknown as (type: number, level: 'L' | 'M' | 'Q' | 'H') => QrModel;

const c = figmaMyQr.card;

/** Where the three eyes sit, by the top-left module of their 7×7 block. */
function eyeOrigins(n: number) {
  return [
    { r: 0, k: 0 },
    { r: 0, k: n - 7 },
    { r: n - 7, k: 0 },
  ];
}

function inEye(n: number, r: number, k: number) {
  return eyeOrigins(n).some((e) => r >= e.r && r < e.r + 7 && k >= e.k && k < e.k + 7);
}

/** A rounded rectangle as path data, so a frame and its hole can share a path. */
function roundedRect(x: number, y: number, size: number, radius: number) {
  const r = Math.min(radius, size / 2);
  return (
    `M${x + r} ${y}H${x + size - r}A${r} ${r} 0 0 1 ${x + size} ${y + r}` +
    `V${y + size - r}A${r} ${r} 0 0 1 ${x + size - r} ${y + size}` +
    `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + size - r}` +
    `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
  );
}

function QrCodeArt({ value, size }: { value: string; size: number }) {
  const art = useMemo(() => {
    // Level M is the conventional default, and on an account number it lands on
    // the design's own 25 modules — version 2 — rather than being chosen to.
    const qr = encode(0, 'M');
    qr.addData(value);
    qr.make();

    const n = qr.getModuleCount();
    // The quiet zone is held in modules, so the code keeps the design's
    // proportions whatever matrix the data ends up needing.
    const m = size / (n + c.quiet * 2);
    const pad = c.quiet * m;

    const dots: { cx: number; cy: number }[] = [];
    for (let r = 0; r < n; r++) {
      for (let k = 0; k < n; k++) {
        if (!qr.isDark(r, k) || inEye(n, r, k)) continue;
        dots.push({ cx: pad + (k + 0.5) * m, cy: pad + (r + 0.5) * m });
      }
    }

    const eyes = eyeOrigins(n).map((e) => {
      const x = pad + e.k * m;
      const y = pad + e.r * m;
      const ring = c.eyeRing * m;
      return {
        // Even-odd across the two subpaths turns the second into the hole.
        frame:
          roundedRect(x, y, 7 * m, c.eyeRadius * m) +
          roundedRect(x + ring, y + ring, 7 * m - ring * 2, c.eyeRadius * m),
        cx: x + 3.5 * m,
        cy: y + 3.5 * m,
        pupil: (c.pupil * m) / 2,
      };
    });

    return { dots, eyes, dot: m / 2 };
  }, [value, size]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect width={size} height={size} rx={figmaMyQr.card.radius} fill={c.panel} />
      {art.eyes.map((e, i) => (
        <Path key={`eye-${i}`} d={e.frame} fillRule="evenodd" fill={c.ink} />
      ))}
      {art.eyes.map((e, i) => (
        <Circle key={`pupil-${i}`} cx={e.cx} cy={e.cy} r={e.pupil} fill={c.ink} />
      ))}
      {art.dots.map((d, i) => (
        <Circle key={i} cx={d.cx} cy={d.cy} r={art.dot} fill={c.ink} />
      ))}
    </Svg>
  );
}

/**
 * Memoised on purpose: the matrix is a few hundred nodes and nothing above it
 * changes while the screen is open.
 */
export const QrCode = memo(QrCodeArt);
