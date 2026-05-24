// ============================================================
// MYTHICAL CUTSCENE v4 — Epic Break Sequences
// ============================================================
import { useEffect, useRef, useState, useCallback } from "react";
import { Card, type CardDefinition } from "./App";

// ============================================================
// TYPES
// ============================================================
interface ChainLink {
  x: number; y: number;
  px: number; py: number;
  pinned: boolean;
}

interface Chain {
  links: ChainLink[];
  /** 0=flyIn 1=wrapped 2=tensed 3=breaking 4=exploding */
  state: number;
  age: number;
  spawnAngle: number;
  color: string;
  highlightColor: string;
  width: number;
  vx: number; vy: number;
  opacity: number;
  broken: boolean;
  wrapOffset: number;
  /** 0-1 how "hot" the chain looks when broken — drives red/orange/white color */
  breakGlow: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  r: number; color: string;
  glow: boolean;
  trail?: boolean;
}

interface GlassShard {
  x: number; y: number;
  vx: number; vy: number;
  rot: number; rotV: number;
  size: number;
  opacity: number;
  color: string;
}

interface Shockwave {
  x: number; y: number;
  r: number; maxR: number;
  opacity: number;
  color: string;
  width: number;
}

interface EnergyRing {
  r: number; maxR: number;
  opacity: number;
  color: string;
  birth: number;
}

// ============================================================
// TIMING  (frames @60fps, total = 600 = 10s)
// ============================================================
const T_CHAIN_FLY   =  15;
const T_CHAIN_WRAP  =  35;
const T_PRESSURE    = 120;
const T_BREAK1      = 150;
const T_BREAK2      = 183;
const T_BREAK3      = 208;
const T_IMPACT      = 220;
const T_SYMBOL      = 354;
const T_SHATTER     = 387;
const T_PAN_START   = 407;
const T_PAN_END     = 507;
const T_ZOOM        = 547;
const T_SLAM        = 580;
const T_CARD_SHOWN  = 600;

// ============================================================
// PHYSICS CONSTANTS
// ============================================================
const LINK_N   = 24;
const LINK_LEN = 10;
const GRAVITY  = 0.28;
const ITERS    = 20;

// ============================================================
// CHAIN FACTORY & PHYSICS
// ============================================================
function makeChain(cx: number, cy: number, angle: number, W: number, H: number, idx_chain: number): Chain {
  const dist = Math.hypot(W, H) * 0.65;
  const sx   = cx + Math.cos(angle) * dist;
  const sy   = cy + Math.sin(angle) * dist;
  const links: ChainLink[] = Array.from({ length: LINK_N }, (_, i) => {
    const t = i / (LINK_N - 1);
    return { x: sx + (cx - sx) * t, y: sy + (cy - sy) * t,
             px: sx + (cx - sx) * t, py: sy + (cy - sy) * t, pinned: false };
  });
  const steelPalette = [
    { c: "#7a7a7a", h: "#d0d0d0" },
    { c: "#909090", h: "#ffffff" },
    { c: "#606060", h: "#bbbbbb" },
    { c: "#9a9a9a", h: "#eeeeee" },
    { c: "#6e6e6e", h: "#c8c8c8" },
  ];
  const si = Math.floor(Math.random() * steelPalette.length);
  const OFFSETS = [-60, -30, 0, 30, 60];
  const wrapOffset = OFFSETS[idx_chain % 5];
  return {
    links, state: 0, age: 0, spawnAngle: angle,
    color: steelPalette[si].c, highlightColor: steelPalette[si].h,
    width: 4 + Math.random() * 2.5,
    vx: 0, vy: 0, opacity: 1, broken: false, wrapOffset, breakGlow: 0,
  };
}

