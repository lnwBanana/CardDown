// ============================================================
// MYTHICAL CUTSCENE v2 — Cinematic 15s Full Rewrite
// Drop-in replacement — same props as before
// ============================================================
import { useEffect, useRef, useState, useCallback } from "react";
import { Card, type CardDefinition } from "../src/App";


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
  /** 0=flying in  1=wrapped  2=break1  3=break2  4=explode */
  state: number;
  age: number;
  spawnAngle: number;
  color: string;
  highlightColor: string;
  width: number;
  /** velocity when exploding */
  vx: number; vy: number;
  opacity: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  r: number; color: string;
}

interface StatWord {
  text: string; color: string;
  x: number; y: number;
  vx: number; vy: number;
  scale: number; opacity: number; age: number;
}

// ============================================================
// CONSTANTS
// ============================================================
const LINK_N   = 20;
const LINK_LEN = 10;
const GRAVITY  = 0.22;
const ITERS    = 16;

// stage timing (frames @60fps)
// total ≈ 900f = 15s
const T_CHAIN_FLY   = 80;   // 0–80    โซ่พุ่งเข้า
const T_CHAIN_WRAP  = 160;  // 80–160  โซ่พันอยู่ แน่น
const T_BREAK1      = 200;  // 160–200 จังหวะ 1 หลุดนิด
const T_BREAK2      = 240;  // 200–240 จังหวะ 2 หลุดนิด
const T_IMPACT      = 290;  // 240–290 IMPACT FRAME
const T_IMG_PAN     = 470;  // 290–470 pan รูป 3 จุด
const T_IMG_ZOOM    = 570;  // 470–570 zoom 1.5x
const T_CARD_SUCK   = 670;  // 570–670 ดูดเข้าการ์ด
const T_CARD_SHOWN  = 900;  // 670–900 การ์ด + stats

// ============================================================
// CHAIN PHYSICS HELPERS
// ============================================================
function makeChain(cx: number, cy: number, angle: number): Chain {
  const dist = 520;
  const sx   = cx + Math.cos(angle) * dist;
  const sy   = cy + Math.sin(angle) * dist;
  const links: ChainLink[] = Array.from({ length: LINK_N }, (_, i) => {
    const t = i / (LINK_N - 1);
    return { x: sx + (cx - sx) * t, y: sy + (cy - sy) * t, px: sx + (cx - sx) * t, py: sy + (cy - sy) * t, pinned: false };
  });
  const steel = ["#8a8a8a","#aaaaaa","#6a6a6a","#999999","#bbbbbb"];
  const hi    = ["#dddddd","#ffffff","#cccccc","#eeeeee","#aaaaaa"];
  const idx   = Math.floor(Math.random() * steel.length);
  return { links, state: 0, age: 0, spawnAngle: angle, color: steel[idx], highlightColor: hi[idx], width: 3 + Math.random() * 2, vx: 0, vy: 0, opacity: 1 };
}

