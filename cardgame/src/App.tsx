import { useState, useEffect, useRef, useCallback } from "react";
import MythicalCutscene from "./MythicalCutscene";
import GameLobby from "./GameLobby";

export type Rarity = "mythical" | "legendary" | "epic" | "rare" | "uncommon" | "common";

export interface CardDefinition {
  id: string;
  name: string;
  title: string;
  image: string;
  rarity: Rarity;
  faction: string;
  element: string;
  atk: number;
  def: number;
  spd: number;
  lore: string;
  cutsceneQuote: string;
  cutsceneBg: string;
}

export const CARD_DATABASE: CardDefinition[] = [
  {
    id: "m_warid_emperor",
    name: "The Former Emperor - Warid",
    title: "อดีตจักรพรรดิ",
    image: "wiki image/การ์ดตัวละคร/The Former Emperor - Warid.jpeg",
    rarity: "mythical",
    faction: "วาริด",
    element: "👤 ตัวละคร",
    atk: 950, def: 850, spd: 800,
    lore: "ยิ่งการ์ดในมือน้อยเท่าไหร่ (ต่ำสุด 3 ใบ) ดาเมจของตัวละครนี้และอีก 2 ใบที่เหลือจะเพิ่มขึ้นอย่างละ 1 ทุกเทิร์นสามารถสังหารการ์ดของตัวเองเพื่อเพิ่มพลัง 1 (stack ไม่ได้) ถ้าสังหารลูกน้องหรือเผ่าพันธุ์วิลทั่มระดับ Legendary ขึ้นไปจะได้ดาเมจ +2 และเกราะ +1 ใส่ในเด็คได้แค่ 1 ตัว",
    cutsceneQuote: "มีเพียงผู้แข็งแกร่งเท่านั้นที่สมควรเดินอยู่ท่ามกลางจักรวรรดิของข้า",
    cutsceneBg: "radial-gradient(ellipse at center, #3a0000 0%, #1a0000 35%, #050000 100%)",
  },
  {
    id: "l_euro_emperor",
    name: "The Reigning Emperor - Euro",
    title: "จักรพรรดิองค์ใหม่",
    image: "wiki image/การ์ดตัวละคร/The Reigning Emperor - Euro.png",
    rarity: "mythical",
    faction: "ยูโร",
    element: "👤 ตัวละคร",
    atk: 780, def: 900, spd: 720,
    lore: "ยิ่งมีตัวละครในทีมมากเท่าไหร่ยิ่งเก่ง — 3 ตัวต่อ 1 Power, 6 ตัวต่อ 1 เกาะป้องกัน (ลบไม่ได้)",
    cutsceneQuote: "จักรวรรดิของข้า จะถูกจดจำในฐานะบ้าน… ไม่ใช่สนามประหาร",
    cutsceneBg: "radial-gradient(ellipse at center, #1a2000 0%, #0a1500 40%, #020500 100%)",
  },
  {
    id: "l_warid_hacker",
    name: "The Godlike Hacker - Warid",
    title: "สุดยอดแฮกเกอร์",
    image: "wiki image/การ์ดตัวละคร/The Godlike Hacker - Warid.jpeg",
    rarity: "legendary",
    faction: "วาริด",
    element: "👤 ตัวละคร",
    atk: 880, def: 700, spd: 820,
    lore: "เมื่อมีการ์ดแฮกเกอร์ในสนาม จะได้รับ SPD +20 เท่านั้น หากมีการ์ดแฮกเกอร์อย่างน้อย 1 ใบ จะสามารถเลือกใช้ดีบัฟได้ 1 อย่างต่อเทิร์น",
    cutsceneQuote: "ไอแก่มึงโดนกูสูบเงินหมดบัญชีแน่",
    cutsceneBg: "radial-gradient(ellipse at center, #001a3a 0%, #000a1a 40%, #000205 100%)",
  },
  {
    id: "l_reu",
    name: "เรอะ",
    title: "The Negation",
    image: "wiki image/การ์ดตอบโต้แล้วทิ้ง/เรอะ.png",
    rarity: "legendary",
    faction: "ยูโร",
    element: "🛡 ตอบโต้",
    atk: 200, def: 350, spd: 500,
    lore: "เมื่อศัตรูใช้การ์ดที่มีผลมากกว่า 3 บรรทัด — สุ่มลบ 1 effect ออกจากการ์ดนั้นทันที",
    cutsceneQuote: "เราะ??",
    cutsceneBg: "radial-gradient(ellipse at center, #2a1500 0%, #1a0a00 40%, #050100 100%)",
  },
  {
    id: "e_tun",
    name: "ไอ้ตันขับรถ",
    title: "The Delivery",
    image: "wiki image/การ์ดใช้แล้วทิ้งแบบ hybrid/ไอ้ตันขับรถ.png",
    rarity: "epic",
    faction: "กัปตัน",
    element: "⚡ Hybrid",
    atk: 250, def: 300, spd: 400,
    lore: "ใช้แล้วต้องรอ 1 เทิร์น — หลังจากนั้นกัปตันจะขับรถมาส่งการ์ดให้ โดยหยิบจากเด็ค 3 ใบ",
    cutsceneQuote: "บ้านมึงอยู่ไกลมันเลยมาช้า",
    cutsceneBg: "radial-gradient(ellipse at center, #2a1a00 0%, #1a0d00 40%, #050200 100%)",
  },
  {
    id: "r_pek",
    name: "Pek",
    title: "เป็ก",
    image: "wiki image/การ์ดตัวละคร/Pek.png",
    rarity: "rare",
    faction: "เป็ก",
    element: "👤 ตัวละคร",
    atk: 500, def: 420, spd: 460,
    lore: "มันก็เป็นคนธรรมดานี่แหละ",
    cutsceneQuote: "",
    cutsceneBg: "",
  },
  {
    id: "r_hacker_pek",
    name: "Hacker - Pek",
    title: "แฮกเกอร์เป็ก",
    image: "wiki image/การ์ดตัวละคร/Hacker - pek.png",
    rarity: "rare",
    faction: "เป็ก",
    element: "👤 ตัวละคร",
    atk: 580, def: 380, spd: 560,
    lore: "เป็กในร่างแฮกเกอร์ — ใช้ทักษะดิจิทัลโจมตีจุดอ่อนศัตรู",
    cutsceneQuote: "",
    cutsceneBg: "",
  },
  {
    id: "r_hacker_card",
    name: "Hacker - Card",
    title: "แฮกเกอร์การ์ด",
    image: "wiki image/การ์ดตัวละคร/Hacker - card.png",
    rarity: "rare",
    faction: "การ์ด",
    element: "👤 ตัวละคร",
    atk: 550, def: 400, spd: 600,
    lore: "แฮกเกอร์ที่สามารถจัดการระบบการ์ดได้ — รวดเร็วและคาดเดาไม่ได้",
    cutsceneQuote: "",
    cutsceneBg: "",
  },
  {
    id: "r_yan",
    name: "ญาณทิพย์",
    title: "The Third Eye",
    image: "wiki image/การ์ดใช้แล้วทิ้ง/ญาณทิพย์.png",
    rarity: "rare",
    faction: "ยูโร",
    element: "🗑 ใช้แล้วทิ้ง",
    atk: 150, def: 80, spd: 350,
    lore: "ใช้แล้วทิ้ง — ในครั้งที่ 3 จะสามารถดูดการ์ดถัดไปของฝั่งตรงข้ามที่ยังไม่ได้เอาออกจากเด็ค",
    cutsceneQuote: "",
    cutsceneBg: "",
  },
  {
    id: "u_ignore",
    name: "Ignore",
    title: "เมิน",
    image: "wiki image/การ์ดใช้แล้วทิ้ง/ignore.png",
    rarity: "uncommon",
    faction: "เฌอแตม",
    element: "🛡 ตอบโต้",
    atk: 60, def: 420, spd: 200,
    lore: "ไม่สนใจศัตรู 1 เทิร์น — ถ้าฝ่ายตรงข้ามตี จะทิ้งการ์ดในมือฝ่ายตรงข้ามแบบสุ่ม 1 ใบ",
    cutsceneQuote: "",
    cutsceneBg: "",
  },
  {
    id: "u_song",
    name: "ส่องเบิ่ง",
    title: "The Scout",
    image: "wiki image/การ์ดใช้แล้วทิ้ง/ส่องเบิ่ง.png",
    rarity: "uncommon",
    faction: "ยูโร",
    element: "🗑 ใช้แล้วทิ้ง",
    atk: 100, def: 50, spd: 320,
    lore: "เมื่อใช้งานจะสามารถดูการ์ดของศัตรูในมือได้ทั้งหมด 1 เทิร์น",
    cutsceneQuote: "",
    cutsceneBg: "",
  },
];