function stepChain(c: Chain, cx: number, cy: number): Chain {
  c.age++;

  if (c.state === 0) {
    const prog = Math.min(1, c.age / T_CHAIN_FLY);
    const ease = 1 - Math.pow(1 - prog, 4);
    const dist = Math.hypot(600, 600) * 0.65 * (1 - ease);
    const tipX = cx + Math.cos(c.spawnAngle) * dist;
    const tipY = cy + Math.sin(c.spawnAngle) * dist;
    const tailX = cx + Math.cos(c.spawnAngle) * Math.max(dist * 1.35, dist + 80);
    const tailY = cy + Math.sin(c.spawnAngle) * Math.max(dist * 1.35, dist + 80);
    c.links[0].x = tipX; c.links[0].y = tipY;
    c.links[LINK_N - 1].x = tailX; c.links[LINK_N - 1].y = tailY;
    for (let i = 1; i < LINK_N - 1; i++) {
      const t2   = i / (LINK_N - 1);
      const sway = Math.sin(t2 * Math.PI) * (1 - ease) * 70 * Math.sin(c.age * 0.25 + c.spawnAngle);
      const px   = -Math.sin(c.spawnAngle);
      const py   =  Math.cos(c.spawnAngle);
      c.links[i].x = tipX + (tailX - tipX) * t2 + px * sway;
      c.links[i].y = tipY + (tailY - tipY) * t2 + py * sway;
    }
    return c;
  }

  if (c.state === 1 || c.state === 2) {
    const CARD_HW = 75;
    const CARD_HH = 105;
    const OVERHANG = 18;

    const strapDir = c.spawnAngle + Math.PI / 2;
    const absCos   = Math.abs(Math.cos(strapDir));
    const absSin   = Math.abs(Math.sin(strapDir));

    const perpDir = c.spawnAngle + Math.PI;
    const midX = cx + Math.cos(perpDir) * c.wrapOffset;
    const midY = cy + Math.sin(perpDir) * c.wrapOffset;

    const edgeDist = absCos < 0.01 ? CARD_HH
                   : absSin < 0.01 ? CARD_HW
                   : Math.min(CARD_HW / absCos, CARD_HH / absSin);

    const maxPin   = (LINK_N - 1) * LINK_LEN / 2 - 8;
    const pinDist  = Math.min(edgeDist + OVERHANG, maxPin);

    const headX = midX + Math.cos(strapDir) * pinDist;
    const headY = midY + Math.sin(strapDir) * pinDist;
    const tailX = midX - Math.cos(strapDir) * pinDist;
    const tailY = midY - Math.sin(strapDir) * pinDist;

    if (c.state === 2) {
      for (let i = 0; i < LINK_N; i++) {
        const t    = i / (LINK_N - 1);
        c.links[i].x  = headX + (tailX - headX) * t;
        c.links[i].y  = headY + (tailY - headY) * t;
        c.links[i].px = c.links[i].x;
        c.links[i].py = c.links[i].y;
      }
      return c;
    }

    c.links[0].x = headX; c.links[0].y = headY;
    c.links[0].px = headX; c.links[0].py = headY;
    c.links[0].pinned = true;
    c.links[LINK_N - 1].x = tailX; c.links[LINK_N - 1].y = tailY;
    c.links[LINK_N - 1].px = tailX; c.links[LINK_N - 1].py = tailY;
    c.links[LINK_N - 1].pinned = true;

    for (let i = 0; i < LINK_N; i++) {
      if (c.links[i].pinned) continue;
      const vx2 = (c.links[i].x - c.links[i].px) * 0.85;
      const vy2 = (c.links[i].y - c.links[i].py) * 0.85;
      c.links[i].px = c.links[i].x;
      c.links[i].py = c.links[i].y;
      c.links[i].x += vx2;
      c.links[i].y += vy2 + GRAVITY * 0.08;
    }
    for (let iter = 0; iter < ITERS; iter++) {
      for (let i = 0; i < LINK_N - 1; i++) {
        const a = c.links[i], b = c.links[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.hypot(dx, dy) || 0.001;
        const ff = (d - LINK_LEN) / d * 0.5;
        if (!a.pinned) { a.x += dx * ff; a.y += dy * ff; }
        if (!b.pinned) { b.x -= dx * ff; b.y -= dy * ff; }
      }
    }

    for (let i = 0; i < LINK_N; i++) c.links[i].pinned = false;
    return c;
  }

  if (c.state === 3) {
    // Flash bright orange at break moment, then fade to red as it flies out
    if (c.breakGlow < 1) c.breakGlow = Math.min(1, c.breakGlow + 0.18);
    c.breakGlow = Math.max(0, c.breakGlow - 0.012);
    c.opacity = Math.max(0, c.opacity - 0.008);
    for (let i = 0; i < LINK_N; i++) {
      const ang = c.spawnAngle + (i - LINK_N / 2) * 0.12;
      c.links[i].x += c.vx + Math.cos(ang) * 1.2 * (i / LINK_N + 0.2);
      c.links[i].y += c.vy + Math.sin(ang) * 1.2 * (i / LINK_N + 0.2) + GRAVITY * 0.5;
    }
    return c;
  }

  if (c.state === 4) {
    // Fully white-hot at explosion, fades quickly
    if (c.breakGlow < 1) c.breakGlow = 1;
    c.breakGlow = Math.max(0, c.breakGlow - 0.025);
    c.opacity = Math.max(0, c.opacity - 0.03);
    for (let i = 0; i < LINK_N; i++) {
      const ang = c.spawnAngle + (i - LINK_N / 2) * 0.2;
      c.links[i].x += c.vx + Math.cos(ang) * 2.2 * (i / LINK_N + 0.4);
      c.links[i].y += c.vy + Math.sin(ang) * 2.2 * (i / LINK_N + 0.4) + GRAVITY;
    }
    return c;
  }

  return c;
}

// ============================================================
// DRAW CHAIN
// ============================================================
function drawChain(ctx: CanvasRenderingContext2D, c: Chain, tensionGlow = 0) {
  if (c.opacity <= 0.02) return;

  // For broken/exploding chains, use their own breakGlow value
  const bg = (c.state === 3 || c.state === 4) ? c.breakGlow : 0;
  // state 4 = white-hot, state 3 = orange-red
  const isExplosion = c.state === 4;

  ctx.save();
  ctx.globalAlpha = c.opacity;

  // Tension glow — chain glows orange/red as it strains (state 1/2)
  if (tensionGlow > 0) {
    ctx.shadowColor = `rgba(255, ${Math.floor(120 - tensionGlow * 100)}, 0, 1)`;
    ctx.shadowBlur  = 8 + tensionGlow * 30;
  }
  // Break glow — hot chain flying outward (state 3/4)
  if (bg > 0) {
    ctx.shadowColor = isExplosion
      ? `rgba(255, 230, 120, 1)`
      : `rgba(255, ${Math.floor(80 - bg * 60)}, 0, 1)`;
    ctx.shadowBlur  = 12 + bg * 40;
  }

  ctx.beginPath();
  ctx.moveTo(c.links[0].x, c.links[0].y);
  for (let i = 1; i < LINK_N; i++) {
    const mx = (c.links[i-1].x + c.links[i].x) / 2;
    const my = (c.links[i-1].y + c.links[i].y) / 2;
    ctx.quadraticCurveTo(c.links[i-1].x, c.links[i-1].y, mx, my);
  }
  ctx.strokeStyle = "#222";
  ctx.lineWidth   = c.width + 3;
  ctx.lineCap     = "round";
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(c.links[0].x, c.links[0].y);
  for (let i = 1; i < LINK_N; i++) {
    const mx = (c.links[i-1].x + c.links[i].x) / 2;
    const my = (c.links[i-1].y + c.links[i].y) / 2;
    ctx.quadraticCurveTo(c.links[i-1].x, c.links[i-1].y, mx, my);
  }

  // Color based on state
  if (bg > 0) {
    if (isExplosion) {
      // White-hot → yellow → orange as it cools
      const rr = 255;
      const gg = Math.floor(200 + bg * 55);
      const bb = Math.floor(bg * 180);
      ctx.strokeStyle = `rgb(${rr},${gg},${bb})`;
    } else {
      // Orange-red → dark red as it fades
      const rr = Math.floor(180 + bg * 75);
      const gg = Math.floor(bg * 100);
      ctx.strokeStyle = `rgb(${rr},${gg},0)`;
    }
  } else if (tensionGlow > 0) {
    const r = Math.floor(122 + tensionGlow * 100);
    const g = Math.floor(122 - tensionGlow * 80);
    ctx.strokeStyle = `rgb(${r},${g},30)`;
  } else {
    ctx.strokeStyle = c.color;
  }
  ctx.lineWidth = c.width;
  ctx.stroke();

  for (let i = 0; i < LINK_N - 1; i++) {
    const a   = c.links[i], b = c.links[i + 1];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const mx  = (a.x + b.x) / 2;
    const my  = (a.y + b.y) / 2;
    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(i % 2 === 0 ? ang : ang + Math.PI / 2);

    ctx.beginPath();
    ctx.ellipse(1, 1, c.width * 1.8, c.width * 0.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(0, 0, c.width * 1.8, c.width * 0.8, 0, 0, Math.PI * 2);
    const lg = ctx.createLinearGradient(-c.width * 1.8, -c.width * 0.8, c.width * 1.8, c.width * 0.8);

    if (bg > 0) {
      if (isExplosion) {
        lg.addColorStop(0,   `rgba(255,255,${Math.floor(bg*200)},1)`);
        lg.addColorStop(0.4, `rgba(255,${Math.floor(180+bg*75)},0,1)`);
        lg.addColorStop(1,   "#331100");
      } else {
        lg.addColorStop(0,   `rgba(${Math.floor(160+bg*90)},${Math.floor(bg*60)},0,1)`);
        lg.addColorStop(0.4, `rgba(${Math.floor(220+bg*35)},${Math.floor(bg*90)},0,1)`);
        lg.addColorStop(1,   "#220500");
      }
    } else if (tensionGlow > 0) {
      lg.addColorStop(0, `rgba(${Math.floor(80 + tensionGlow*160)},${Math.floor(40 - tensionGlow*20)},0,1)`);
      lg.addColorStop(0.4, `rgba(${Math.floor(160 + tensionGlow*80)},${Math.floor(80 - tensionGlow*60)},0,1)`);
      lg.addColorStop(1, "#111");
    } else {
      lg.addColorStop(0, "#444");
      lg.addColorStop(0.4, c.color);
      lg.addColorStop(1, "#222");
    }
    ctx.fillStyle = lg;
    ctx.fill();
    ctx.strokeStyle = "#111";
    ctx.lineWidth   = 0.6;
    ctx.stroke();

    // Highlight streak on each link
    ctx.beginPath();
    ctx.ellipse(0, -c.width * 0.25, c.width * 0.9, c.width * 0.22, 0, 0, Math.PI * 2);
    if (bg > 0) {
      ctx.fillStyle = isExplosion
        ? `rgba(255,255,220,${0.7 + bg * 0.3})`
        : `rgba(255,${Math.floor(bg * 160)},0,${0.5 + bg * 0.4})`;
    } else if (tensionGlow > 0) {
      ctx.fillStyle = `rgba(255,${Math.floor(200 - tensionGlow*180)},0,${0.5 + tensionGlow * 0.4})`;
    } else {
      ctx.fillStyle = c.highlightColor + "99";
    }
    ctx.fill();

    ctx.restore();
  }
  ctx.restore();
}

// ============================================================
// SHOCKWAVE
// ============================================================
function spawnShockwave(x: number, y: number, color: string, maxR: number, width = 4): Shockwave {
  return { x, y, r: 0, maxR, opacity: 1, color, width };
}

function stepShockwaves(waves: Shockwave[]): Shockwave[] {
  return waves
    .map(w => {
      const prog = w.r / w.maxR;
      const spd  = 8 + (1 - prog) * 22;  // fast at start, slows down
      return {
        ...w,
        r: w.r + spd,
        opacity: Math.max(0, 1 - Math.pow(w.r / w.maxR, 0.6)),
      };
    })
    .filter(w => w.opacity > 0.01);
}

function drawShockwaves(ctx: CanvasRenderingContext2D, waves: Shockwave[]) {
  waves.forEach(w => {
    ctx.save();
    ctx.globalAlpha = w.opacity;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
    ctx.strokeStyle = w.color;
    ctx.lineWidth   = w.width * (1 - w.r / w.maxR * 0.5);
    ctx.shadowColor = w.color;
    ctx.shadowBlur  = 20;
    ctx.stroke();

    // inner ring
    if (w.r > 20) {
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = w.color;
      ctx.lineWidth   = w.width * 0.4;
      ctx.globalAlpha = w.opacity * 0.4;
      ctx.stroke();
    }
    ctx.restore();
  });
}

// ============================================================
// ENERGY BUILDUP RING (pre-break charge)
// ============================================================
function drawEnergyBuildup(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  amount: number,  // 0-1
  f: number
) {
  if (amount <= 0) return;
  ctx.save();

  // Rotating arc segments
  const segments = 8;
  for (let i = 0; i < segments; i++) {
    const baseAng  = (i / segments) * Math.PI * 2 + f * 0.08;
    const arcLen   = (Math.PI / segments) * amount;
    const r        = 90 + Math.sin(f * 0.15 + i) * 8;
    const alpha    = amount * (0.4 + Math.sin(f * 0.2 + i * 0.8) * 0.3);

    ctx.beginPath();
    ctx.arc(cx, cy, r, baseAng, baseAng + arcLen);
    ctx.strokeStyle = `rgba(255, ${Math.floor(160 - amount * 140)}, 0, ${alpha})`;
    ctx.lineWidth   = 3 + amount * 5;
    ctx.shadowColor = `rgba(255, ${Math.floor(100 - amount * 80)}, 0, 1)`;
    ctx.shadowBlur  = 20 + amount * 30;
    ctx.stroke();
  }

  // Central pulse
  const pulseR = 20 + Math.sin(f * 0.25) * 10 * amount;
  const pg     = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR + 30);
  pg.addColorStop(0,   `rgba(255,255,200,${amount * 0.9})`);
  pg.addColorStop(0.3, `rgba(255,${Math.floor(120 - amount * 100)},0,${amount * 0.6})`);
  pg.addColorStop(1,   "rgba(0,0,0,0)");
  ctx.fillStyle = pg;
  ctx.beginPath(); ctx.arc(cx, cy, pulseR + 30, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// ============================================================
// CHROMATIC ABERRATION EFFECT
// ============================================================
function drawChromaticAberration(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  amount: number
) {
  if (amount <= 0.01) return;
  const offscreen = document.createElement("canvas");
  offscreen.width  = canvas.width;
  offscreen.height = canvas.height;
  const oc = offscreen.getContext("2d")!;

  // Copy current frame
  oc.drawImage(canvas, 0, 0);

  // Red channel shifted right
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = amount * 0.4;
  ctx.fillStyle   = "rgba(255,0,0,0.01)";

  ctx.save();
  ctx.globalAlpha = amount * 0.5;
  ctx.drawImage(offscreen, amount * 8, 0, canvas.width, canvas.height);
  ctx.restore();

  // Blue channel shifted left
  ctx.save();
  ctx.globalAlpha = amount * 0.5;
  ctx.drawImage(offscreen, -amount * 8, 0, canvas.width, canvas.height);
  ctx.restore();

  ctx.restore();
}

// ============================================================
// ELECTRIC SPARK
// ============================================================
function drawSparks(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  f: number, intensity: number
) {
  if (intensity <= 0) return;
  ctx.save();
  const count = Math.floor(intensity * 16);
  for (let i = 0; i < count; i++) {
    const ang   = Math.random() * Math.PI * 2;
    const len   = 15 + Math.random() * 40 * intensity;
    const start = 50 + Math.random() * 60;
    const jag   = 3;

    ctx.beginPath();
    let px = cx + Math.cos(ang) * start;
    let py = cy + Math.sin(ang) * start;
    ctx.moveTo(px, py);

    const steps = 4 + Math.floor(Math.random() * 4);
    for (let s = 0; s < steps; s++) {
      const t      = (s + 1) / steps;
      const ex     = cx + Math.cos(ang) * (start + len * t);
      const ey     = cy + Math.sin(ang) * (start + len * t);
      const jx     = ex + (Math.random() - 0.5) * jag * 8;
      const jy     = ey + (Math.random() - 0.5) * jag * 8;
      ctx.lineTo(jx, jy);
    }

    ctx.strokeStyle = Math.random() > 0.5
      ? `rgba(255,255,100,${0.6 + Math.random() * 0.4})`
      : `rgba(180,100,255,${0.4 + Math.random() * 0.4})`;
    ctx.lineWidth   = 0.5 + Math.random() * 1.5;
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur  = 8;
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================
// BREAK FLASH
// ============================================================
function drawBreakFlash(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  cx: number, cy: number,
  alpha: number,
  tint: [number, number, number] = [255, 255, 255]
) {
  if (alpha <= 0) return;
  ctx.save();

  // Directional radial blast from center
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(W, H) * 0.6);
  g.addColorStop(0,   `rgba(${tint[0]},${tint[1]},${tint[2]},${alpha})`);
  g.addColorStop(0.3, `rgba(${tint[0]},${tint[1]},${tint[2]},${alpha * 0.6})`);
  g.addColorStop(1,   `rgba(${tint[0]},${tint[1]},${tint[2]},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.restore();
}

// ============================================================
// MYSTERY CARD
// ============================================================
function drawMysteryCard(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  f: number, shake: number,
  crackAmt: number,
  tensionScale = 1
) {
  const W = 150, H = 210, R = 12;
  const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
  ctx.save();
  ctx.translate(cx + sx, cy + sy);
  ctx.scale(tensionScale, tensionScale);

  roundRect(ctx, -W/2, -H/2, W, H, R);
  const g = ctx.createLinearGradient(-W/2, -H/2, W/2, H/2);
  g.addColorStop(0, "#1c0b42");
  g.addColorStop(1, "#080418");
  ctx.fillStyle = g; ctx.fill();

  ctx.save();
  ctx.shadowColor = "#8040ff";
  ctx.shadowBlur  = 18;
  roundRect(ctx, -W/2, -H/2, W, H, R);
  ctx.strokeStyle = "#5030a0"; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();

  ctx.save(); ctx.clip();
  ctx.globalAlpha = 0.07;
  for (let i = -14; i < 22; i++) {
    ctx.beginPath();
    ctx.moveTo(-W/2 + i * 18, -H/2);
    ctx.lineTo(-W/2 + i * 18 - H, H/2);
    ctx.strokeStyle = "#9060f0"; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.restore();

  if (crackAmt > 0) {
    ctx.save();
    ctx.globalAlpha = crackAmt * 0.8;
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 60);
    cg.addColorStop(0, `rgba(255,80,0,${crackAmt})`);
    cg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = cg;
    ctx.beginPath(); ctx.arc(0, 0, 60, 0, Math.PI * 2); ctx.fill();

    // More detailed cracks as amount increases
    const cracks = [
      [[-5,-60],[10,-20],[-8,10],[15,60]],
      [[40,-50],[20,-10],[35,30],[10,80]],
      [[-40,-30],[-15,5],[-30,40],[-5,90]],
      [[0,-80],[-10,-30],[5,20],[0,70]],
      [[25,-40],[5,5],[20,50],[-10,90]],
      [[-25,-55],[-5,-10],[-20,35],[-35,80]],
    ];
    const visibleCracks = Math.floor(cracks.length * crackAmt);
    ctx.lineWidth = 1.2;
    ctx.shadowColor = "#ff8000"; ctx.shadowBlur = 8;
    cracks.slice(0, visibleCracks + 1).forEach((pts, idx) => {
      const crackAlpha = idx < visibleCracks ? crackAmt : crackAmt * ((crackAmt * cracks.length) % 1);
      ctx.strokeStyle = `rgba(255,${Math.floor(160 - crackAmt * 80)},0,${crackAlpha * 0.9})`;
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
      ctx.stroke();
    });
    ctx.restore();
  }

  const pulse = 0.55 + Math.sin(f * 0.08) * 0.2;
  const orb   = ctx.createRadialGradient(0, 0, 0, 0, 0, 48);
  orb.addColorStop(0, `rgba(180,100,255,${pulse})`);
  orb.addColorStop(0.5, `rgba(100,40,200,${pulse * 0.5})`);
  orb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = orb;
  ctx.beginPath(); ctx.arc(0, 0, 48, 0, Math.PI * 2); ctx.fill();

  ctx.font = `bold 52px serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "#c080ff"; ctx.shadowBlur = 24;
  ctx.fillStyle = `rgba(200,140,255,${0.7 + pulse * 0.25})`;
  ctx.fillText("?", 0, 0);

  ctx.restore();
}

// ============================================================
// IMPACT LINES
// ============================================================
function drawImpactLines(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  W: number, H: number,
  alpha: number,
) {
  ctx.save();
  const maxR = Math.hypot(W, H) * 1.3;
  const count = 64;
  for (let i = 0; i < count; i++) {
    const ang    = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.06;
    const near   = 12 + Math.random() * 25;
    const thick  = i % 4 === 0 ? 5 + Math.random() * 8
                 : i % 2 === 0 ? 2 + Math.random() * 3
                 : 0.8 + Math.random() * 1.5;
    const col    = i % 5 === 0 ? `rgba(255,220,0,${alpha * 0.9})`
                 : `rgba(255,255,255,${alpha * 0.8})`;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(ang) * near, cy + Math.sin(ang) * near);
    ctx.lineTo(cx + Math.cos(ang) * maxR, cy + Math.sin(ang) * maxR);
    ctx.strokeStyle = col; ctx.lineWidth = thick; ctx.stroke();
  }
  ctx.restore();
}

// ============================================================
// SYMBOL
// ============================================================
function drawSymbol(ctx: CanvasRenderingContext2D, cx: number, cy: number, alpha: number, f: number) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy);

  const r     = 70;
  const pulse = 0.6 + Math.sin(f * 0.1) * 0.2;

  ctx.shadowColor = "#ff8800"; ctx.shadowBlur = 40;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,160,0,${pulse})`; ctx.lineWidth = 2; ctx.stroke();

  ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(255,220,100,${pulse * 0.7})`; ctx.lineWidth = 1.2; ctx.stroke();

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6);
    ctx.lineTo(Math.cos(a) * r,       Math.sin(a) * r);
    ctx.strokeStyle = `rgba(255,200,50,${pulse * 0.8})`; ctx.lineWidth = 1.5; ctx.stroke();
  }

  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    i === 0
      ? ctx.moveTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55)
      : ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(255,255,200,${pulse})`; ctx.lineWidth = 1.8; ctx.stroke();

  ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,200,${pulse})`; ctx.fill();

  ctx.restore();
}