function stepChain(c: Chain, cx: number, cy: number, dt: number): Chain {
  c.age += dt;

  if (c.state === 0) {
    // flying in — ease to center
    const prog = Math.min(1, c.age / T_CHAIN_FLY);
    const ease = 1 - Math.pow(1 - prog, 3);
    const dist = 520 * (1 - ease);
    const tx   = cx + Math.cos(c.spawnAngle) * dist * 0.05;
    const ty   = cy + Math.sin(c.spawnAngle) * dist * 0.05;
    c.links[LINK_N - 1].x = cx + Math.cos(c.spawnAngle) * dist;
    c.links[LINK_N - 1].y = cy + Math.sin(c.spawnAngle) * dist;
    c.links[0].x = tx; c.links[0].y = ty;
    // intermediate links interpolate + whip sway
    for (let i = 1; i < LINK_N - 1; i++) {
      const t2   = i / (LINK_N - 1);
      const sway = Math.sin(t2 * Math.PI) * (1 - ease) * 50 * Math.sin(c.age * 0.2);
      const perpX = -Math.sin(c.spawnAngle);
      const perpY =  Math.cos(c.spawnAngle);
      c.links[i].x = c.links[LINK_N-1].x + (tx - c.links[LINK_N-1].x) * t2 + perpX * sway;
      c.links[i].y = c.links[LINK_N-1].y + (ty - c.links[LINK_N-1].y) * t2 + perpY * sway;
    }
    return c;
  }

  if (c.state === 1 || c.state === 2) {
    // wrapped — pin head near card
    const wrapR   = 30 + (c.state === 2 ? 8 : 0);
    const wrapAng = c.spawnAngle + c.age * 0.012;
    c.links[0].x  = cx + Math.cos(wrapAng) * wrapR;
    c.links[0].y  = cy + Math.sin(wrapAng) * wrapR;
    c.links[0].pinned = true;
    // tail floats free
    c.links[LINK_N - 1].pinned = false;

    // verlet
    for (let i = 0; i < LINK_N; i++) {
      if (c.links[i].pinned) continue;
      const vx2 = (c.links[i].x - c.links[i].px) * 0.90;
      const vy2 = (c.links[i].y - c.links[i].py) * 0.90;
      c.links[i].px = c.links[i].x;
      c.links[i].py = c.links[i].y;
      c.links[i].x += vx2;
      c.links[i].y += vy2 + GRAVITY;
    }
    // constraints
    for (let iter = 0; iter < ITERS; iter++) {
      for (let i = 0; i < LINK_N - 1; i++) {
        const a = c.links[i], b = c.links[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d  = Math.hypot(dx, dy) || 0.001;
        const f  = (d - LINK_LEN) / d * 0.5;
        if (!a.pinned) { a.x += dx * f; a.y += dy * f; }
        if (!b.pinned) { b.x -= dx * f; b.y -= dy * f; }
      }
    }
    return c;
  }

  if (c.state === 3 || c.state === 4) {
    // exploding — all links fly outward
    c.opacity = Math.max(0, c.opacity - (c.state === 4 ? 0.022 : 0.012));
    const spd = c.state === 4 ? 1.4 : 0.8;
    for (let i = 0; i < LINK_N; i++) {
      const ang = c.spawnAngle + (i - LINK_N / 2) * 0.15;
      c.links[i].x += (c.vx + Math.cos(ang) * spd * (i / LINK_N + 0.3));
      c.links[i].y += (c.vy + Math.sin(ang) * spd * (i / LINK_N + 0.3) + GRAVITY);
    }
    return c;
  }

  return c;
}

// ============================================================
// DRAW STEEL CHAIN
// ============================================================
function drawChain(ctx: CanvasRenderingContext2D, c: Chain) {
  if (c.opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = c.opacity;

  // main rope
  ctx.beginPath();
  ctx.moveTo(c.links[0].x, c.links[0].y);
  for (let i = 1; i < LINK_N; i++) {
    const mx = (c.links[i-1].x + c.links[i].x) / 2;
    const my = (c.links[i-1].y + c.links[i].y) / 2;
    ctx.quadraticCurveTo(c.links[i-1].x, c.links[i-1].y, mx, my);
  }
  ctx.strokeStyle = c.color;
  ctx.lineWidth   = c.width + 1;
  ctx.lineCap     = "round";
  ctx.stroke();

  // oval links — steel look
  for (let i = 0; i < LINK_N - 1; i++) {
    const a   = c.links[i];
    const b   = c.links[i + 1];
    const ang = Math.atan2(b.y - a.y, b.x - a.x);
    const mx  = (a.x + b.x) / 2;
    const my  = (a.y + b.y) / 2;
    ctx.save();
    ctx.translate(mx, my);
    // alternate horizontal/vertical links (realistic chain)
    ctx.rotate(i % 2 === 0 ? ang : ang + Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(0, 0, c.width * 1.6, c.width * 0.7, 0, 0, Math.PI * 2);
    ctx.fillStyle   = c.color;
    ctx.fill();
    ctx.strokeStyle = "#333";
    ctx.lineWidth   = 0.5;
    ctx.stroke();
    // highlight
    ctx.beginPath();
    ctx.ellipse(0, -c.width * 0.2, c.width * 0.9, c.width * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = c.highlightColor + "88";
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// ============================================================
// DRAW MYSTERY CARD (front of canvas, above chains)
// ============================================================
function drawMysteryCard(ctx: CanvasRenderingContext2D, cx: number, cy: number, frame: number, shakeAmt: number) {
  const W = 140, H = 196, R = 10;
  const sx = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
  const sy = shakeAmt > 0 ? (Math.random() - 0.5) * shakeAmt : 0;
  ctx.save();
  ctx.translate(cx + sx, cy + sy);

  // card body
  roundRect(ctx, -W/2, -H/2, W, H, R);
  const g = ctx.createLinearGradient(-W/2, -H/2, W/2, H/2);
  g.addColorStop(0, "#1a0a3a"); g.addColorStop(1, "#0a0520");
  ctx.fillStyle = g; ctx.fill();

  // border
  roundRect(ctx, -W/2, -H/2, W, H, R);
  ctx.strokeStyle = "#5030a0"; ctx.lineWidth = 2; ctx.stroke();

  // diagonal pattern
  ctx.save(); ctx.globalAlpha = 0.08;
  for (let i = -10; i < 20; i++) {
    ctx.beginPath(); ctx.moveTo(-W/2 + i*16, -H/2); ctx.lineTo(-W/2 + i*16 - H, H/2);
    ctx.strokeStyle = "#8060e0"; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.restore();

  // glowing orb
  const pulse = 0.5 + Math.sin(frame * 0.07) * 0.2;
  const orb   = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
  orb.addColorStop(0, `rgba(160,100,255,${pulse})`);
  orb.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = orb; ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI*2); ctx.fill();

  // ?
  ctx.font = "bold 44px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = `rgba(180,120,255,${0.7 + pulse * 0.2})`;
  ctx.fillText("?", 0, 0);

  ctx.restore();
}

// ============================================================
// IMPACT LINES (anime style)
// ============================================================
function drawImpactLines(ctx: CanvasRenderingContext2D, cx: number, cy: number, W: number, H: number, intensity: number) {
  ctx.save();
  const maxR = Math.hypot(W, H) * 1.2;
  const count = 48;
  for (let i = 0; i < count; i++) {
    const ang     = (i / count) * Math.PI * 2;
    const jitter  = (Math.random() - 0.5) * 0.08;
    const a       = ang + jitter;
    const near    = 15 + Math.random() * 20;
    const thick   = (i % 3 === 0) ? 4 + Math.random() * 6 : 1 + Math.random() * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * near, cy + Math.sin(a) * near);
    ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
    ctx.strokeStyle = i % 4 === 0 ? `rgba(255,220,0,${intensity})` : `rgba(255,255,255,${intensity * 0.85})`;
    ctx.lineWidth = thick;
    ctx.stroke();
  }
  ctx.restore();
}

// ============================================================
// PARTICLES
// ============================================================
function spawnBurst(cx: number, cy: number, count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, () => {
    const ang = Math.random() * Math.PI * 2;
    const spd = 3 + Math.random() * 12;
    return { x: cx, y: cy, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd - 3,
      life: 1, maxLife: 40 + Math.random() * 40, r: 2 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)] };
  });
}

function stepParticles(ps: Particle[]): Particle[] {
  return ps.map(p => ({ ...p, x: p.x+p.vx, y: p.y+p.vy, vy: p.vy+0.18, vx: p.vx*0.97,
    life: p.life - 1/p.maxLife })).filter(p => p.life > 0);
}

function drawParticles(ctx: CanvasRenderingContext2D, ps: Particle[]) {
  ps.forEach(p => {
    ctx.save(); ctx.globalAlpha = p.life;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI*2);
    ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 8; ctx.fill();
    ctx.restore();
  });
}

// ============================================================
// STAT WORDS
// ============================================================
function makeStatWords(cx: number, cy: number, card: CardDefinition): StatWord[] {
  const words = [
    { text: `ATK  ${card.atk}`, color: "#FF6060" },
    { text: `DEF  ${card.def}`, color: "#60AAFF" },
    { text: `SPD  ${card.spd}`, color: "#60FF90" },
    { text: card.rarity.toUpperCase(), color: "#FFB800" },
    { text: card.faction, color: "#FF80FF" },
  ];
  return words.map((w, i) => {
    const ang = (i / words.length) * Math.PI * 2 - Math.PI / 2;
    const spd = 4 + Math.random() * 3;
    return { ...w, x: cx, y: cy, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd - 2, scale: 0.3, opacity: 0, age: 0 };
  });
}

function stepStatWords(ws: StatWord[]): StatWord[] {
  return ws.map(w => ({
    ...w, x: w.x + w.vx, y: w.y + w.vy, vy: w.vy + 0.05, vx: w.vx * 0.96,
    scale: Math.min(1.2, w.scale + 0.06), opacity: Math.min(1, w.opacity + 0.07), age: w.age + 1,
  }));
}

function drawStatWords(ctx: CanvasRenderingContext2D, ws: StatWord[]) {
  ws.forEach(w => {
    ctx.save();
    ctx.globalAlpha = w.opacity;
    ctx.translate(w.x, w.y);
    ctx.scale(w.scale, w.scale);
    ctx.font = "bold 22px 'Cinzel Decorative', serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = w.color; ctx.shadowBlur = 18;
    ctx.fillStyle = w.color; ctx.fillText(w.text, 0, 0);
    // outline
    ctx.strokeStyle = "#000"; ctx.lineWidth = 3; ctx.strokeText(w.text, 0, 0);
    ctx.fillText(w.text, 0, 0);
    ctx.restore();
  });
}

// ============================================================
// HELPERS
// ============================================================
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
}