export const RARITY_CONFIG: Record<Rarity, {
  weight: number; label: string; stars: number;
  color: string; glow: string; glowSoft: string;
  border: string; textColor: string; bgGradient: string;
  particleColors: string[]; cutsceneDuration: number;
  hasCutscene: boolean; rate: string;
}> = {
  mythical: {
    weight: 0.5, label: "MYTHICAL", stars: 6,
    color: "#FF4D4D", glow: "rgba(255,76,76,0.9)", glowSoft: "rgba(255,76,76,0.28)",
    border: "#FF4D4D", textColor: "#FFE4E4",
    bgGradient: "linear-gradient(135deg, #250303 0%, #0d0303 100%)",
    particleColors: ["#FF4D4D", "#FF8A8A", "#FFD6D6", "#8B0000", "#FF3030", "#FFFFFF"],
    cutsceneDuration: 8200, hasCutscene: true, rate: "0.5%",
  },
  legendary: {
    weight: 1.5, label: "LEGENDARY", stars: 5,
    color: "#FFB800", glow: "rgba(255,184,0,0.7)", glowSoft: "rgba(255,184,0,0.15)",
    border: "#FFB800", textColor: "#FFE566",
    bgGradient: "linear-gradient(135deg, #2a1500 0%, #1a0a00 100%)",
    particleColors: ["#FFB800", "#FFE566", "#FF8C00", "#FFDA44"],
    cutsceneDuration: 4200, hasCutscene: true, rate: "1.5%",
  },
  epic: {
    weight: 8, label: "EPIC", stars: 4,
    color: "#C040FF", glow: "rgba(192,64,255,0.6)", glowSoft: "rgba(192,64,255,0.12)",
    border: "#C040FF", textColor: "#D880FF",
    bgGradient: "linear-gradient(135deg, #1a0030 0%, #0a0018 100%)",
    particleColors: ["#C040FF", "#E080FF", "#8000CC", "#F0B0FF"],
    cutsceneDuration: 3500, hasCutscene: true, rate: "8%",
  },
  rare: {
    weight: 20, label: "RARE", stars: 3,
    color: "#1E90FF", glow: "rgba(30,144,255,0.5)", glowSoft: "rgba(30,144,255,0.10)",
    border: "#1E90FF", textColor: "#70C0FF",
    bgGradient: "linear-gradient(135deg, #001830 0%, #000c1a 100%)",
    particleColors: ["#1E90FF", "#70C0FF", "#0050CC"],
    cutsceneDuration: 0, hasCutscene: false, rate: "20%",
  },
  uncommon: {
    weight: 30, label: "UNCOMMON", stars: 2,
    color: "#00C864", glow: "rgba(0,200,100,0.4)", glowSoft: "rgba(0,200,100,0.08)",
    border: "#00C864", textColor: "#50E090",
    bgGradient: "linear-gradient(135deg, #001a08 0%, #000c04 100%)",
    particleColors: ["#00C864", "#50E090"],
    cutsceneDuration: 0, hasCutscene: false, rate: "30%",
  },
  common: {
    weight: 40, label: "COMMON", stars: 1,
    color: "#888888", glow: "rgba(136,136,136,0.3)", glowSoft: "rgba(136,136,136,0.06)",
    border: "#555555", textColor: "#AAAAAA",
    bgGradient: "linear-gradient(135deg, #111111 0%, #080808 100%)",
    particleColors: ["#888888", "#AAAAAA"],
    cutsceneDuration: 0, hasCutscene: false, rate: "40%",
  },
};

interface OwnedCard extends CardDefinition {
  count: number;
  isNew: boolean;
  instanceId: string;
}

// ── ลบ cutscene_flash ออกจาก Phase type ──
type Phase =
  | "idle"
  | "cutscene_reveal"
  | "cutscene_title"
  | "card_flip"
  | "card_shown"
  | "multi_result";

const EMOJI_FALLBACK: Record<Rarity, string> = {
  mythical: "👑", legendary: "🐉", epic: "💜", rare: "💙", uncommon: "💚", common: "⬜",
};

function rollRarity(): Rarity {
  const r = Math.random() * 100;
  if (r < 0.75) return "mythical";
  if (r < 2.25) return "legendary";
  if (r < 7.0)  return "epic";
  if (r < 30.0) return "rare";
  if (r < 60.0) return "uncommon";
  return "common";
}

function rollCard(): CardDefinition {
  const rarity = rollRarity();
  const pool = CARD_DATABASE.filter(c => c.rarity === rarity);
  const finalPool = pool.length > 0 ? pool : CARD_DATABASE;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

function starsString(n: number): string {
  const max = Math.max(5, n);
  return "★".repeat(n) + "☆".repeat(max - n);
}

// ── PARTICLE SYSTEM ──────────────────────────────────────────
interface Particle {
  id: number; x: number; y: number; vx: number; vy: number;
  color: string; size: number; life: number; maxLife: number;
}

function useParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const nextId = useRef(0);
  const rafRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const spawn = useCallback((cx: number, cy: number, colors: string[], count: number) => {
    const newP: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      return {
        id: nextId.current++, x: cx, y: cy,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5, life: 1,
        maxLife: 60 + Math.random() * 40,
      };
    });
    particlesRef.current = [...particlesRef.current, ...newP];
  }, []);

  useEffect(() => {
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 16, 3);
      last = now;
      particlesRef.current = particlesRef.current
        .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + 0.15 * dt, life: p.life - dt / p.maxLife }))
        .filter(p => p.life > 0);
      setParticles([...particlesRef.current]);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return { particles, spawn };
}

// ── CARD COMPONENT ────────────────────────────────────────────
interface CardProps {
  card: CardDefinition;
  showBack?: boolean;
  size?: "small" | "medium" | "large";
  onClick?: () => void;
  isNew?: boolean;
  glowing?: boolean;
  draggable?: boolean;
}