// ============================================================
// GLASS SHATTER
// ============================================================
function makeShards(cx: number, cy: number, count = 40): GlassShard[] {
  return Array.from({ length: count }, () => {
    const ang  = Math.random() * Math.PI * 2;
    const spd  = 3 + Math.random() * 12;
    return {
      x: cx + (Math.random() - 0.5) * 60,
      y: cy + (Math.random() - 0.5) * 60,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - 2,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.3,
      size: 8 + Math.random() * 24,
      opacity: 0.7 + Math.random() * 0.3,
      color: Math.random() > 0.5 ? "#aaddff" : "#ffffff",
    };
  });
}

function stepShards(shards: GlassShard[]): GlassShard[] {
  return shards
    .map(s => ({ ...s, x: s.x + s.vx, y: s.y + s.vy, vy: s.vy + 0.4,
                 rot: s.rot + s.rotV, opacity: s.opacity - 0.018 }))
    .filter(s => s.opacity > 0);
}

function drawShards(ctx: CanvasRenderingContext2D, shards: GlassShard[]) {
  shards.forEach(s => {
    ctx.save();
    ctx.globalAlpha = s.opacity;
    ctx.translate(s.x, s.y); ctx.rotate(s.rot);
    ctx.beginPath();
    ctx.moveTo(0, -s.size / 2);
    ctx.lineTo(s.size * 0.3, s.size * 0.3);
    ctx.lineTo(-s.size * 0.3, s.size * 0.4);
    ctx.closePath();
    ctx.fillStyle = s.color + "44";
    ctx.fill();
    ctx.shadowColor = "#88ccff"; ctx.shadowBlur = 10;
    ctx.strokeStyle = s.color; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.restore();
  });
}