// easing
const easeOutCubic = (t: number) => 1 - Math.pow(1 - Math.min(1, t), 3);
const easeInOutCubic = (t: number) => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;

// ============================================================
// MAIN COMPONENT
// ============================================================
export interface MythicalCutsceneProps {
  card: CardDefinition;
  phase: string;
  onComplete: () => void;
  onBoom: () => void;
}

export default function MythicalCutscene({ card, phase, onComplete, onBoom }: MythicalCutsceneProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const skipRef     = useRef(false);
  const frameRef    = useRef(0);
  const chainsRef   = useRef<Chain[]>([]);
  const particlesRef= useRef<Particle[]>([]);
  const statWordsRef= useRef<StatWord[]>([]);
  const imgRef      = useRef<HTMLImageElement | null>(null);

  // UI state
  const [showCard, setShowCard]     = useState(false);
  const [cardOpacity, setCardOpacity] = useState(0);

  const W  = typeof window !== "undefined" ? window.innerWidth  : 800;
  const H  = typeof window !== "undefined" ? window.innerHeight : 600;
  const CX = W / 2;
  const CY = H / 2;

  // preload card image
  useEffect(() => {
    if (!card.image) return;
    const img = new Image();
    img.src = card.image;
    img.onload = () => { imgRef.current = img; };
  }, [card.image]);

  useEffect(() => {
    if (phase !== "cutscene_flash" && phase !== "cutscene_reveal") return;
    skipRef.current  = false;
    frameRef.current = 0;
    setShowCard(false);
    setCardOpacity(0);

    // spawn 10 chains from all directions
    chainsRef.current = Array.from({ length: 10 }, (_, i) =>
      makeChain(CX, CY, (i / 10) * Math.PI * 2)
    );
    particlesRef.current = [];
    statWordsRef.current = [];

    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext("2d")!;

    let break1Done = false;
    let break2Done = false;
    let impactDone = false;

    const tick = () => {
      const f = frameRef.current;
      canvas.width  = W;
      canvas.height = H;

      // ── BG ─────────────────────────────────────────────
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      // ── AURA (after impact) ─────────────────────────────
      if (f > T_IMPACT) {
        const auraAlpha = Math.min(1, (f - T_IMPACT) / 40) * 0.25;
        const grd = ctx.createRadialGradient(CX, CY, 0, CX, CY, 250);
        grd.addColorStop(0,   `rgba(255,60,60,${auraAlpha})`);
        grd.addColorStop(0.5, `rgba(255,120,0,${auraAlpha * 0.4})`);
        grd.addColorStop(1,   "rgba(0,0,0,0)");
        ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
      }

      // ── STEP CHAINS ─────────────────────────────────────
      if (f <= T_BREAK1) {
        // advance state
        chainsRef.current.forEach(c => {
          if (f >= T_CHAIN_FLY  && c.state === 0) c.state = 1;
          if (f >= T_CHAIN_WRAP && c.state === 1) c.state = 2; // tense
        });
        chainsRef.current = chainsRef.current.map(c => stepChain(c, CX, CY, 1));
      }

      // ── BREAK EVENTS ────────────────────────────────────
      // break1 — chains lurch outward slightly
      if (f === T_BREAK1 && !break1Done) {
        break1Done = true;
        chainsRef.current.forEach(c => {
          c.state = 3;
          c.vx = Math.cos(c.spawnAngle) * 1.5;
          c.vy = Math.sin(c.spawnAngle) * 1.5;
        });
        particlesRef.current.push(...spawnBurst(CX, CY, 15, ["#888","#aaa","#fff"]));
      }

      // break2 — lurch more
      if (f === T_BREAK2 && !break2Done) {
        break2Done = true;
        chainsRef.current.forEach(c => {
          c.state = 3;
          c.opacity = 1;
          c.vx = Math.cos(c.spawnAngle) * 3;
          c.vy = Math.sin(c.spawnAngle) * 3;
        });
        particlesRef.current.push(...spawnBurst(CX, CY, 30, ["#888","#aaa","#ccc","#fff","#FFB800"]));
      }

      // IMPACT — full explosion
      if (f === T_IMPACT && !impactDone) {
        impactDone = true;
        onBoom();
        chainsRef.current.forEach(c => {
          c.state = 4; c.opacity = 1;
          c.vx = Math.cos(c.spawnAngle) * 14;
          c.vy = Math.sin(c.spawnAngle) * 14;
        });
        particlesRef.current.push(...spawnBurst(CX, CY, 80, ["#fff","#FFB800","#FF4D4D","#aaa","#888","#ff8800"]));
      }

      // step & draw chains (only while visible)
      if (f < T_IMG_PAN + 30) {
        chainsRef.current = chainsRef.current.map(c => stepChain(c, CX, CY, 1));
      }

      // ── IMPACT FRAME (black & white lines) ──────────────
      if (f >= T_IMPACT && f < T_IMPACT + 22) {
        const prog = (f - T_IMPACT) / 22;
        // desaturate everything behind
        ctx.save();
        ctx.globalCompositeOperation = "saturation";
        ctx.fillStyle = `rgba(128,128,128,${1 - prog})`;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        const lineAlpha = f < T_IMPACT + 8 ? (f - T_IMPACT) / 8 : 1 - (f - T_IMPACT - 8) / 14;
        drawImpactLines(ctx, CX, CY, W, H, lineAlpha * 0.95);

        // white flash
        const flashAlpha = f < T_IMPACT + 5 ? (f - T_IMPACT) / 5 : Math.max(0, 1 - (f - T_IMPACT - 5) / 10);
        ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.7})`;
        ctx.fillRect(0, 0, W, H);
      }

      // ── DRAW MYSTERY CARD (only before image pan) ────────
      if (f < T_IMG_PAN) {
        const breakShake = f >= T_BREAK1 && f < T_IMPACT ? (f - T_BREAK1) / 5 : 0;
        const impactShake = f >= T_IMPACT && f < T_IMPACT + 15 ? 20 : 0;
        drawMysteryCard(ctx, CX, CY, f, breakShake + impactShake);
      }

      // ── DRAW CHAINS (on top of card) ─────────────────────
      if (f < T_IMG_PAN + 40) {
        chainsRef.current.forEach(c => drawChain(ctx, c));
      }

      // ── PARTICLES ────────────────────────────────────────
      particlesRef.current = stepParticles(particlesRef.current);
      drawParticles(ctx, particlesRef.current);

      // ── IMAGE PAN (รูปการ์ดเคลื่อน 3 จุด) ───────────────
      if (f >= T_IMG_PAN && f < T_CARD_SUCK && imgRef.current) {
        const img  = imgRef.current;
        const pf   = f - T_IMG_PAN; // 0...(T_IMG_ZOOM-T_IMG_PAN+T_CARD_SUCK-T_IMG_ZOOM)
        const panD = T_IMG_ZOOM - T_IMG_PAN; // 180f

        // 3 pan stops, each 60f
        const panStop = Math.floor(pf / 60);
        const panT    = easeInOutCubic((pf % 60) / 60);

        type PanPoint = { x: number; y: number; scale: number };
        const panPoints: PanPoint[] = [
          { x: CX - W * 0.22, y: CY - H * 0.22, scale: 1.5 }, // ซ้ายบน
          { x: CX + W * 0.20, y: CY + 0,        scale: 1.5 }, // ขวากลาง
          { x: CX - W * 0.18, y: CY + H * 0.20, scale: 1.5 }, // ซ้ายล่าง
          { x: CX,            y: CY,             scale: 1.5 }, // กลาง
        ];

        let curPt: PanPoint, nxtPt: PanPoint;
        if (pf < panD) {
          const si = Math.min(panStop, panPoints.length - 2);
          curPt = panPoints[si];
          nxtPt = panPoints[si + 1];
        } else {
          // zoom phase
          const zf    = (f - T_IMG_ZOOM) / (T_CARD_SUCK - T_IMG_ZOOM);
          const zEase = easeOutCubic(zf);
          curPt = { x: CX, y: CY, scale: 1.5 + zEase * 0.0 };
          nxtPt = curPt;
        }

        const ix = pf < panD ? curPt.x + (nxtPt.x - curPt.x) * panT : CX;
        const iy = pf < panD ? curPt.y + (nxtPt.y - curPt.y) * panT : CY;

        // zoom in phase (470–570)
        let sc = 1.5;
        if (f >= T_IMG_ZOOM && f < T_CARD_SUCK) {
          const zf = (f - T_IMG_ZOOM) / (T_CARD_SUCK - T_IMG_ZOOM);
          sc = 1.5 + easeOutCubic(zf) * 0.0; // stays 1.5, suck does the work
        }

        // suck into card (570–670) — scale up then slam
        if (f >= T_CARD_SUCK - 10) {
          const sf  = Math.min(1, (f - (T_CARD_SUCK - 10)) / 100);
          const suckEase = easeInOutCubic(sf);
          sc = 1.5 * (1 - suckEase * 0.4);
          if (sf > 0.7 && !showCard) {
            setShowCard(true);
          }
        }

        // draw image centered
        const iw = img.naturalWidth  || 400;
        const ih = img.naturalHeight || 400;
        const aspect = iw / ih;
        const dh = H * sc;
        const dw = dh * aspect;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (f - T_IMG_PAN) / 20);
        ctx.drawImage(img, ix - dw/2, iy - dh/2, dw, dh);
        // vignette
        const vig = ctx.createRadialGradient(ix, iy, dh * 0.3, ix, iy, dh * 0.75);
        vig.addColorStop(0, "rgba(0,0,0,0)");
        vig.addColorStop(1, "rgba(0,0,0,0.7)");
        ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      // ── CARD + STATS PHASE ───────────────────────────────
      if (f >= T_CARD_SHOWN - 10) {
        const prog = Math.min(1, (f - (T_CARD_SHOWN - 10)) / 40);
        setCardOpacity(prog);
        if (prog > 0.3 && statWordsRef.current.length === 0) {
          statWordsRef.current = makeStatWords(CX, CY, card);
        }
      }
      if (statWordsRef.current.length > 0) {
        statWordsRef.current = stepStatWords(statWordsRef.current);
        drawStatWords(ctx, statWordsRef.current);
      }

      frameRef.current++;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, card, CX, CY, W, H, onBoom]);

  const handleSkip = useCallback(() => {
    if (skipRef.current) return;
    skipRef.current = true;
    cancelAnimationFrame(rafRef.current);
    onComplete();
  }, [onComplete]);

  if (phase !== "cutscene_flash" && phase !== "cutscene_reveal") return null;

  return (
    <div onClick={handleSkip} style={{ position:"fixed", inset:0, zIndex:1000, background:"#000", overflow:"hidden", cursor:"pointer", userSelect:"none" }}>
      <style>{`
        @keyframes cardEntrance {
          0%   { opacity:0; transform:scale(2.5) translateY(-30px); }
          50%  { opacity:1; transform:scale(0.95) translateY(4px); }
          100% { opacity:1; transform:scale(1) translateY(0); }
        }
        @keyframes nameDrop {
          0%   { opacity:0; transform:translateY(-40px) scale(1.4); filter:blur(6px); }
          100% { opacity:1; transform:translateY(0) scale(1);       filter:blur(0px); }
        }
      `}</style>

      <canvas ref={canvasRef} style={{ position:"absolute", inset:0, width:"100%", height:"100%" }} />

      {/* Card UI layer */}
      {showCard && (
        <div style={{
          position:"absolute", inset:0, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", zIndex:10, pointerEvents:"none", gap:16,
        }}>
          {/* Card name */}
          <div style={{
            fontFamily:"Cinzel Decorative,serif", fontSize:"clamp(16px,4vw,30px)",
            color:"#FFE4E4", letterSpacing:6,
            textShadow:"0 0 30px #FF4D4D, 0 0 60px rgba(255,76,76,0.4)",
            opacity: cardOpacity, transition:"opacity 0.5s",
            animation: cardOpacity > 0.5 ? "nameDrop 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
          }}>
            {card.name}
          </div>
          <div style={{ fontSize:"clamp(10px,2vw,13px)", color:"#FF6060",
            fontFamily:"Cinzel,serif", letterSpacing:4, opacity:cardOpacity, transition:"opacity 0.5s" }}>
            {card.title}
          </div>

          <div style={{
            opacity: cardOpacity, transition:"opacity 0.5s",
            filter:"drop-shadow(0 0 40px #FF4D4D) drop-shadow(0 0 80px rgba(255,76,76,0.4))",
            animation: cardOpacity > 0.5 ? "cardEntrance 0.9s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
          }}>
            <Card card={card} size="large" glowing />
          </div>
        </div>
      )}

      {/* Skip hint */}
      <div style={{
        position:"absolute", bottom:24, left:"50%", transform:"translateX(-50%)",
        zIndex:20, padding:"8px 20px", borderRadius:999,
        background:"rgba(0,0,0,0.6)", border:"1px solid rgba(255,76,76,0.3)",
        fontSize:11, letterSpacing:2, color:"rgba(255,180,180,0.5)",
        fontFamily:"Cinzel,serif",
      }}>
        CLICK TO SKIP
      </div>
    </div>
  );
}