export function Card({ card, showBack = false, size = "medium", onClick, isNew, glowing, draggable }: CardProps) {
  const cfg = RARITY_CONFIG[card.rarity];
  const cardRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; angleX: number; angleY: number } | null>(null);
  const dragMovedRef = useRef(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0, shine: { x: 50, y: 50 } });
  const [dragAngle, setDragAngle] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dims = {
    small:  { w: "clamp(64px, 17vw, 80px)",  h: "clamp(90px, 24vw, 112px)",  artRatio: 0.55, font: 7,  pad: 4 },
    medium: { w: "clamp(120px, 32vw, 160px)", h: "clamp(168px, 45vw, 224px)", artRatio: 0.58, font: 11, pad: 8 },
    large:  { w: "clamp(160px, 46vw, 240px)", h: "clamp(224px, 64vw, 336px)", artRatio: 0.59, font: 14, pad: 12 },
  }[size];

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggable || size === "small") return;
    e.preventDefault();
    dragMovedRef.current = false;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, angleX: dragAngle.x, angleY: dragAngle.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (size === "small") return;
    if (draggable && isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMovedRef.current = true;
      setDragAngle({ x: dragStartRef.current.angleX + dy * 0.4, y: dragStartRef.current.angleY - dx * 0.4 });
      return;
    }
    const rect = cardRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setTilt({ x: (y - 0.5) * 24, y: -(x - 0.5) * 24, shine: { x: x * 100, y: y * 100 } });
  };

  const handleMouseUp = () => {
    if (!draggable) return;
    setIsDragging(false);
    dragStartRef.current = null;
    if (!dragMovedRef.current && onClick) onClick();
  };

  const handleMouseLeave = () => {
    if (draggable) { setIsDragging(false); dragStartRef.current = null; return; }
    setTilt({ x: 0, y: 0, shine: { x: 50, y: 50 } });
  };

  return (
    <div
      ref={cardRef}
      onClick={draggable ? undefined : onClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        width: dims.w, height: dims.h,
        perspective: 800,
        cursor: draggable ? (isDragging ? "grabbing" : "grab") : onClick ? "pointer" : "default",
        position: "relative", flexShrink: 0,
        userSelect: draggable ? "none" : undefined,
      }}
    >
      {isNew && (
        <div style={{
          position: "absolute", top: -4, right: -4, zIndex: 20,
          background: "#FF3860", color: "#fff",
          fontSize: 7, fontWeight: 700, padding: "2px 5px",
          borderRadius: 3, letterSpacing: 1, fontFamily: "Cinzel, serif",
        }}>NEW</div>
      )}
      <div style={{
        width: "100%", height: "100%",
        transformStyle: "preserve-3d",
        transition: draggable && !isDragging ? "transform 0.3s ease-out" : showBack ? "none" : "transform 0.08s ease-out",
        transform: draggable
          ? `rotateX(${dragAngle.x}deg) rotateY(${dragAngle.y}deg)`
          : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        borderRadius: 12,
        boxShadow: glowing
          ? `0 0 30px ${cfg.glow}, 0 0 60px ${cfg.glowSoft}, 0 8px 32px rgba(0,0,0,0.8)`
          : `0 0 ${card.rarity === "mythical" ? 30 : card.rarity === "legendary" ? 20 : 10}px ${cfg.glow}, 0 8px 24px rgba(0,0,0,0.7)`,
      }}>
        <div style={{
          position: "absolute", inset: 0, borderRadius: 12,
          border: `${size === "small" ? 1.5 : 2}px solid ${cfg.border}`,
          overflow: "hidden", background: cfg.bgGradient,
          display: "flex", flexDirection: "column",
        }}>
          {size !== "small" && (
            <div style={{
              position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none",
              background: draggable
                ? "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.06) 0%, transparent 55%)"
                : `radial-gradient(circle at ${tilt.shine.x}% ${tilt.shine.y}%, rgba(255,255,255,0.12) 0%, transparent 60%)`,
              mixBlendMode: "screen",
            }} />
          )}

          <div style={{
            flex: `0 0 ${dims.artRatio * 100}%`,
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 80%, ${cfg.glowSoft} 0%, transparent 70%)` }} />
            {size === "large" && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 2, opacity: 0.04,
                backgroundImage: "repeating-linear-gradient(0deg, #fff, #fff 1px, transparent 1px, transparent 3px)",
              }} />
            )}
            {card.image ? (
              <img
                src={card.image}
                alt={card.name}
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  position: "absolute", inset: 0,
                  transform: `translateZ(8px) scale(${1 + Math.abs(tilt.x + tilt.y) * 0.002})`,
                  transition: "transform 0.08s ease-out",
                }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div style={{
                fontSize: "2em",
                transform: "translateZ(20px)",
                filter: `drop-shadow(0 0 10px ${cfg.color}88)`,
                zIndex: 3,
              }}>
                {EMOJI_FALLBACK[card.rarity]}
              </div>
            )}
            <div style={{
              position: "absolute", top: dims.pad / 2, left: dims.pad / 2, zIndex: 5,
              background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
              borderRadius: 4, padding: `2px ${dims.pad / 2}px`,
              fontSize: dims.font - 2, color: cfg.textColor,
              fontFamily: "Cinzel, serif", letterSpacing: 1,
              border: `0.5px solid ${cfg.border}44`,
            }}>
              {card.element}
            </div>
            <div style={{
              position: "absolute", top: dims.pad / 2, right: dims.pad / 2, zIndex: 5,
              fontSize: dims.font - 2, color: cfg.textColor,
              fontFamily: "Cinzel, serif", letterSpacing: 1, fontWeight: 600,
            }}>
              {size !== "small" && cfg.label}
            </div>
          </div>

          <div style={{
            flex: 1, padding: `${dims.pad / 2}px ${dims.pad}px ${dims.pad}px`,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            background: "rgba(0,0,0,0.6)",
            borderTop: `0.5px solid ${cfg.border}44`,
            overflow: "hidden",
          }}>
            <div>
              <div style={{
                fontFamily: "Cinzel Decorative, Cinzel, serif",
                fontSize: dims.font + (size === "large" ? 2 : 0),
                color: cfg.textColor, fontWeight: 700,
                lineHeight: 1.2, letterSpacing: 0.5,
                textShadow: `0 0 12px ${cfg.color}88`,
                overflow: "hidden", textOverflow: "ellipsis",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {card.name}
              </div>
              {size !== "small" && (
                <div style={{
                  fontSize: dims.font - 2, color: "#666",
                  fontFamily: "Cinzel, serif", letterSpacing: 1, marginTop: 2,
                }}>
                  {card.title}
                </div>
              )}
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginTop: dims.pad / 2,
            }}>
              <div style={{ fontSize: dims.font - 1, color: cfg.color, letterSpacing: 0.5 }}>
                {starsString(RARITY_CONFIG[card.rarity].stars)}
              </div>
              {size !== "small" && (
                <div style={{ display: "flex", gap: 6 }}>
                  {([["⚔", card.atk], ["🛡", card.def], ["💨", card.spd]] as [string, number][]).map(([ic, val]) => (
                    <div key={ic} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: dims.font - 3, color: "#444" }}>{ic}</div>
                      <div style={{ fontSize: dims.font - 2, color: "#888", fontWeight: 600 }}>{val}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CARD BACK ─────────────────────────────────────────────────
function CardBack({ size = "medium" }: { size?: "small" | "medium" | "large" }) {
  const dims = {
    small:  { w: "clamp(64px, 17vw, 80px)",  h: "clamp(90px, 24vw, 112px)",  spine: 6  },
    medium: { w: "clamp(120px, 32vw, 160px)", h: "clamp(168px, 45vw, 224px)", spine: 10 },
    large:  { w: "clamp(160px, 46vw, 240px)", h: "clamp(224px, 64vw, 336px)", spine: 14 },
  }[size];

  return (
    <div style={{ display: "flex", flexShrink: 0, position: "relative" }}>
      <div style={{
        width: dims.spine, height: dims.h,
        background: "linear-gradient(180deg, #2a0a50 0%, #4a1880 30%, #6030a0 50%, #4a1880 70%, #1a0830 100%)",
        borderRadius: "2px 0 0 2px",
        boxShadow: "inset -2px 0 4px rgba(0,0,0,0.5)",
        flexShrink: 0,
      }} />
      <div style={{
        width: dims.w, height: dims.h,
        borderRadius: "0 10px 10px 0",
        border: "1.5px solid #5030a0", borderLeft: "none",
        background: "linear-gradient(135deg, #1a0a3a 0%, #0d0522 50%, #1a0a3a 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", position: "relative", overflow: "hidden", flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(80,48,160,0.15) 1px, transparent 1px),linear-gradient(90deg, rgba(80,48,160,0.15) 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(45deg, rgba(96,48,160,0.08) 25%, transparent 25%),linear-gradient(-45deg, rgba(96,48,160,0.08) 25%, transparent 25%),linear-gradient(45deg, transparent 75%, rgba(96,48,160,0.08) 75%),linear-gradient(-45deg, transparent 75%, rgba(96,48,160,0.08) 75%)",
          backgroundSize: "18px 18px",
          backgroundPosition: "0 0, 0 9px, 9px -9px, -9px 0px",
        }} />
        <div style={{
          position: "absolute", inset: size === "small" ? 4 : 8,
          border: "0.8px solid rgba(128,96,208,0.5)", borderRadius: 6, pointerEvents: "none",
        }} />
        {size !== "small" && (
          <div style={{
            position: "absolute", inset: 14,
            border: "0.5px solid rgba(80,48,160,0.3)", borderRadius: 4, pointerEvents: "none",
          }} />
        )}
        {size !== "small" && (
          <>
            {[{ top: 10, left: 10, rotate: "0deg" }, { top: 10, right: 10, rotate: "90deg" }, { bottom: 10, left: 10, rotate: "270deg" }, { bottom: 10, right: 10, rotate: "180deg" }].map((pos, i) => (
              <svg key={i} width="14" height="14" style={{ position: "absolute", ...pos, opacity: 0.7, transform: `rotate(${pos.rotate})` }}>
                <path d="M2 12 L2 2 L12 2" fill="none" stroke="#8060d0" strokeWidth="1"/>
              </svg>
            ))}
            <div style={{
              position: "absolute",
              width: size === "large" ? 76 : 50, height: size === "large" ? 76 : 50,
              borderRadius: "50%", border: "0.8px solid rgba(80,48,160,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(18,6,42,0.8)",
            }}>
              <svg width={size === "large" ? 44 : 30} height={size === "large" ? 44 : 30} viewBox="0 0 44 44">
                <polygon points="22,2 25,18 41,22 25,26 22,42 19,26 3,22 19,18" fill="none" stroke="#9060e0" strokeWidth="1" opacity="0.9"/>
                <circle cx="22" cy="22" r="5" fill="#6040b0" opacity="0.6"/>
                <circle cx="22" cy="22" r="2.5" fill="#c0a0ff"/>
              </svg>
            </div>
            <div style={{ position: "absolute", top: size === "large" ? 22 : 16, left: 0, right: 0, textAlign: "center", fontSize: size === "large" ? 7 : 6, color: "#5030a0", letterSpacing: 3, fontFamily: "Cinzel, serif", opacity: 0.7 }}>✦ ARCANE ✦</div>
            <div style={{ position: "absolute", bottom: size === "large" ? 22 : 16, left: 0, right: 0, textAlign: "center", fontSize: size === "large" ? 7 : 6, color: "#5030a0", letterSpacing: 3, fontFamily: "Cinzel, serif", opacity: 0.7 }}>ARCHIVES</div>
          </>
        )}
        {size === "small" && (
          <div style={{ fontSize: 20, filter: "drop-shadow(0 0 8px rgba(160,100,255,0.7))", zIndex: 1 }}>🔮</div>
        )}
      </div>
    </div>
  );
}

// ── LEGENDARY / EPIC CUTSCENE ─────────────────────────────────
// แก้: ไม่มี flash phase, ใช้ flex column แทน absolute ทุกอย่าง
interface CutsceneProps {
  card: CardDefinition;
  phase: Phase;
  onComplete: () => void;
}

function LegendaryCutscene({ card, phase, onComplete }: CutsceneProps) {
  const cfg = RARITY_CONFIG[card.rarity];
  const [showQuote, setShowQuote]   = useState(false);
  const [showTitle, setShowTitle]   = useState(false);
  const [showCard,  setShowCard]    = useState(false);
  const skipRef = useRef(false);

  useEffect(() => {
    skipRef.current = false;
    setShowQuote(false);
    setShowTitle(false);
    setShowCard(false);

    if (phase !== "cutscene_reveal") return;

    const t1 = setTimeout(() => setShowQuote(true), 300);
    const t2 = setTimeout(() => setShowTitle(true), 1200);
    const t3 = setTimeout(() => setShowCard(true),  2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [phase]);

  const handleSkip = useCallback(() => {
    if (skipRef.current) return;
    skipRef.current = true;
    onComplete();
  }, [onComplete]);

  if (phase !== "cutscene_reveal") return null;

  return (
    <div
      onClick={handleSkip}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        // ── flex column แทน absolute ทุกอย่าง ──
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-evenly",
        padding: "64px 24px",          // cinematic bar บน-ล่างด้วย padding
        gap: 0,
        background: card.cutsceneBg || "radial-gradient(ellipse at center, #1a0030 0%, #000 100%)",
        animation: "csFadeIn 0.45s ease forwards",  // fade in ครั้งเดียว
        cursor: "pointer",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes csFadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes quoteIn     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes titleIn     { from{opacity:0;transform:translateY(24px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes cardReveal  { 0%{opacity:0;transform:scale(0.4) rotateY(180deg)} 70%{transform:scale(1.06) rotateY(-4deg)} 100%{opacity:1;transform:scale(1) rotateY(0)} }
        @keyframes pulseGlow   { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes scanDown    { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes lineExpand  { from{opacity:0;width:0} to{opacity:1;width:80%} }
      `}</style>

      {/* scan line */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
          animation: "scanDown 2s linear infinite", opacity: 0.45,
        }} />
      </div>

      {/* star particles */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: Array.from({ length: 20 }, (_, i) =>
          `radial-gradient(1.5px 1.5px at ${(i * 37 + 5) % 100}% ${(i * 53 + 10) % 100}%, ${cfg.color}88 0%, transparent 100%)`
        ).join(","),
        animation: "pulseGlow 3s ease-in-out infinite",
      }} />

      {/* ── rarity label ── */}
      <div style={{
        fontFamily: "Cinzel Decorative, serif",
        fontSize: "clamp(9px, 2vw, 12px)",
        letterSpacing: 8, color: cfg.color, opacity: 0.6,
        textTransform: "uppercase", zIndex: 10,
      }}>
        ✦ {cfg.label} ✦
      </div>

      {/* ── quote ── */}
      <div style={{
        zIndex: 10, width: "100%",
        display: "flex", flexDirection: "column", alignItems: "center",
        opacity: showQuote ? 1 : 0,
        animation: showQuote ? "quoteIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards" : "none",
      }}>
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
          animation: showQuote ? "lineExpand 0.6s ease-out forwards" : "none",
          width: 0, marginBottom: 14,
        }} />
        {card.cutsceneQuote && (
          <div style={{
            fontFamily: "Cinzel Decorative, serif",
            fontSize: "clamp(11px, 2.8vw, 18px)",
            color: cfg.textColor, letterSpacing: 3,
            textAlign: "center", padding: "0 16px",
            lineHeight: 1.7,
            textShadow: `0 0 24px ${cfg.color}`,
          }}>
            {card.cutsceneQuote}
          </div>
        )}
        <div style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${cfg.color}, transparent)`,
          animation: showQuote ? "lineExpand 0.6s ease-out 0.15s forwards" : "none",
          width: 0, marginTop: 14,
        }} />
      </div>

      {/* ── card name + title ── */}
      <div style={{
        zIndex: 10, textAlign: "center",
        opacity: showTitle ? 1 : 0,
        animation: showTitle ? "titleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
      }}>
        <div style={{
          fontFamily: "Cinzel Decorative, serif",
          fontSize: "clamp(15px, 4.5vw, 34px)",
          color: cfg.textColor, letterSpacing: 5, fontWeight: 700,
          textShadow: `0 0 40px ${cfg.color}, 0 0 80px ${cfg.glowSoft}`,
        }}>
          {card.name}
        </div>
        <div style={{
          fontSize: "clamp(10px, 2vw, 13px)", color: cfg.color,
          fontFamily: "Cinzel, serif", letterSpacing: 4, marginTop: 8, opacity: 0.8,
        }}>
          {card.title}
        </div>
      </div>

      {/* ── card visual ── */}
      <div style={{
        zIndex: 10,
        opacity: showCard ? 1 : 0,
        animation: showCard ? "cardReveal 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
        filter: `drop-shadow(0 0 40px ${cfg.color}) drop-shadow(0 0 80px ${cfg.glow})`,
        // ป้องกันการ์ดใหญ่เกินไปบนหน้าจอเล็ก
        maxHeight: "38vh",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Card card={card} size="large" glowing />
      </div>

      {/* ── skip hint ── */}
      <div style={{
        zIndex: 20, padding: "7px 18px", borderRadius: 999,
        background: "rgba(0,0,0,0.55)",
        border: `1px solid ${cfg.border}55`,
        fontSize: 11, letterSpacing: 2, color: cfg.textColor,
      }}>
        CLICK TO CONTINUE
      </div>
    </div>
  );
}

// ── SPARK ─────────────────────────────────────────────────────
interface Spark { id: number; x: number; y: number; vx: number; vy: number; life: number; size: number; }

// ── COLLECTION MODAL ──────────────────────────────────────────
function CollectionModal({ card, onClose }: { card: OwnedCard; onClose: () => void }) {
  const cfg = RARITY_CONFIG[card.rarity];
  const [mode, setMode] = useState<"card" | "transitioning-open" | "art" | "transitioning-close">("card");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHolding, setIsHolding] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringProgress = useRef(0);
  const ringRaf = useRef<number>(0);
  const [ringAngle, setRingAngle] = useState(0);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparkIdRef = useRef(0);
  const sparksRef = useRef<Spark[]>([]);
  const sparksRaf = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const moved = useRef(false);
  const [chainPhase, setChainPhase] = useState(0);
  const [artBlur, setArtBlur] = useState(10);
  const [artOpacity, setArtOpacity] = useState(0);
  const [artScale, setArtScale] = useState(1.3);

  const isNarrow = typeof window !== "undefined" && window.innerWidth < 520;

  const spawnSparks = useCallback((cx: number, cy: number, count = 12) => {
    const newSparks: Spark[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;
      return { id: sparkIdRef.current++, x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life: 1, size: 4 + Math.random() * 6 };
    });
    sparksRef.current = [...sparksRef.current, ...newSparks];
  }, []);

  useEffect(() => {
    const tick = () => {
      sparksRef.current = sparksRef.current.map(s => ({ ...s, x: s.x + s.vx, y: s.y + s.vy, vy: s.vy + 0.2, life: s.life - 0.04 })).filter(s => s.life > 0);
      setSparks([...sparksRef.current]);
      sparksRaf.current = requestAnimationFrame(tick);
    };
    sparksRaf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(sparksRaf.current);
  }, []);

  useEffect(() => {
    if (!isHolding) { ringProgress.current = 0; setRingAngle(0); cancelAnimationFrame(ringRaf.current); return; }
    const start = performance.now();
    const duration = 1000;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      ringProgress.current = t; setRingAngle(t * 360 * 2);
      if (t < 1) { ringRaf.current = requestAnimationFrame(tick); } else { triggerOpen(); }
    };
    ringRaf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ringRaf.current);
  }, [isHolding]);

  const triggerOpen = useCallback(() => {
    setIsHolding(false); setMode("transitioning-open"); setChainPhase(1);
    const cx = window.innerWidth / 2; const cy = window.innerHeight / 2;
    spawnSparks(cx, cy, 20);
    setTimeout(() => { spawnSparks(cx - 60, cy, 10); spawnSparks(cx + 60, cy, 10); }, 150);
    setTimeout(() => setChainPhase(2), 500);
    setTimeout(() => { spawnSparks(cx - 120, cy - 40, 14); spawnSparks(cx + 120, cy + 40, 14); }, 600);
    setTimeout(() => { setMode("art"); setArtBlur(10); setArtOpacity(0); setArtScale(1.3); setTimeout(() => { setArtBlur(0); setArtOpacity(1); setArtScale(1); }, 50); setChainPhase(0); }, 900);
  }, [spawnSparks]);

  const triggerClose = useCallback(() => {
    setMode("transitioning-close"); setChainPhase(1);
    const cx = window.innerWidth / 2; const cy = window.innerHeight / 2;
    spawnSparks(cx, cy, 20);
    setTimeout(() => { spawnSparks(cx - 60, cy, 10); spawnSparks(cx + 60, cy, 10); }, 150);
    setTimeout(() => setChainPhase(2), 400);
    setTimeout(() => { spawnSparks(cx - 100, cy, 12); spawnSparks(cx + 100, cy, 12); }, 500);
    setTimeout(() => { setMode("card"); setChainPhase(0); }, 850);
  }, [spawnSparks]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => { setMousePos({ x: e.clientX, y: e.clientY }); }, []);
  const onDown = (e: React.MouseEvent) => { e.preventDefault(); setDragging(true); moved.current = false; dragStart.current = { x: e.clientX, y: e.clientY, rx: rotate.x, ry: rotate.y }; };
  const onMove = (e: React.MouseEvent) => {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x; const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true;
    setRotate({ x: dragStart.current.rx + dy * 0.5, y: dragStart.current.ry - dx * 0.5 });
  };
  const onUp = () => { setDragging(false); dragStart.current = null; if (!moved.current) setRotate({ x: 0, y: 0 }); };
  const onLeave = () => { if (dragging) { setDragging(false); dragStart.current = null; } };
  const statBarColor = (val: number) => val >= 800 ? cfg.color : val >= 600 ? "#aaa" : val >= 400 ? "#666" : "#333";
  const isTransitioning = mode === "transitioning-open" || mode === "transitioning-close";

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseDown={(e) => {
        if (mode !== "card") return;
        if (cardRef.current && !cardRef.current.contains(e.target as Node)) { onClose(); return; }
      }}
      style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(12px)", padding: "16px" }}
    >
      <style>{`
        @keyframes modalPop { 0%{opacity:0;transform:scale(0.85) translateY(20px)} 100%{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes chainSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes chainSpinRev { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
        @keyframes chainSep1 { 0%{transform:translate(0,0) rotate(-20deg)} 100%{transform:translate(-180px,-80px) rotate(-40deg)} }
        @keyframes chainSep2 { 0%{transform:translate(0,0) rotate(20deg)} 100%{transform:translate(180px,80px) rotate(40deg)} }
        @keyframes artFadeIn { 0%{opacity:0;filter:blur(20px);transform:scale(1.4)} 100%{opacity:1;filter:blur(0);transform:scale(1)} }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 600 }}>
        {sparks.map(s => (
          <div key={s.id} style={{ position: "absolute", left: s.x - s.size / 2, top: s.y - s.size / 2, width: s.size, height: s.size, background: cfg.color, opacity: s.life, transform: `rotate(${s.life * 180}deg)`, boxShadow: `0 0 ${s.size}px ${cfg.glow}`, borderRadius: 2 }} />
        ))}
      </div>

      {mode === "card" && isHolding && (
        <div style={{ position: "fixed", left: mousePos.x - 28, top: mousePos.y - 28, width: 56, height: 56, pointerEvents: "none", zIndex: 610 }}>
          <svg width="56" height="56" style={{ transform: `rotate(${ringAngle}deg)` }}>
            <circle cx="28" cy="28" r="24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeOpacity="0.3" />
            <circle cx="28" cy="28" r="24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeDasharray={`${ringProgress.current * 150.8} 150.8`} strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${cfg.color})` }} />
          </svg>
        </div>
      )}

      {(isTransitioning || chainPhase > 0) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 590, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {[1, -1].map((_, idx) => (
            <div key={idx} style={{ position: "absolute", animation: chainPhase === 1 ? (idx === 0 ? "chainSpin 0.3s linear infinite" : "chainSpinRev 0.3s linear infinite") : chainPhase === 2 ? (idx === 0 ? "chainSep1 0.4s ease-out forwards" : "chainSep2 0.4s ease-out forwards") : "none" }}>
              <svg width="120" height="20" viewBox="0 0 120 20" style={idx === 1 ? { transform: "scaleX(-1)" } : {}}>
                {[0,1,2,3,4].map(i => (
                  <g key={i} transform={`translate(${i*24+2},2)`}>
                    <rect x="0" y="4" width="20" height="12" rx="6" fill="none" stroke={cfg.color} strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 3px ${cfg.glow})` }} />
                    <rect x="6" y="0" width="8" height="4" rx="2" fill={cfg.color} opacity="0.6" />
                    <rect x="6" y="16" width="8" height="4" rx="2" fill={cfg.color} opacity="0.6" />
                  </g>
                ))}
              </svg>
            </div>
          ))}
        </div>
      )}

      {(mode === "art" || mode === "transitioning-close") && (
        <div style={{ position: "fixed", inset: 0, zIndex: 550, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.95)" }}>
          <div style={{ transition: "all 0.8s cubic-bezier(0.4,0,0.2,1)", filter: `blur(${artBlur}px)`, opacity: artOpacity, transform: `scale(${artScale})`, maxWidth: "80vw", maxHeight: "75vh", position: "relative" }}>
            {card.image ? (
              <img src={card.image} alt={card.name} style={{ maxWidth: "80vw", maxHeight: "75vh", objectFit: "contain", borderRadius: 8, boxShadow: `0 0 60px ${cfg.glow}, 0 0 120px ${cfg.glowSoft}` }} />
            ) : (
              <div style={{ fontSize: 120, filter: `drop-shadow(0 0 40px ${cfg.color})` }}>{EMOJI_FALLBACK[card.rarity]}</div>
            )}
            <div style={{ position: "absolute", inset: 0, borderRadius: 8, background: `radial-gradient(ellipse at center, transparent 40%, ${cfg.glowSoft} 100%)`, pointerEvents: "none" }} />
          </div>
          <div style={{ marginTop: 20, textAlign: "center", transition: "all 0.8s", opacity: artOpacity }}>
            <div style={{ fontFamily: "Cinzel Decorative, serif", fontSize: "clamp(14px, 4vw, 20px)", color: cfg.textColor, textShadow: `0 0 20px ${cfg.color}` }}>{card.name}</div>
            <div style={{ fontSize: 10, color: cfg.color, letterSpacing: 3, marginTop: 6, opacity: 0.7 }}>{starsString(cfg.stars)} {cfg.label}</div>
          </div>
          <button onClick={triggerClose} style={{ marginTop: 28, background: "transparent", border: `1px solid ${cfg.border}66`, color: cfg.textColor, padding: "10px 32px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 3, cursor: "pointer", textTransform: "uppercase", transition: "all 0.2s", opacity: artOpacity }}
            onMouseEnter={e => (e.currentTarget.style.background = `${cfg.color}22`)}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >← Return</button>
        </div>
      )}

      {(mode === "card" || mode === "transitioning-open") && (
        <div
          ref={cardRef}
          style={{
            display: "flex",
            flexDirection: isNarrow ? "column" : "row",
            gap: 0,
            maxWidth: isNarrow ? "100%" : 680,
            width: "100%",
            maxHeight: "calc(100dvh - 48px)",
            animation: "modalPop 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
            borderRadius: 16, overflow: "hidden",
            border: `1px solid ${cfg.border}66`,
            boxShadow: `0 0 80px ${cfg.glow}, 0 20px 60px rgba(0,0,0,0.8)`,
            opacity: isTransitioning ? 0 : 1,
            transition: "opacity 0.3s",
          }}
        >
          <div
            onMouseDown={(e) => { onDown(e); setIsHolding(true); if (holdTimer.current) clearTimeout(holdTimer.current); }}
            onMouseUp={() => { onUp(); setIsHolding(false); if (holdTimer.current) clearTimeout(holdTimer.current); }}
            onMouseLeave={() => { onLeave(); setIsHolding(false); if (holdTimer.current) clearTimeout(holdTimer.current); }}
            onMouseMove={onMove}
            style={{
              width: isNarrow ? "100%" : 260,
              minWidth: isNarrow ? 0 : 260,
              maxHeight: isNarrow ? "42vh" : "none",
              background: `linear-gradient(160deg, ${cfg.bgGradient.replace("linear-gradient(135deg,", "").replace(")", "")})`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 12, padding: isNarrow ? "16px 20px" : "28px 20px",
              cursor: dragging ? "grabbing" : "grab",
              userSelect: "none", position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,1) 20px, rgba(255,255,255,1) 21px)" }} />
            <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 50% 40%, ${cfg.glowSoft} 0%, transparent 60%)` }} />
            <div style={{ perspective: 900, position: "relative", zIndex: 1 }}>
              <div style={{ transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`, transition: dragging ? "none" : "transform 0.4s ease-out", transformStyle: "preserve-3d", filter: `drop-shadow(0 0 30px ${cfg.glow})` }}>
                <Card card={card} size={isNarrow ? "medium" : "large"} glowing />
              </div>
            </div>
            <div style={{ fontSize: 9, color: cfg.color, letterSpacing: 2, opacity: 0.6, fontFamily: "Cinzel, serif", position: "relative", zIndex: 1 }}>
              {isHolding ? "🔓 HOLD TO REVEAL ART..." : "⟵ DRAG · HOLD TO REVEAL ⟶"}
            </div>
            {card.count > 1 && (
              <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.7)", border: `1px solid ${cfg.border}66`, borderRadius: 20, padding: "4px 10px", fontSize: 10, color: cfg.textColor, fontFamily: "Cinzel, serif", letterSpacing: 1 }}>×{card.count}</div>
            )}
          </div>

          <div style={{ flex: 1, background: "#06040f", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: isNarrow ? 0 : undefined }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: `0.5px solid ${cfg.border}33`, flexShrink: 0 }}>
              <div style={{ fontSize: 8, color: cfg.color, letterSpacing: 4, textTransform: "uppercase", fontFamily: "Cinzel, serif", marginBottom: 6, opacity: 0.8 }}>
                {starsString(cfg.stars)} {cfg.label} · {card.element}
              </div>
              <div style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: 700, color: cfg.textColor, fontFamily: "Cinzel Decorative, serif", lineHeight: 1.2, textShadow: `0 0 20px ${cfg.color}66` }}>
                {card.name}
              </div>
              <div style={{ fontSize: 10, color: "#5a4a35", letterSpacing: 2, marginTop: 4 }}>
                {card.title} · {card.faction}
              </div>
            </div>
            <div style={{ padding: "16px 24px", borderBottom: `0.5px solid ${cfg.border}22`, flexShrink: 0 }}>
              {[{ label: "⚔ ATK", value: card.atk }, { label: "🛡 DEF", value: card.def }, { label: "💨 SPD", value: card.spd }].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: "#5a4a35", letterSpacing: 2, fontFamily: "Cinzel, serif" }}>{label}</span>
                    <span style={{ fontSize: 10, color: statBarColor(value), fontWeight: 600 }}>{value}</span>
                  </div>
                  <div style={{ height: 4, background: "#1a1225", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(value / 1000) * 100}%`, background: `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`, borderRadius: 2, transition: "width 0.8s ease", boxShadow: `0 0 6px ${cfg.glow}` }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, padding: "16px 24px", overflowY: "auto" }}>
              <div style={{ fontSize: 8, color: cfg.color, letterSpacing: 3, textTransform: "uppercase", fontFamily: "Cinzel, serif", marginBottom: 10, opacity: 0.7 }}>✦ Lore & Effect ✦</div>
              <div style={{ fontSize: 11, color: "#7a6a50", lineHeight: 1.9, letterSpacing: 0.3 }}>{card.lore || "ไม่มีข้อมูล"}</div>
            </div>
            <div style={{ padding: "12px 24px", borderTop: `0.5px solid ${cfg.border}22`, display: "flex", gap: 8, flexShrink: 0 }}>
              <button onClick={onClose} style={{ flex: 1, background: "transparent", border: `0.5px solid ${cfg.border}55`, color: "#5a4a35", padding: "9px 0", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 9, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase", transition: "all 0.2s" }}
                onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = `${cfg.border}18`; (e.target as HTMLButtonElement).style.color = cfg.textColor; }}
                onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = "transparent"; (e.target as HTMLButtonElement).style.color = "#5a4a35"; }}
              >✕ Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── IMAGE UPLOAD HELPER ───────────────────────────────────────
function ImageUploadHelper() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ fontFamily: "Cinzel, serif" }}>
      <button onClick={() => setOpen(!open)} style={{ background: "transparent", border: "0.5px solid #3a2a15", color: "#5a4a25", padding: "6px 14px", borderRadius: 6, fontSize: 9, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}>
        {open ? "▲ Hide" : "▼ How to add images"}
      </button>
      {open && (
        <div style={{ marginTop: 8, background: "#080510", border: "0.5px solid #2a1a0a", borderRadius: 8, padding: 14, fontSize: 10, color: "#6a5a35", lineHeight: 1.8, letterSpacing: 0.5 }}>
          <div style={{ color: "#8a7a45", marginBottom: 6, fontSize: 11 }}>📸 เพิ่มรูปการ์ด</div>
          <div>1. อัปรูปขึ้น <span style={{ color: "#aaa" }}>imgur.com</span></div>
          <div>2. คัดลอก Direct Link URL</div>
          <div>3. ใส่ URL ในช่อง <span style={{ color: "#aaa" }}>image: "URL_HERE"</span></div>
          <div style={{ marginTop: 8, color: "#4a3a15" }}>ถ้าไม่ใส่รูป จะแสดง emoji แทนอัตโนมัติ</div>
        </div>
      )}
    </div>
  );
}