// ============================================================
// PARTICLES
// ============================================================
function spawnBurst(cx: number, cy: number, count: number, colors: string[], glow = false): Particle[] {
  return Array.from({ length: count }, () => {
    const ang = Math.random() * Math.PI * 2;
    const spd = 3 + Math.random() * 14;
    return {
      x: cx + (Math.random() - 0.5) * 20,
      y: cy + (Math.random() - 0.5) * 20,
      vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd - 2,
      life: 1, maxLife: 45 + Math.random() * 55,
      r: 2 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      glow,
    };
  });
}

// ── Spawn sparky chain-link debris ─────────────────────────
function spawnChainDebris(cx: number, cy: number, count: number, baseAngle: number): Particle[] {
  return Array.from({ length: count }, () => {
    const spread = (Math.random() - 0.5) * Math.PI;
    const ang    = baseAngle + spread;
    const spd    = 6 + Math.random() * 20;
    return {
      x:  cx, y: cy,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd - Math.random() * 4,
      life: 1, maxLife: 30 + Math.random() * 30,
      r: 3 + Math.random() * 5,
      color: Math.random() > 0.6
        ? "#FFB800"
        : Math.random() > 0.5 ? "#FF6060" : "#aaaaaa",
      glow: true,
      trail: true,
    };
  });
}

function stepParticles(ps: Particle[]): Particle[] {
  return ps
    .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy,
                 vy: p.vy + 0.18, vx: p.vx * 0.97,
                 life: p.life - 1 / p.maxLife }))
    .filter(p => p.life > 0);
}

function drawParticles(ctx: CanvasRenderingContext2D, ps: Particle[]) {
  ps.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = 14; }

    if (p.trail) {
      // Draw elongated streak
      const len = Math.hypot(p.vx, p.vy) * 2;
      const ang = Math.atan2(p.vy, p.vx);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(ang);
      const grad = ctx.createLinearGradient(-len, 0, 0, 0);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, p.color);
      ctx.fillStyle = grad;
      ctx.fillRect(-len, -p.r * p.life * 0.5, len, p.r * p.life);
      ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
    ctx.fillStyle = p.color; ctx.fill();
    ctx.restore();
  });
}

// ============================================================
// HELPERS
// ============================================================
function shake(intensity: number): [number, number] {
  return [
    (Math.random() - 0.5) * intensity * 2,
    (Math.random() - 0.5) * intensity * 2,
  ];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fadeOutAudio(audio: HTMLAudioElement) {
  const STEPS    = 25;
  const startVol = audio.volume;
  const step     = startVol / STEPS;
  const id = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - step);
    if (audio.volume <= 0) {
      audio.pause();
      audio.src = "";
      clearInterval(id);
    }
  }, 20);
}