// ── COLLECTION CARD ───────────────────────────────────────────
function CollectionCard({ card, cfg, onOpen }: {
  card: OwnedCard;
  cfg: typeof RARITY_CONFIG[Rarity];
  onOpen: () => void;
}) {
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [pressing, setPressing] = useState(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const cumulativeRef = useRef({ x: 0, y: 0 });
  const didDragRef = useRef(false);
  const DRAG_THRESHOLD = 5;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startPosRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false; setPressing(true);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startPosRef.current) return;
    const dx = e.clientX - startPosRef.current.x; const dy = e.clientY - startPosRef.current.y;
    if (!didDragRef.current && (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD)) didDragRef.current = true;
    if (didDragRef.current) {
      const newRotX = Math.max(-45, Math.min(45, cumulativeRef.current.x + dy * 0.6));
      const newRotY = Math.max(-45, Math.min(45, cumulativeRef.current.y - dx * 0.6));
      setRotX(newRotX); setRotY(newRotY);
      startPosRef.current = { x: e.clientX, y: e.clientY };
      cumulativeRef.current = { x: newRotX, y: newRotY };
    }
  };
  const handlePointerUp = () => {
    if (!startPosRef.current) return;
    const wasDrag = didDragRef.current;
    startPosRef.current = null; didDragRef.current = false; setPressing(false);
    if (!wasDrag) { onOpen(); }
    if (wasDrag) { cumulativeRef.current = { x: 0, y: 0 }; setRotX(0); setRotY(0); }
  };
  const handlePointerCancel = () => {
    startPosRef.current = null; didDragRef.current = false; setPressing(false);
    cumulativeRef.current = { x: 0, y: 0 }; setRotX(0); setRotY(0);
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={{
        position: "relative", cursor: pressing ? "grabbing" : "pointer",
        borderRadius: 10,
        background: `linear-gradient(160deg, ${cfg.color}0a 0%, #0d0800 100%)`,
        border: `1px solid ${cfg.border}33`,
        padding: "6px 6px 8px",
        userSelect: "none", touchAction: "none",
        boxShadow: card.isNew ? `0 0 14px ${cfg.color}44` : "none",
      }}
    >
      {card.isNew && (
        <div style={{ position: "absolute", top: -4, right: -4, zIndex: 10, background: "#FF3860", color: "#fff", fontSize: 7, fontWeight: 700, padding: "2px 5px", borderRadius: 3, letterSpacing: 1, fontFamily: "Cinzel, serif" }}>NEW</div>
      )}
      <div style={{ transform: `perspective(500px) rotateX(${rotX}deg) rotateY(${rotY}deg)`, transition: pressing && didDragRef.current ? "none" : "transform 0.35s ease-out", transformStyle: "preserve-3d", willChange: "transform" }}>
        <Card card={card} size="small" onClick={() => {}} />
      </div>
      <div style={{ marginTop: 5, textAlign: "center" }}>
        <div style={{ fontSize: 7, color: cfg.color, letterSpacing: 1, lineHeight: 1 }}>{"★".repeat(cfg.stars)}</div>
      </div>
      {card.count > 1 && (
        <div style={{ position: "absolute", bottom: 28, right: 4, background: "rgba(0,0,0,0.85)", color: cfg.textColor, fontSize: 7, padding: "1px 5px", borderRadius: 3, fontFamily: "Cinzel, serif", letterSpacing: 1, border: `1px solid ${cfg.border}44` }}>×{card.count}</div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────
export default function CardGachaApp() {
  const [view, setView] = useState<"lobby" | "gacha">("lobby");
  const [phase, setPhase] = useState<Phase>("idle");
  const [currentCard, setCurrentCard] = useState<CardDefinition | null>(null);
  const [multiCards, setMultiCards] = useState<CardDefinition[]>([]);
  const [multiFlipped, setMultiFlipped] = useState<boolean[]>([]);
  const [multiAura, setMultiAura] = useState<boolean[]>([]);
  const [multiImpact, setMultiImpact] = useState<boolean[]>([]);
  const [pendingCutsceneIdx, setPendingCutsceneIdx] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [collection, setCollection] = useState<Record<string, OwnedCard>>({});
  const [selectedCard, setSelectedCard] = useState<OwnedCard | null>(null);
  const [totalPulls, setTotalPulls] = useState(0);
  const [tab] = useState<"pull" | "collection">("pull");
  const [colFilter, setColFilter] = useState<Rarity | "all">("all");
  const { particles, spawn } = useParticles();
  const stageRef = useRef<HTMLDivElement>(null);
  const revealQueueRef = useRef<number[]>([]);
  const revealPausedRef = useRef(false);
  const multiCardsRef = useRef<CardDefinition[]>([]);

  const isAnimating = phase !== "idle" && phase !== "card_shown" && phase !== "multi_result";

  const RARITY_ORDER: Rarity[] = ["mythical", "legendary", "epic", "rare", "uncommon", "common"];

  const addToCollection = useCallback((cards: CardDefinition[]) => {
    setCollection(prev => {
      const next = { ...prev };
      cards.forEach(c => {
        if (next[c.id]) { next[c.id] = { ...next[c.id], count: next[c.id].count + 1, isNew: false }; }
        else { next[c.id] = { ...c, count: 1, isNew: true, instanceId: `${c.id}_${Date.now()}` }; }
      });
      return next;
    });
  }, []);

  const spawnParticlesAtStage = useCallback((colors: string[], count: number) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    spawn(rect.left + rect.width / 2, rect.top + rect.height / 2, colors, count);
  }, [spawn]);

  const doSinglePull = useCallback(() => {
    if (isAnimating) return;
    const card = rollCard();
    const cfg = RARITY_CONFIG[card.rarity];
    setCurrentCard(card); setMultiCards([]); setFlipped(false);
    addToCollection([card]); setTotalPulls(p => p + 1);
    if (cfg.hasCutscene) {
      // ── แก้: set reveal ตรง ไม่ผ่าน flash ──
      setPhase("cutscene_reveal");
    } else {
      setPhase("card_flip");
      setTimeout(() => {
        setFlipped(true);
        setTimeout(() => { spawnParticlesAtStage(cfg.particleColors, card.rarity === "rare" ? 12 : 6); setPhase("card_shown"); }, 800);
      }, 100);
    }
  }, [isAnimating, addToCollection, spawnParticlesAtStage]);

  const doMultiPull = useCallback(() => {
    if (isAnimating) return;
    const cards = Array.from({ length: 10 }, rollCard);
    multiCardsRef.current = cards;
    setMultiCards(cards);
    setMultiFlipped(new Array(10).fill(false));
    setMultiAura(new Array(10).fill(false));
    setMultiImpact(new Array(10).fill(false));
    setCurrentCard(null); setPendingCutsceneIdx(null);
    addToCollection(cards); setTotalPulls(p => p + 10);
    setPhase("multi_result");
  }, [isAnimating, addToCollection]);

  const handleBoom = useCallback(() => {
    const cx = window.innerWidth / 2; const cy = window.innerHeight / 2;
    spawn(cx, cy, RARITY_CONFIG.mythical.particleColors, 80);
    setTimeout(() => spawn(cx, cy, ["#FFFFFF", "#FFD700", "#FFA500"], 40), 350);
  }, [spawn]);

  const revealNextCard = useCallback(() => {
    if (revealPausedRef.current) return;
    if (revealQueueRef.current.length === 0) return;
    const [cardIdx, ...rest] = revealQueueRef.current;
    revealQueueRef.current = rest;
    const c = multiCardsRef.current[cardIdx];
    if (!c) return;
    const cfg = RARITY_CONFIG[c.rarity];
    const isCutsceneable = c.rarity === "legendary" || c.rarity === "mythical";
    setMultiFlipped(prev => { const n = [...prev]; n[cardIdx] = true; return n; });
    spawnParticlesAtStage(cfg.particleColors, isCutsceneable ? 30 : 5);
    if (isCutsceneable) {
      revealPausedRef.current = true;
      setPendingCutsceneIdx(cardIdx); setCurrentCard(c);
      // ── แก้: set reveal ตรง ──
      setPhase("cutscene_reveal");
    } else {
      setTimeout(() => { revealNextCard(); }, 230);
    }
  }, [spawnParticlesAtStage]);

  const handleCutsceneDone = useCallback(() => {
    if (pendingCutsceneIdx !== null) {
      const idx = pendingCutsceneIdx;
      setPendingCutsceneIdx(null); setCurrentCard(null);
      setMultiAura(prev => { const n = [...prev]; n[idx] = true; return n; });
      setPhase("multi_result");
      setMultiImpact(prev => { const n = [...prev]; n[idx] = true; return n; });
      setTimeout(() => { setMultiImpact(prev => { const n = [...prev]; n[idx] = false; return n; }); }, 700);
      setTimeout(() => { const cfg = RARITY_CONFIG[multiCardsRef.current[idx]?.rarity ?? "common"]; spawnParticlesAtStage(cfg.particleColors, 40); }, 100);
      setTimeout(() => { revealPausedRef.current = false; revealNextCard(); }, 1650);
      return;
    }
    const cfg = currentCard ? RARITY_CONFIG[currentCard.rarity] : null;
    setPhase("card_flip");
    setTimeout(() => {
      setFlipped(true);
      setTimeout(() => { if (cfg) spawnParticlesAtStage(cfg.particleColors, 24); setPhase("card_shown"); }, 800);
    }, 200);
  }, [currentCard, pendingCutsceneIdx, spawnParticlesAtStage, revealNextCard]);

  const handleReset = () => {
    setPhase("idle"); setCurrentCard(null); setMultiCards([]);
    setMultiFlipped([]); setMultiAura([]); setMultiImpact([]);
    setPendingCutsceneIdx(null);
    revealQueueRef.current = []; revealPausedRef.current = false; setFlipped(false);
  };

  const sortedCollection = Object.values(collection).sort((a, b) => {
    const order: Rarity[] = ["mythical", "legendary", "epic", "rare", "uncommon", "common"];
    return order.indexOf(a.rarity) - order.indexOf(b.rarity);
  });

  const colTotalOwned = sortedCollection.length;
  const colTotalPossible = CARD_DATABASE.length;
  const colProgressPct = colTotalPossible > 0 ? Math.round((colTotalOwned / colTotalPossible) * 100) : 0;
  const colFilteredCards = colFilter === "all" ? sortedCollection : sortedCollection.filter(c => c.rarity === colFilter);

  if (view === "lobby") {
    return <GameLobby collectionState={collection} onGoToGacha={() => setView("gacha")} />;
  }

  return (
    <div style={{
      minHeight: "100dvh",
      width: "100%",
      maxWidth: "100%",
      margin: 0,
      background: "#050308",
      fontFamily: "Cinzel, serif",
      color: "#e8d5a3",
      position: "relative",
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0a0612; }
        ::-webkit-scrollbar-thumb { background: #3a2060; border-radius: 2px; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes singleReveal { 0%{opacity:0;transform:translateY(30px)}100%{opacity:1;transform:translateY(0)} }
        @keyframes cardImpact { 0%{transform:translateY(-40px) scale(1.08);opacity:0} 40%{transform:translateY(6px) scale(1.03);opacity:1} 60%{transform:translateY(-3px) scale(0.99)} 80%{transform:translateY(2px) scale(1.01)} 100%{transform:translateY(0) scale(1);opacity:1} }
        @keyframes cardAuraPulse { 0%,100%{filter:drop-shadow(0 0 8px var(--aura-c)) drop-shadow(0 0 16px var(--aura-g));opacity:1} 50%{filter:drop-shadow(0 0 16px var(--aura-c)) drop-shadow(0 0 32px var(--aura-g));opacity:0.92} }
        @keyframes cardShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-3px) rotate(-1deg)} 40%{transform:translateX(3px) rotate(1deg)} 60%{transform:translateX(-2px)} 80%{transform:translateX(2px)} }
      `}</style>

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", backgroundImage: Array.from({ length: 30 }, (_, i) => `radial-gradient(${i % 3 === 0 ? 1.5 : 1}px ${i % 3 === 0 ? 1.5 : 1}px at ${(i * 37 + 5) % 100}% ${(i * 53 + 8) % 100}%, rgba(255,255,255,${0.3 + (i % 4) * 0.15}) 0%, transparent 100%)`).join(",") }} />

      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 200 }}>
        {particles.map(p => (
          <div key={p.id} style={{ position: "absolute", left: p.x - p.size / 2, top: p.y - p.size / 2, width: p.size, height: p.size, borderRadius: "50%", background: p.color, opacity: p.life, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }} />
        ))}
      </div>

      {/* ── cutscene: เช็คแค่ cutscene_reveal ── */}
      {currentCard && phase === "cutscene_reveal" && (
        currentCard.rarity === "mythical" ? (
          <MythicalCutscene card={currentCard} phase={phase} onComplete={handleCutsceneDone} onBoom={handleBoom} />
        ) : (
          <LegendaryCutscene card={currentCard} phase={phase} onComplete={handleCutsceneDone} />
        )
      )}

      {selectedCard && <CollectionModal card={selectedCard} onClose={() => setSelectedCard(null)} />}

      <div style={{ textAlign: "center", padding: "28px 16px 16px" }}>
        <div style={{ fontFamily: "Cinzel Decorative, serif", fontSize: "clamp(18px, 5vw, 28px)", color: "#FFB800", letterSpacing: 4, textShadow: "0 0 30px rgba(255,184,0,0.4)", animation: "float 4s ease-in-out infinite" }}>
          ✦ ALL DOWN TCG ✦
        </div>
        <div style={{ fontSize: 9, color: "#4a3a1a", letterSpacing: 3, marginTop: 4, textTransform: "uppercase" }}>Fates are written in cards</div>
        <button onClick={() => setView("lobby")} style={{ marginTop: 8, background: "transparent", border: "0.5px solid #2a1a06", color: "#4a3a1a", padding: "4px 14px", borderRadius: 4, fontFamily: "Cinzel, serif", fontSize: 8, letterSpacing: 2, cursor: "pointer" }}>
          ← Lobby
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", padding: "0 12px 16px", overflowX: "auto" }}>
        {RARITY_ORDER.map(r => {
          const cfg = RARITY_CONFIG[r];
          return (
            <div key={r} style={{ padding: "3px 10px", borderRadius: 20, fontSize: 9, letterSpacing: 1, border: `1px solid ${cfg.border}88`, color: cfg.textColor, background: `${cfg.color}10`, flexShrink: 0 }}>
              {starsString(cfg.stars)} {cfg.label} {cfg.rate}
            </div>
          );
        })}
      </div>

      {tab === "pull" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px" }}>

          <div ref={stageRef} style={{ minHeight: "clamp(200px, 50vw, 260px)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, width: "100%", position: "relative", overflowX: "hidden" }}>

            {(phase === "idle" || phase === "card_flip" || phase === "card_shown") && !multiCards.length && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", perspective: 1200, animation: phase === "card_shown" ? "singleReveal 0.5s ease-out" : "none" }}>
                <div style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative", width: "clamp(120px, 32vw, 160px)", height: "clamp(168px, 45vw, 224px)" }}>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}><CardBack size="medium" /></div>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    {currentCard && <Card card={currentCard} size="medium" glowing={phase === "card_shown"} />}
                  </div>
                </div>
              </div>
            )}

            {multiCards.length > 0 && (phase === "multi_result" || phase === "cutscene_reveal" || phase === "cutscene_title") && (
              <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: "clamp(4px, 2vw, 10px)",
                  width: "100%",
                  maxWidth: 460,
                  padding: "0 4px",
                }}>
                  {multiCards.map((c, i) => {
                    const cfg = RARITY_CONFIG[c.rarity];
                    const isOpen = multiFlipped[i];
                    const isAura = multiAura[i];
                    const isImpact = multiImpact[i];
                    const anyImpact = multiImpact.some(Boolean);
                    const isCutsceneable = c.rarity === "legendary" || c.rarity === "mythical";

                    return (
                      <div
                        key={i}
                        onClick={() => {
                          if (isOpen) return;
                          const newFlipped = [...multiFlipped]; newFlipped[i] = true; setMultiFlipped(newFlipped);
                          spawnParticlesAtStage(cfg.particleColors, isCutsceneable ? 40 : 10);
                          if (isCutsceneable) {
                            setTimeout(() => {
                              setPendingCutsceneIdx(i); setCurrentCard(c);
                              // ── แก้: set reveal ตรง ──
                              setPhase("cutscene_reveal");
                            }, 600);
                          }
                        }}
                        style={{
                          width: "100%",
                          aspectRatio: "88/124",
                          cursor: "pointer",
                          position: "relative",
                          perspective: 700,
                          flexShrink: 0,
                          animation: isImpact ? "cardImpact 0.6s cubic-bezier(0.22,1,0.36,1) forwards" : (anyImpact && !isImpact && isOpen) ? "cardShake 0.4s ease-in-out" : undefined,
                        }}
                      >
                        <div style={{ width: "100%", height: "100%", transformStyle: "preserve-3d", transform: isOpen ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)", position: "relative" }}>
                          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", overflow: "hidden", borderRadius: 8 }}>
                            <CardBack size="small" />
                            <div style={{ position: "absolute", bottom: 4, right: 4, fontSize: 7, color: "#4a3060", fontFamily: "Cinzel, serif" }}>{i + 1}</div>
                          </div>
                          <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                            <div style={{
                              width: "100%", height: "100%",
                              "--aura-c": cfg.color, "--aura-g": cfg.glow,
                              filter: isAura ? `drop-shadow(0 0 10px ${cfg.color}) drop-shadow(0 0 20px ${cfg.glow})` : undefined,
                              animation: isAura ? "cardAuraPulse 2s ease-in-out infinite" : undefined,
                              opacity: isOpen ? 1 : 0,
                              transition: "opacity 0s 0.55s",
                            } as React.CSSProperties}>
                              <Card card={c} size="small" />
                            </div>
                            {isAura && (
                              <div style={{ position: "absolute", top: -6, left: "50%", transform: "translateX(-50%)", background: cfg.color, color: "#000", fontSize: 6, fontWeight: 700, padding: "2px 6px", borderRadius: 3, fontFamily: "Cinzel, serif", letterSpacing: 1, whiteSpace: "nowrap", boxShadow: `0 0 8px ${cfg.glow}` }}>
                                {cfg.label}!
                              </div>
                            )}
                          </div>
                        </div>
                        {!isOpen && (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, pointerEvents: "none" }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(128,96,200,0.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#8060c0", fontFamily: "Cinzel, serif" }}>?</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  {multiFlipped.some(f => !f) && (
                    <button onClick={() => { const unopened = multiCards.map((_, i) => i).filter(i => !multiFlipped[i]); if (unopened.length === 0) return; revealQueueRef.current = unopened; revealPausedRef.current = false; revealNextCard(); }} style={{ background: "rgba(255,184,0,0.08)", border: "1.5px solid #FFB800", color: "#FFE566", padding: "8px 20px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}>
                      Reveal All ✦
                    </button>
                  )}
                </div>
              </div>
            )}

            {phase === "card_flip" && currentCard && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", perspective: 1200 }}>
                <div style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1)", width: "clamp(120px, 32vw, 160px)", height: "clamp(168px, 45vw, 224px)", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}><CardBack /></div>
                  <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}><Card card={currentCard} size="medium" /></div>
                </div>
              </div>
            )}
          </div>

          {phase === "card_shown" && currentCard && (
            <div style={{ textAlign: "center", marginBottom: 16, animation: "singleReveal 0.4s ease-out 0.2s both" }}>
              <div style={{ color: RARITY_CONFIG[currentCard.rarity].textColor, fontSize: 14, fontWeight: 700, letterSpacing: 2 }}>{currentCard.name}</div>
              <div style={{ color: "#5a4a25", fontSize: 10, letterSpacing: 2, marginTop: 4 }}>{currentCard.title}</div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
            {(phase === "card_shown" || phase === "multi_result") && (
              <button onClick={handleReset} style={{ background: "transparent", border: "0.5px solid #3a2a15", color: "#5a4a25", padding: "10px 20px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase" }}>↩ Reset</button>
            )}
            <button onClick={doSinglePull} disabled={isAnimating} style={{ background: "transparent", border: `1.5px solid ${isAnimating ? "#2a1a0a" : "#8a7a55"}`, color: isAnimating ? "#2a1a0a" : "#e8d5a3", padding: "10px 24px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 11, letterSpacing: 2, cursor: isAnimating ? "not-allowed" : "pointer", textTransform: "uppercase", transition: "all 0.2s" }}>Pull ×1</button>
            <button onClick={doMultiPull} disabled={isAnimating} style={{ background: isAnimating ? "transparent" : "rgba(255,184,0,0.06)", border: `1.5px solid ${isAnimating ? "#2a1a0a" : "#FFB800"}`, color: isAnimating ? "#2a1a0a" : "#FFE566", padding: "10px 24px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 11, letterSpacing: 2, cursor: isAnimating ? "not-allowed" : "pointer", textTransform: "uppercase", transition: "all 0.2s", boxShadow: isAnimating ? "none" : "0 0 20px rgba(255,184,0,0.1)" }}>Pull ×10</button>
          </div>
          <div style={{ fontSize: 9, color: "#2a1a0a", letterSpacing: 2, marginBottom: 20 }}>Total pulls: {totalPulls}</div>
          <ImageUploadHelper />
        </div>
      )}

      {tab === "collection" && (
        <div style={{ padding: "0 12px 40px" }}>
          <div style={{ background: "linear-gradient(135deg, #1a1000 0%, #0d0800 100%)", border: "1px solid #3a2a0a", borderRadius: 12, padding: "14px 16px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 8, right: 12, fontSize: 28, opacity: 0.06, pointerEvents: "none", fontFamily: "Cinzel, serif", color: "#FFB800" }}>✦</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 9, color: "#4a3a1a", letterSpacing: 3, textTransform: "uppercase" }}>Inventory</div>
                <div style={{ fontSize: 18, color: "#FFB800", fontFamily: "Cinzel, serif", letterSpacing: 1, marginTop: 2 }}>
                  {colTotalOwned} <span style={{ fontSize: 10, color: "#5a4a25" }}>/ {colTotalPossible} cards</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: "#4a3a1a", letterSpacing: 2, textTransform: "uppercase" }}>Completion</div>
                <div style={{ fontSize: 20, color: "#FFE566", fontFamily: "Cinzel, serif" }}>{colProgressPct}%</div>
              </div>
            </div>
            <div style={{ height: 4, background: "#1a1200", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${colProgressPct}%`, background: "linear-gradient(90deg, #FFB800, #FFE566)", borderRadius: 2, boxShadow: "0 0 8px rgba(255,184,0,0.5)", transition: "width 0.6s ease" }} />
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {RARITY_ORDER.map(r => {
                const cnt = sortedCollection.filter(c => c.rarity === r).length;
                if (!cnt) return null;
                const cfg = RARITY_CONFIG[r];
                return <div key={r} style={{ fontSize: 8, padding: "2px 7px", borderRadius: 20, background: `${cfg.color}14`, border: `1px solid ${cfg.border}44`, color: cfg.color, letterSpacing: 1 }}>{cfg.label[0]}{cfg.label.slice(1).toLowerCase()} ×{cnt}</div>;
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
            {(["all", ...RARITY_ORDER] as const).map(r => {
              const cfg = r !== "all" ? RARITY_CONFIG[r] : null;
              const active = colFilter === r;
              return (
                <button key={r} onClick={() => setColFilter(r)} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 20, border: active ? `1.5px solid ${cfg ? cfg.border : "#FFB800"}` : "1px solid #2a1a0a", background: active ? (cfg ? `${cfg.color}18` : "rgba(255,184,0,0.1)") : "transparent", color: active ? (cfg ? cfg.color : "#FFB800") : "#3a2a1a", fontSize: 9, letterSpacing: 2, fontFamily: "Cinzel, serif", textTransform: "uppercase", cursor: "pointer", transition: "all 0.15s" }}>
                  {r === "all" ? "All" : cfg!.label}
                </button>
              );
            })}
          </div>

          {colFilteredCards.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "#2a1a0a", fontSize: 10, letterSpacing: 3, fontFamily: "Cinzel, serif", textTransform: "uppercase" }}>
              {sortedCollection.length === 0 ? "— No cards yet. Start pulling! —" : "— No cards in this tier —"}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 10 }}>
              {colFilteredCards.map(c => {
                const cfg = RARITY_CONFIG[c.rarity];
                return <CollectionCard key={c.id} card={c} cfg={cfg} onOpen={() => { setSelectedCard(c); setCollection(prev => ({ ...prev, [c.id]: { ...prev[c.id], isNew: false } })); }} />;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}