const easeOutCubic    = (t: number) => 1 - Math.pow(1 - Math.min(1, t), 3);
const easeInCubic     = (t: number) => Math.min(1, t) * Math.min(1, t) * Math.min(1, t);
const easeInOutCubic  = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// ============================================================
// PROPS
// ============================================================
export interface MythicalCutsceneProps {
  card: CardDefinition;
  phase: string;
  onComplete: () => void;
  onBoom: () => void;
  durationSeconds?: number;
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function MythicalCutscene({ card, phase, onComplete, onBoom, durationSeconds = 16 }: MythicalCutsceneProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const rafRef       = useRef<number>(0);
  const startTimeRef = useRef(0);
  const chainsRef    = useRef<Chain[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const shardsRef    = useRef<GlassShard[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const imgRef       = useRef<HTMLImageElement | null>(null);
  const bgmRef       = useRef<HTMLAudioElement | null>(null);

  // Per-break flash state
  const break1FlashRef = useRef(0);
  const break2FlashRef = useRef(0);
  const break3FlashRef = useRef(0);

  const [showCard,     setShowCard]     = useState(false);
  const [cardOpacity,  setCardOpacity]  = useState(0);
  const [quoteText,    setQuoteText]    = useState("");
  const [quoteOpacity, setQuoteOpacity] = useState(0);
  const [animDone,     setAnimDone]     = useState(false);

  const dim = useRef({ W: 800, H: 600 });
  useEffect(() => {
    dim.current = { W: window.innerWidth, H: window.innerHeight };
  }, []);

  useEffect(() => {
    if (!card.image) return;
    const img = new Image();
    img.src   = card.image;
    img.onload = () => { imgRef.current = img; };
  }, [card.image]);

  // ── MAIN ANIMATION LOOP ─────────────────────────────────────
  useEffect(() => {
    if (phase !== "cutscene_flash" && phase !== "cutscene_reveal") return;

    const { W, H } = dim.current;
    const CX = W / 2, CY = H / 2;

    startTimeRef.current = 0;
    setShowCard(false);
    setCardOpacity(0);
    setQuoteText("");
    setQuoteOpacity(0);
    setAnimDone(false);

    chainsRef.current    = Array.from({ length: 24 }, (_, i) =>
      makeChain(CX, CY, (i / 24) * Math.PI * 2, W, H, i)
    );
    particlesRef.current  = [];
    shardsRef.current     = [];
    shockwavesRef.current = [];
    break1FlashRef.current = 0;
    break2FlashRef.current = 0;
    break3FlashRef.current = 0;

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    let break1Done    = false;
    let break2Done    = false;
    let break3Done    = false;
    let impactDone    = false;
    let shatterDone   = false;
    let quoteDone     = false;
    let chainSfxDone  = false;
    let bgmDone       = false;
    let breakSfxDone  = false;

    const TOTAL_FRAMES = T_CARD_SHOWN;
    const DURATION_MS  = durationSeconds * 1000;
    const TAIL_FRAMES  = 60;

    const tick = (now: number) => {
      if (startTimeRef.current === 0) { startTimeRef.current = now; }

      const elapsedMs = now - startTimeRef.current;
      const f = (elapsedMs / DURATION_MS) * TOTAL_FRAMES;
      canvas.width  = W;
      canvas.height = H;

      // ── Camera shake ─────────────────────────────────────────
      let camX = 0, camY = 0;
      const inBreakZone = f >= T_BREAK1 && f < T_IMPACT;
      if (inBreakZone) {
        const shakeAmt = f >= T_BREAK3 ? 14 : f >= T_BREAK2 ? 7 : 3.5;
        [camX, camY] = shake(shakeAmt);
      }
      if (f >= T_IMPACT && f < T_IMPACT + 20) {
        [camX, camY] = shake(28 * (1 - (f - T_IMPACT) / 20));
      }

      ctx.save();
      ctx.translate(camX, camY);

      ctx.fillStyle = "#000";
      ctx.fillRect(-camX, -camY, W, H);

      // ── Aura after impact ────────────────────────────────────
      if (f > T_IMPACT && f < T_SYMBOL + 20) {
        const auraP = Math.min(1, (f - T_IMPACT) / 50);
        const aGrd  = ctx.createRadialGradient(CX, CY, 0, CX, CY, 280);
        aGrd.addColorStop(0,   `rgba(255,100,0,${auraP * 0.35})`);
        aGrd.addColorStop(0.5, `rgba(255,60,0,${auraP * 0.15})`);
        aGrd.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = aGrd; ctx.fillRect(0, 0, W, H);
      }

      // ── Chain state transitions ───────────────────────────────
      chainsRef.current.forEach(c => {
        if (f >= T_CHAIN_FLY  && c.state === 0) c.state = 1;
        if (f >= T_CHAIN_WRAP && c.state === 1) c.state = 2;
      });

      // ── Audio ────────────────────────────────────────────────
      if (f >= T_CHAIN_FLY && !chainSfxDone) {
        chainSfxDone = true;
        new Audio("/wiki SFX/SFX สุ่ม/โซ่.mp3").play().catch(() => {});
      }
      if (f >= T_PRESSURE && !bgmDone) {
        bgmDone = true;
        const bgm = new Audio("/wiki SFX/เสียงเพลงกาชา/Mythical.flac");
        bgm.volume = 1;
        bgm.play().catch(() => {});
        bgmRef.current = bgm;
      }

      if (f < T_IMPACT + 40) {
        chainsRef.current = chainsRef.current.map(c => stepChain(c, CX, CY));
      }

      // ── Tension glow on wrapped chains ───────────────────────
      const tensionAmt = f >= T_PRESSURE && f < T_IMPACT
        ? Math.min(1, (f - T_PRESSURE) / (T_IMPACT - T_PRESSURE))
        : 0;

      // ── Energy buildup ring (pre-break) ──────────────────────
      if (f >= T_PRESSURE && f < T_IMPACT) {
        drawEnergyBuildup(ctx, CX, CY, tensionAmt, f);
      }

      // ─────────────────────────────────────────────────────────
      // BREAK 1
      // ─────────────────────────────────────────────────────────
      if (f >= T_BREAK1 && !break1Done) {
        break1Done = true;
        if (!breakSfxDone) {
          breakSfxDone = true;
          new Audio("/wiki SFX/SFX สุ่ม/โซ่แตก.mp3").play().catch(() => {});
        }
        chainsRef.current.forEach((c, i) => {
          if (i % 3 === 0) {
            c.state = 3;
            c.breakGlow = 0;  // will ramp up in stepChain
            c.vx = Math.cos(c.spawnAngle) * 2.5;
            c.vy = Math.sin(c.spawnAngle) * 2.5;
          }
        });
        // Shockwave ring
        shockwavesRef.current.push(
          spawnShockwave(CX, CY, "#ff6600", 400, 6),
          spawnShockwave(CX, CY, "#ffaa00", 300, 3),
        );
        // Chain debris particles
        particlesRef.current.push(
          ...spawnBurst(CX, CY, 25, ["#888","#aaa","#ccc","#fff"], false),
          ...spawnChainDebris(CX, CY, 30, 0),
        );
        break1FlashRef.current = 1;
      }

      // ─────────────────────────────────────────────────────────
      // BREAK 2
      // ─────────────────────────────────────────────────────────
      if (f >= T_BREAK2 && !break2Done) {
        break2Done = true;
        chainsRef.current.forEach((c, i) => {
          if (i % 2 === 0) {
            c.state = 3; c.opacity = 1; c.breakGlow = 0;
            c.vx = Math.cos(c.spawnAngle) * 5;
            c.vy = Math.sin(c.spawnAngle) * 5;
          }
        });
        // Bigger double shockwave
        shockwavesRef.current.push(
          spawnShockwave(CX, CY, "#ff3300", 600, 8),
          spawnShockwave(CX, CY, "#ff8800", 480, 4),
          spawnShockwave(CX, CY, "#ffcc00", 350, 2),
        );
        particlesRef.current.push(
          ...spawnBurst(CX, CY, 45, ["#888","#aaa","#ccc","#fff","#FFB800"], true),
          ...spawnChainDebris(CX, CY, 50, Math.PI * 0.25),
        );
        break2FlashRef.current = 1;
      }

      // ─────────────────────────────────────────────────────────
      // BREAK 3
      // ─────────────────────────────────────────────────────────
      if (f >= T_BREAK3 && !break3Done) {
        break3Done = true;
        chainsRef.current.forEach(c => {
          c.state = 3; c.opacity = 1; c.breakGlow = 0;
          c.vx = Math.cos(c.spawnAngle) * 9;
          c.vy = Math.sin(c.spawnAngle) * 9;
        });
        // Triple concentric shockwaves
        shockwavesRef.current.push(
          spawnShockwave(CX, CY, "#ffffff", 700, 10),
          spawnShockwave(CX, CY, "#ff2200", 600, 7),
          spawnShockwave(CX, CY, "#ff6600", 500, 5),
          spawnShockwave(CX, CY, "#ffaa00", 380, 3),
        );
        particlesRef.current.push(
          ...spawnBurst(CX, CY, 80, ["#aaa","#ccc","#fff","#FFB800","#FF6060"], true),
          ...spawnChainDebris(CX, CY, 80, Math.PI * 0.5),
          ...spawnChainDebris(CX, CY, 40, Math.PI),
        );
        break3FlashRef.current = 1;
      }

      // ── Flash timers decay ────────────────────────────────────
      if (break1FlashRef.current > 0) break1FlashRef.current = Math.max(0, break1FlashRef.current - 0.06);
      if (break2FlashRef.current > 0) break2FlashRef.current = Math.max(0, break2FlashRef.current - 0.05);
      if (break3FlashRef.current > 0) break3FlashRef.current = Math.max(0, break3FlashRef.current - 0.04);

      // ── IMPACT ───────────────────────────────────────────────
      if (f >= T_IMPACT && !impactDone) {
        impactDone = true;
        onBoom();
        chainsRef.current.forEach(c => {
          c.state = 4; c.opacity = 1; c.breakGlow = 1;
          c.vx = Math.cos(c.spawnAngle) * 18;
          c.vy = Math.sin(c.spawnAngle) * 18;
        });
        shockwavesRef.current.push(
          spawnShockwave(CX, CY, "#ffffff", 900, 14),
          spawnShockwave(CX, CY, "#ff4400", 750, 9),
          spawnShockwave(CX, CY, "#ffcc00", 600, 6),
        );
        particlesRef.current.push(
          ...spawnBurst(CX, CY, 120, ["#fff","#FFB800","#FF4D4D","#ff8800","#aaa"], true)
        );
      }

      // ── Break flash overlays ──────────────────────────────────
      if (break1FlashRef.current > 0) {
        drawBreakFlash(ctx, W, H, CX, CY, break1FlashRef.current * 0.6, [255, 160, 50]);
      }
      if (break2FlashRef.current > 0) {
        drawBreakFlash(ctx, W, H, CX, CY, break2FlashRef.current * 0.75, [255, 100, 20]);
      }
      if (break3FlashRef.current > 0) {
        drawBreakFlash(ctx, W, H, CX, CY, break3FlashRef.current * 0.9, [255, 60, 0]);
      }

      // ── Impact desaturation + flash + lines ──────────────────
      if (f >= T_IMPACT && f < T_IMPACT + 28) {
        const prog = (f - T_IMPACT) / 28;
        ctx.save();
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = `rgba(128,128,128,${Math.max(0, 0.8 - prog)})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
        const lineA = f < T_IMPACT + 10
          ? (f - T_IMPACT) / 10
          : Math.max(0, 1 - (f - T_IMPACT - 10) / 18);
        if (lineA > 0) drawImpactLines(ctx, CX, CY, W, H, lineA * 0.95);
        const flashA = f < T_IMPACT + 4
          ? (f - T_IMPACT) / 4
          : Math.max(0, 1 - (f - T_IMPACT - 4) / 14);
        ctx.fillStyle = `rgba(255,255,255,${flashA * 0.85})`;
        ctx.fillRect(0, 0, W, H);
      }

      // ── Mystery card (with tension scale pulse) ───────────────
      if (f < T_IMPACT + 5) {
        const crackStart   = T_PRESSURE;
        const crackAmt     = f >= crackStart
          ? Math.min(1, (f - crackStart) / (T_IMPACT - crackStart))
          : 0;
        const shakeAmt     = f >= T_BREAK1 && f < T_IMPACT
          ? Math.min(12, (f - T_BREAK1) / 3)
          : 0;
        // Card "bulges" against the chains slightly
        const tensionScale = f >= T_PRESSURE && f < T_IMPACT
          ? 1 + Math.sin(f * 0.3) * 0.015 * tensionAmt
          : 1;
        drawMysteryCard(ctx, CX, CY, f, shakeAmt, crackAmt, tensionScale);
      }

      // ── Chains ───────────────────────────────────────────────
      if (f < T_SYMBOL - 10) {
        chainsRef.current.forEach(c => {
          const glow = (c.state === 1 || c.state === 2) ? tensionAmt : 0;
          drawChain(ctx, c, glow);
        });
      }

      // ── Shockwaves ────────────────────────────────────────────
      shockwavesRef.current = stepShockwaves(shockwavesRef.current);
      drawShockwaves(ctx, shockwavesRef.current);

      // ── Electric sparks during buildup ───────────────────────
      if (f >= T_BREAK1 && f < T_IMPACT) {
        const sparkIntensity = Math.min(1, (f - T_BREAK1) / (T_IMPACT - T_BREAK1));
        if (f % 2 === 0) drawSparks(ctx, CX, CY, f, sparkIntensity);
      }

      // ── Particles ────────────────────────────────────────────
      particlesRef.current = stepParticles(particlesRef.current);
      drawParticles(ctx, particlesRef.current);

      // ── Symbol reveal ────────────────────────────────────────
      if (f >= T_IMPACT + 15 && f < T_SHATTER) {
        const sf     = f - (T_IMPACT + 15);
        const dur    = T_SHATTER - (T_IMPACT + 15);
        const fadeIn = Math.min(1, sf / 30);
        const fadeOut= sf > dur - 25 ? Math.max(0, 1 - (sf - (dur - 25)) / 25) : 1;
        const alpha  = fadeIn * fadeOut;
        drawSymbol(ctx, CX, CY, alpha, f);

        if (f % 4 === 0 && alpha > 0.3) {
          const ang = Math.random() * Math.PI * 2;
          const r   = 60 + Math.random() * 20;
          particlesRef.current.push({
            x: CX + Math.cos(ang) * r, y: CY + Math.sin(ang) * r,
            vx: Math.cos(ang) * 0.5, vy: Math.sin(ang) * 0.5 - 1,
            life: 1, maxLife: 30 + Math.random() * 20,
            r: 2 + Math.random() * 3,
            color: "#FFB800", glow: true,
          });
        }

        if (!quoteDone && sf > 35) {
          quoteDone = true;
          setQuoteText(card.cutsceneQuote || `"${card.name}"`);
          setQuoteOpacity(1);
        }
      } else if (f >= T_SHATTER) {
        setQuoteOpacity(0);
      }

      // ── Glass shatter ─────────────────────────────────────────
      if (f >= T_SHATTER && !shatterDone) {
        shatterDone = true;
        shardsRef.current = makeShards(CX, CY, 50);
        particlesRef.current.push(
          ...spawnBurst(CX, CY, 40, ["#aaddff","#ffffff","#88ccff"], true)
        );
      }
      if (f >= T_SHATTER && f < T_PAN_START + 30) {
        shardsRef.current = stepShards(shardsRef.current);
        drawShards(ctx, shardsRef.current);
      }

      // ── Pan / zoom / slam ────────────────────────────────────
      if (f >= T_PAN_START && f < T_SLAM && imgRef.current) {
        const img    = imgRef.current;
        const pf     = f - T_PAN_START;
        const panDur = T_PAN_END - T_PAN_START;

        type PanPt = { x: number; y: number; sc: number };
        const stops: PanPt[] = [
          { x: CX - W * 0.20, y: CY - H * 0.20, sc: 1.6 },
          { x: CX + W * 0.18, y: CY + 0,        sc: 1.6 },
          { x: CX - W * 0.15, y: CY + H * 0.18, sc: 1.6 },
          { x: CX,            y: CY,             sc: 1.5 },
        ];

        let ix: number, iy: number, sc: number;

        if (pf < panDur) {
          const stopIdx = Math.min(Math.floor(pf / 50), stops.length - 2);
          const stopT   = easeInOutCubic((pf % 50) / 50);
          const cur = stops[stopIdx], nxt = stops[stopIdx + 1];
          ix = cur.x + (nxt.x - cur.x) * stopT;
          iy = cur.y + (nxt.y - cur.y) * stopT;
          sc = cur.sc + (nxt.sc - cur.sc) * stopT;
        } else if (pf < panDur + (T_ZOOM - T_PAN_END)) {
          const zf = (pf - panDur) / (T_ZOOM - T_PAN_END);
          ix = CX; iy = CY;
          sc = 1.5 + easeOutCubic(zf) * 0.5;
        } else {
          const sf   = (pf - panDur - (T_ZOOM - T_PAN_END)) / (T_SLAM - T_ZOOM);
          const ease = easeInCubic(sf);
          ix = CX; iy = CY;
          sc = 2.0 * (1 + ease * 2.5);
          ctx.globalAlpha = Math.max(0, 1 - ease * 1.2);

          if (ease > 0.6 && !showCard) setShowCard(true);
        }

        const iw     = img.naturalWidth  || 400;
        const ih     = img.naturalHeight || 400;
        const aspect = iw / ih;
        const dh     = H * sc;
        const dw     = dh * aspect;

        const fadeIn = Math.min(1, pf / 20);
        ctx.save();
        ctx.globalAlpha = fadeIn * (ctx.globalAlpha ?? 1);

        if (pf < panDur) {
          ctx.globalAlpha *= 0.25;
          ctx.drawImage(img, ix - dw/2 - 6, iy - dh/2 - 4, dw, dh);
          ctx.globalAlpha = fadeIn;
        }

        ctx.drawImage(img, ix - dw/2, iy - dh/2, dw, dh);

        const vig = ctx.createRadialGradient(ix, iy, dh * 0.25, ix, iy, dh * 0.7);
        vig.addColorStop(0, "rgba(0,0,0,0)");
        vig.addColorStop(1, "rgba(0,0,0,0.75)");
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // ── Final card fade ───────────────────────────────────────
      if (f >= T_CARD_SHOWN - 15) {
        const prog = Math.min(1, (f - (T_CARD_SHOWN - 15)) / 45);
        setCardOpacity(prog);
        const aGrd = ctx.createRadialGradient(CX, CY, 0, CX, CY, 350);
        aGrd.addColorStop(0,   `rgba(255,180,0,${prog * 0.3})`);
        aGrd.addColorStop(0.5, `rgba(255,80,0,${prog * 0.15})`);
        aGrd.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = aGrd; ctx.fillRect(0, 0, W, H);
      }

      if (f >= T_CARD_SHOWN - 15 && f % 3 === 0) {
        const ang = Math.random() * Math.PI * 2;
        const r   = 80 + Math.random() * 120;
        particlesRef.current.push({
          x: CX + Math.cos(ang) * r, y: CY + Math.sin(ang) * r,
          vx: (Math.random() - 0.5) * 0.5, vy: -0.4 - Math.random() * 0.8,
          life: 1, maxLife: 60 + Math.random() * 40,
          r: 1.5 + Math.random() * 3,
          color: Math.random() > 0.5 ? "#FFB800" : "#FF6060",
          glow: true,
        });
      }

      ctx.restore();

      if (f >= TOTAL_FRAMES + TAIL_FRAMES) {
        setAnimDone(true);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      if (bgmRef.current) {
        fadeOutAudio(bgmRef.current);
        bgmRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id, onBoom, durationSeconds]);

  // ── CLICK HANDLER ──────────────────────────────────────────
  const handleClick = useCallback(() => {
    if (animDone) {
      if (bgmRef.current) {
        fadeOutAudio(bgmRef.current);
        bgmRef.current = null;
      }
      onComplete();
    }
  }, [animDone, onComplete]);

  if (phase !== "cutscene_flash" && phase !== "cutscene_reveal") return null;

  return (
    <div
      onClick={handleClick}
      style={{ position:"fixed", inset:0, zIndex:1000, background:"#000",
               overflow:"hidden",
               cursor: animDone ? "pointer" : "default",
               userSelect:"none" }}
    >
      <style>{`
        @keyframes cardEntrance {
          0%   { opacity:0; transform:scale(3) translateY(-40px); filter:blur(12px); }
          55%  { opacity:1; transform:scale(0.93) translateY(5px);  filter:blur(0px); }
          100% { opacity:1; transform:scale(1)    translateY(0);    filter:blur(0px); }
        }
        @keyframes nameDrop {
          0%   { opacity:0; transform:translateY(-50px) scale(1.5); filter:blur(8px); }
          100% { opacity:1; transform:translateY(0)     scale(1);   filter:blur(0px); }
        }
        @keyframes quoteReveal {
          0%   { opacity:0; letter-spacing:12px; }
          100% { opacity:1; letter-spacing:2px;  }
        }
        @keyframes auraPulse {
          0%,100% { opacity:0.6; transform:scale(1); }
          50%     { opacity:1;   transform:scale(1.04); }
        }
        @keyframes pulse {
          0%,100% { opacity:0.6; }
          50%     { opacity:1; }
        }
      `}</style>

      <canvas
        ref={canvasRef}
        style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}
      />

      {/* ── QUOTE OVERLAY ─────────────────────────────────── */}
      {quoteText && quoteOpacity > 0 && (
        <div style={{
          position:"absolute", bottom:"22%", left:"50%",
          transform:"translateX(-50%)",
          zIndex:8, textAlign:"center", pointerEvents:"none",
          opacity: quoteOpacity, transition:"opacity 0.6s",
        }}>
          <div style={{
            fontFamily:"'Cinzel Decorative', serif",
            fontSize:"clamp(13px,2.5vw,22px)",
            color:"#FFE8C0", letterSpacing:2,
            textShadow:"0 0 20px #FF8800, 0 0 50px rgba(255,120,0,0.5)",
            animation:"quoteReveal 1s ease-out forwards",
            maxWidth:"70vw", lineHeight:1.6,
          }}>
            {quoteText}
          </div>
        </div>
      )}

      {/* ── CARD REVEAL LAYER ─────────────────────────────── */}
      {showCard && (
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          zIndex:10, pointerEvents:"none", gap:12,
        }}>
          <div style={{
            position:"absolute",
            width:"min(60vw,420px)", height:"min(60vw,420px)",
            borderRadius:"50%",
            background:"radial-gradient(circle, rgba(255,80,0,0.25) 0%, rgba(255,160,0,0.10) 40%, transparent 70%)",
            animation:"auraPulse 1.8s ease-in-out infinite",
            opacity: cardOpacity,
          }} />

          <div style={{
            fontFamily:"'Cinzel Decorative', serif",
            fontSize:"clamp(15px,3.5vw,28px)",
            color:"#FFE4E4", letterSpacing:6,
            textShadow:"0 0 30px #FF4D4D, 0 0 70px rgba(255,76,76,0.45)",
            opacity: cardOpacity, transition:"opacity 0.5s",
            animation: cardOpacity > 0.5 ? "nameDrop 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
          }}>
            {card.name}
          </div>

          <div style={{
            fontSize:"clamp(9px,1.8vw,13px)", color:"#FF7070",
            fontFamily:"'Cinzel', serif", letterSpacing:4,
            opacity: cardOpacity, transition:"opacity 0.6s",
          }}>
            {card.title}
          </div>

          <div style={{
            opacity: cardOpacity, transition:"opacity 0.4s",
            filter:"drop-shadow(0 0 50px #FF4D4D) drop-shadow(0 0 100px rgba(255,76,76,0.4))",
            animation: cardOpacity > 0.5
              ? "cardEntrance 1s cubic-bezier(0.34,1.56,0.64,1) forwards"
              : "none",
          }}>
            <Card card={card} size="large" glowing />
          </div>
        </div>
      )}

      {/* ── BOTTOM HINT ───────────────────────────────────── */}
      {animDone && (
        <div style={{
          position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)",
          zIndex:20, padding:"7px 18px", borderRadius:999,
          background:"rgba(0,0,0,0.55)", border:"1px solid rgba(255,76,76,0.25)",
          fontSize:10, letterSpacing:3, color:"rgba(255,220,180,0.85)",
          fontFamily:"'Cinzel', serif",
          animation:"pulse 1.2s ease-in-out infinite",
        }}>
          TAP TO CONTINUE
        </div>
      )}
    </div>
  );
}