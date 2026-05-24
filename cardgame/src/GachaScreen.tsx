/**
 * GachaScreen.tsx
 * Drop-in replacement / overlay for the gacha pull UI in CardGachaApp.
 *
 * Props accepted:
 *   collection          – Record<string, OwnedCard>  (from parent)
 *   onPull              – (bannerKey: BannerKey, count: 1|10) => CardDefinition[]
 *   normalTrashCube     – number
 *   goldTrashCube       – number
 *   onCurrencyChange    – (normal: number, gold: number) => void
 *   onBack              – () => void
 *
 * The file is self-contained so it can be wired up or previewed standalone.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { CARD_DATABASE, RARITY_CONFIG, CardDefinition, Rarity } from "./App";

// ─── BANNER DEFINITIONS ──────────────────────────────────────────────────────

export type BannerKey = "emperor_warid" | "emperor_euro" | "hacker" | "standard";

interface BannerDef {
  key: BannerKey;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  accentColor: string;
  glowColor: string;
  bgGradient: string;
  overlayGradient: string;
  featuredCardId: string;
  /** Pool = ids eligible for rate-up. null = standard pool */
  rateUpIds: string[] | null;
  /** true = uses goldTrashCube, false = uses normalTrashCube */
  usesGoldCube: boolean;
  expiry?: string;
  isLimited: boolean;
  /** guarantee pity */
  softPity: number;
  hardPity: number;
  /** label shown on thumbnail */
  thumbnailLabel: string;
  thumbnailSub?: string;
}

const BANNERS: BannerDef[] = [
  {
    key: "emperor_warid",
    title: "The Former Emperor",
    subtitle: "Warid",
    tag: "FEATURED",
    tagColor: "#FF4D4D",
    accentColor: "#FF4D4D",
    glowColor: "rgba(255,60,60,0.55)",
    bgGradient: "radial-gradient(ellipse at 30% 60%, #3a0000 0%, #1a0000 40%, #050000 100%)",
    overlayGradient: "linear-gradient(105deg, rgba(80,0,0,0.7) 0%, transparent 55%)",
    featuredCardId: "m_warid_emperor",
    rateUpIds: ["m_warid_emperor"],
    usesGoldCube: true,
    expiry: "2569.06.15 10:00",
    isLimited: true,
    softPity: 65,
    hardPity: 80,
    thumbnailLabel: "Warid",
    thumbnailSub: "Former Emperor",
  },
  {
    key: "emperor_euro",
    title: "The Reigning Emperor",
    subtitle: "Euro",
    tag: "FEATURED",
    tagColor: "#00C864",
    accentColor: "#00C864",
    glowColor: "rgba(0,200,100,0.45)",
    bgGradient: "radial-gradient(ellipse at 70% 50%, #001a08 0%, #000c04 50%, #000200 100%)",
    overlayGradient: "linear-gradient(105deg, rgba(0,40,10,0.7) 0%, transparent 55%)",
    featuredCardId: "l_euro_emperor",
    rateUpIds: ["l_euro_emperor"],
    usesGoldCube: true,
    expiry: "2569.06.15 10:00",
    isLimited: true,
    softPity: 65,
    hardPity: 80,
    thumbnailLabel: "Euro",
    thumbnailSub: "Reigning Emperor",
  },
  {
    key: "hacker",
    title: "The Godlike Hacker",
    subtitle: "Warid",
    tag: "EVENT",
    tagColor: "#1E90FF",
    accentColor: "#1E90FF",
    glowColor: "rgba(30,144,255,0.45)",
    bgGradient: "radial-gradient(ellipse at 50% 40%, #001a3a 0%, #000a1a 40%, #000205 100%)",
    overlayGradient: "linear-gradient(105deg, rgba(0,20,60,0.75) 0%, transparent 55%)",
    featuredCardId: "l_warid_hacker",
    rateUpIds: ["l_warid_hacker"],
    usesGoldCube: true,
    expiry: "2569.06.15 10:00",
    isLimited: true,
    softPity: 65,
    hardPity: 80,
    thumbnailLabel: "Hacker",
    thumbnailSub: "Warid",
  },
  {
    key: "standard",
    title: "Standard Extraction",
    subtitle: "Arcane Archives",
    tag: "PERMANENT",
    tagColor: "#FFB800",
    accentColor: "#FFB800",
    glowColor: "rgba(255,184,0,0.35)",
    bgGradient: "radial-gradient(ellipse at 50% 60%, #1a1000 0%, #0d0800 50%, #030200 100%)",
    overlayGradient: "linear-gradient(105deg, rgba(40,28,0,0.65) 0%, transparent 55%)",
    featuredCardId: "r_pek",
    rateUpIds: null,
    usesGoldCube: false,
    isLimited: false,
    softPity: 70,
    hardPity: 90,
    thumbnailLabel: "Standard",
    thumbnailSub: "Permanent",
  },
];

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface OwnedCard extends CardDefinition {
  count: number;
  isNew: boolean;
  instanceId: string;
}

interface PullResult {
  card: CardDefinition;
  isDuplicate: boolean;
  normalCubeReward: number;
  goldCubeReward: number;
}

// ─── GACHA LOGIC ─────────────────────────────────────────────────────────────

function rollFromBanner(banner: BannerDef, pity: number): CardDefinition {
  const pool = banner.rateUpIds
    ? CARD_DATABASE.filter(
        c =>
          c.rarity === "mythical" ||
          c.rarity === "legendary" ||
          banner.rateUpIds!.includes(c.id) ||
          c.rarity === "epic" ||
          c.rarity === "rare" ||
          c.rarity === "uncommon" ||
          c.rarity === "common"
      )
    : CARD_DATABASE;

  // pity bump
  const mythBoost = pity >= 75 ? 15 : pity >= 65 ? 5 : 0;
  const legBoost  = pity >= 60 ? 8 : pity >= 50 ? 3 : 0;

  const r = Math.random() * 100;
  let rarity: Rarity;
  if      (r < 0.5  + mythBoost)                   rarity = "mythical";
  else if (r < 2.0  + mythBoost + legBoost)         rarity = "legendary";
  else if (r < 9.0  + mythBoost + legBoost)         rarity = "epic";
  else if (r < 30.0 + mythBoost + legBoost)         rarity = "rare";
  else if (r < 60.0 + mythBoost + legBoost)         rarity = "uncommon";
  else                                               rarity = "common";

  // rate-up: if banner has rate-up ids and rarity matches, 50% chance for rate-up card
  if (banner.rateUpIds && (rarity === "mythical" || rarity === "legendary")) {
    const rateUpPool = CARD_DATABASE.filter(c => banner.rateUpIds!.includes(c.id) && c.rarity === rarity);
    if (rateUpPool.length > 0 && Math.random() < 0.5) {
      return rateUpPool[Math.floor(Math.random() * rateUpPool.length)];
    }
  }

  const rarityPool = pool.filter(c => c.rarity === rarity);
  const finalPool = rarityPool.length > 0 ? rarityPool : pool;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

function calcReward(rarity: Rarity, isDuplicate: boolean): { normal: number; gold: number } {
  if (!isDuplicate) return { normal: 0, gold: 0 };
  switch (rarity) {
    case "epic":      return { normal: 4 + Math.floor(Math.random() * 2), gold: 0 };
    case "legendary": return { normal: 0, gold: 15 };
    case "mythical":  return { normal: 0, gold: 30 + Math.floor(Math.random() * 16) };
    default:          return { normal: 0, gold: 0 };
  }
}

// ─── ANIMATED SHIMMER LINE ───────────────────────────────────────────────────

function ShimmerBar({ color }: { color: string }) {
  return (
    <div style={{
      position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: "inherit",
    }}>
      <div style={{
        position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
        background: `linear-gradient(90deg, transparent, ${color}22, ${color}44, transparent)`,
        animation: "shimmerSlide 2.4s ease-in-out infinite",
      }} />
    </div>
  );
}

// ─── CURRENCY BADGE ───────────────────────────────────────────────────────────

function CurrencyBadge({
  amount, isGold, label,
}: { amount: number; isGold: boolean; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      background: isGold ? "rgba(255,184,0,0.1)" : "rgba(120,120,120,0.1)",
      border: `1px solid ${isGold ? "#FFB80066" : "#88888844"}`,
      borderRadius: 20, padding: "5px 12px 5px 6px",
      backdropFilter: "blur(6px)",
      boxShadow: isGold ? "0 0 12px rgba(255,184,0,0.12)" : "none",
    }}>
      <img
        src={isGold ? "wiki image/web/GoldTrashBox.png" : "wiki image/web/TrashBox.png"}
        alt={label}
        style={{ width: 22, height: 22, objectFit: "contain",
          filter: isGold ? "drop-shadow(0 0 4px #FFB800)" : undefined }}
        onError={e => {
          const el = e.currentTarget;
          el.style.display = "none";
          const parent = el.parentElement;
          if (parent) {
            const span = document.createElement("span");
            span.textContent = isGold ? "🟡" : "⬜";
            span.style.fontSize = "16px";
            parent.insertBefore(span, el.nextSibling);
          }
        }}
      />
      <div>
        <div style={{ fontSize: 9, color: isGold ? "#FFB800" : "#888", letterSpacing: 2, lineHeight: 1, fontFamily: "Cinzel, serif" }}>{label}</div>
        <div style={{ fontSize: 14, color: isGold ? "#FFE566" : "#CCC", fontWeight: 700, fontFamily: "Cinzel, serif", lineHeight: 1.2 }}>
          {amount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

// ─── BANNER THUMBNAIL ─────────────────────────────────────────────────────────

function BannerThumb({ banner, active, onClick }: { banner: BannerDef; active: boolean; onClick: () => void }) {
  const featured = CARD_DATABASE.find(c => c.id === banner.featuredCardId);
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0, position: "relative", width: 72, height: 56,
        borderRadius: 8, overflow: "hidden", cursor: "pointer",
        border: active ? `2px solid ${banner.accentColor}` : "1.5px solid rgba(255,255,255,0.1)",
        boxShadow: active ? `0 0 12px ${banner.glowColor}` : "none",
        transition: "all 0.2s ease",
        background: banner.bgGradient,
        outline: "none", padding: 0,
      }}
    >
      {featured?.image && (
        <img
          src={featured.image} alt={banner.thumbnailLabel}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.6 }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <div style={{ position: "absolute", inset: 0, background: banner.overlayGradient }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "3px 5px",
        background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
        <div style={{ fontSize: 8, color: banner.tagColor, letterSpacing: 1, fontFamily: "Cinzel, serif", lineHeight: 1 }}>
          {banner.tag}
        </div>
        <div style={{ fontSize: 9, color: "#fff", fontFamily: "Cinzel, serif", fontWeight: 700, lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {banner.thumbnailLabel}
        </div>
      </div>
      {active && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: banner.accentColor,
          boxShadow: `0 0 6px ${banner.accentColor}` }} />
      )}
    </button>
  );
}

// ─── RESULT PANEL ─────────────────────────────────────────────────────────────

function PullResultOverlay({
  results, onClose,
}: { results: PullResult[]; onClose: () => void }) {
  const [revealed, setRevealed] = useState<boolean[]>(new Array(results.length).fill(false));
  const [animIn, setAnimIn] = useState(false);

  useEffect(() => {
    setAnimIn(false);
    const t = setTimeout(() => setAnimIn(true), 50);
    if (results.length === 1) {
      const t2 = setTimeout(() => setRevealed([true]), 400);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
    return () => clearTimeout(t);
  }, [results]);

  const revealAll = () => setRevealed(new Array(results.length).fill(true));

  const totalNormal = results.reduce((s, r) => s + r.normalCubeReward, 0);
  const totalGold   = results.reduce((s, r) => s + r.goldCubeReward, 0);

  return (
    <div
      onClick={results.length === 1 ? () => setRevealed([true]) : undefined}
      style={{
        position: "fixed", inset: 0, zIndex: 900,
        background: "rgba(0,0,0,0.92)", backdropFilter: "blur(16px)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        padding: 16,
        opacity: animIn ? 1 : 0, transition: "opacity 0.3s",
      }}
    >
      <style>{`
        @keyframes cardDrop {
          0%  { opacity:0; transform:translateY(-40px) scale(0.8) rotateX(30deg); }
          70% { transform:translateY(5px) scale(1.04) rotateX(-3deg); }
          100%{ opacity:1; transform:translateY(0) scale(1) rotateX(0); }
        }
        @keyframes shimmerSlide { 0%{left:-100%} 100%{left:160%} }
        @keyframes pulseGlow    { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes floatUp      { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Single pull */}
      {results.length === 1 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ perspective: 900 }}>
            <div style={{
              width: "clamp(130px,35vw,170px)", height: "clamp(182px,49vw,238px)",
              borderRadius: 12, overflow: "hidden",
              transform: revealed[0] ? "rotateY(0)" : "rotateY(90deg)",
              transition: "transform 0.55s cubic-bezier(.4,0,.2,1)",
              boxShadow: revealed[0]
                ? `0 0 40px ${RARITY_CONFIG[results[0].card.rarity].glow}, 0 20px 60px rgba(0,0,0,0.8)`
                : "none",
            }}>
              {revealed[0] ? (
                <img
                  src={results[0].card.image} alt={results[0].card.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div style={{
                  width: "100%", height: "100%",
                  background: "linear-gradient(135deg,#1a0a3a 0%,#0d0522 50%,#1a0a3a 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 32,
                }}>🔮</div>
              )}
            </div>
          </div>

          {revealed[0] && (
            <div style={{ textAlign: "center", animation: "floatUp 0.4s ease-out both" }}>
              <div style={{ fontSize: 10, color: RARITY_CONFIG[results[0].card.rarity].color, letterSpacing: 4, fontFamily: "Cinzel, serif" }}>
                {"★".repeat(RARITY_CONFIG[results[0].card.rarity].stars)} {RARITY_CONFIG[results[0].card.rarity].label}
              </div>
              <div style={{ fontSize: "clamp(14px,4vw,20px)", color: RARITY_CONFIG[results[0].card.rarity].textColor, fontFamily: "Cinzel Decorative, serif", marginTop: 4, textShadow: `0 0 20px ${RARITY_CONFIG[results[0].card.rarity].color}` }}>
                {results[0].card.name}
              </div>
              {results[0].isDuplicate && (
                <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "5px 14px" }}>
                  <span style={{ fontSize: 11, color: "#888" }}>Duplicate</span>
                  {results[0].normalCubeReward > 0 && (
                    <span style={{ fontSize: 12, color: "#aaa", fontWeight: 700 }}>+{results[0].normalCubeReward} ⬜</span>
                  )}
                  {results[0].goldCubeReward > 0 && (
                    <span style={{ fontSize: 12, color: "#FFB800", fontWeight: 700 }}>+{results[0].goldCubeReward} 🟡</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Multi pull grid */}
      {results.length > 1 && (
        <div style={{ width: "100%", maxWidth: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
            gap: "clamp(4px,1.5vw,8px)", width: "100%",
          }}>
            {results.map((res, i) => {
              const cfg = RARITY_CONFIG[res.card.rarity];
              const isOpen = revealed[i];
              return (
                <div
                  key={i}
                  onClick={() => { const n = [...revealed]; n[i] = true; setRevealed(n); }}
                  style={{
                    position: "relative", cursor: isOpen ? "default" : "pointer",
                    borderRadius: 8, overflow: "hidden",
                    aspectRatio: "2/3",
                    animation: isOpen ? `cardDrop 0.5s cubic-bezier(.34,1.56,.64,1) ${i * 60}ms both` : "none",
                    border: isOpen ? `1.5px solid ${cfg.border}88` : "1.5px solid rgba(128,96,200,0.4)",
                    boxShadow: isOpen ? `0 0 12px ${cfg.glowSoft}` : "none",
                    transition: "border 0.2s, box-shadow 0.2s",
                  }}
                >
                  {isOpen ? (
                    <>
                      <img
                        src={res.card.image} alt={res.card.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.85))", padding: "6px 4px 4px" }}>
                        <div style={{ fontSize: 7, color: cfg.color, textAlign: "center", fontFamily: "Cinzel, serif", letterSpacing: 1 }}>{"★".repeat(cfg.stars)}</div>
                      </div>
                      {res.isDuplicate && (
                        <div style={{ position: "absolute", top: 4, left: 0, right: 0, textAlign: "center" }}>
                          <span style={{ background: "rgba(0,0,0,0.75)", fontSize: 7, color: "#aaa", padding: "1px 5px", borderRadius: 4, fontFamily: "Cinzel, serif" }}>DUP</span>
                        </div>
                      )}
                      {(res.normalCubeReward > 0 || res.goldCubeReward > 0) && (
                        <div style={{ position: "absolute", top: 16, left: 0, right: 0, textAlign: "center" }}>
                          <span style={{ background: "rgba(0,0,0,0.8)", fontSize: 7, color: res.goldCubeReward > 0 ? "#FFB800" : "#aaa", padding: "1px 5px", borderRadius: 4, fontFamily: "Cinzel, serif" }}>
                            +{res.goldCubeReward > 0 ? res.goldCubeReward + "🟡" : res.normalCubeReward + "⬜"}
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#1a0a3a 0%,#0d0522 50%,#1a0a3a 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔮</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* totals */}
          {(totalNormal > 0 || totalGold > 0) && revealed.some(Boolean) && (
            <div style={{ display: "flex", gap: 10, animation: "floatUp 0.4s ease-out both" }}>
              {totalNormal > 0 && <div style={{ fontSize: 11, color: "#aaa", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "4px 12px" }}>+{totalNormal} ⬜ ขยะอัดก้อน</div>}
              {totalGold > 0   && <div style={{ fontSize: 11, color: "#FFB800", background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,184,0,0.25)", borderRadius: 20, padding: "4px 12px" }}>+{totalGold} 🟡 ขยะทองคำ</div>}
            </div>
          )}
        </div>
      )}

      {/* actions */}
      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        {results.length > 1 && revealed.some(v => !v) && (
          <button
            onClick={revealAll}
            style={{ background: "rgba(255,184,0,0.08)", border: "1.5px solid #FFB800", color: "#FFE566", padding: "10px 22px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2, cursor: "pointer" }}
          >
            Reveal All ✦
          </button>
        )}
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "#888", padding: "10px 22px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2, cursor: "pointer" }}
        >
          ↩ Back
        </button>
      </div>
    </div>
  );
}

// ─── EXCHANGE PANEL ───────────────────────────────────────────────────────────

function ExchangePanel({
  normalCube, goldCube, onExchange, onClose,
}: {
  normalCube: number; goldCube: number;
  onExchange: (normalSpent: number, goldSpent: number, normalGained: number, goldGained: number) => void;
  onClose: () => void;
}) {
  const normalPacks = Math.floor(normalCube / 30);
  const goldPacks   = Math.floor(goldCube / 30);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 360, background: "linear-gradient(135deg,#0d0800 0%,#070510 100%)", border: "1px solid rgba(255,184,0,0.2)", borderRadius: 16, padding: 24 }}
      >
        <div style={{ fontFamily: "Cinzel Decorative, serif", fontSize: 14, color: "#FFB800", letterSpacing: 2, marginBottom: 6 }}>EXCHANGE</div>
        <div style={{ fontSize: 10, color: "#5a4a2a", letterSpacing: 2, marginBottom: 20 }}>30 Tickets → 1 Trash Cube</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Normal */}
          <div style={{ background: "rgba(120,120,120,0.07)", border: "1px solid rgba(120,120,120,0.2)", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#aaa", fontFamily: "Cinzel, serif" }}>⬜ ขยะอัดก้อนธรรมดา</div>
                <div style={{ fontSize: 9, color: "#666", marginTop: 2 }}>Standard Banner</div>
              </div>
              <div style={{ fontSize: 11, color: "#ccc", fontFamily: "Cinzel, serif" }}>×{normalCube}</div>
            </div>
            <button
              onClick={() => onExchange(30, 0, 1, 0)}
              disabled={normalPacks === 0}
              style={{ width: "100%", background: normalPacks > 0 ? "rgba(150,150,150,0.15)" : "transparent", border: `1px solid ${normalPacks > 0 ? "#888" : "#333"}`, color: normalPacks > 0 ? "#ccc" : "#444", padding: "8px", borderRadius: 6, fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2, cursor: normalPacks > 0 ? "pointer" : "not-allowed" }}
            >
              {normalPacks > 0 ? `Exchange 30 → 1 cube (×${normalPacks} available)` : "Not enough tickets (need 30)"}
            </button>
          </div>

          {/* Gold */}
          <div style={{ background: "rgba(255,184,0,0.05)", border: "1px solid rgba(255,184,0,0.2)", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: "#FFB800", fontFamily: "Cinzel, serif" }}>🟡 ขยะอัดก้อนทองคำ</div>
                <div style={{ fontSize: 9, color: "#5a4a1a", marginTop: 2 }}>Rate-up Banners</div>
              </div>
              <div style={{ fontSize: 11, color: "#FFE566", fontFamily: "Cinzel, serif" }}>×{goldCube}</div>
            </div>
            <button
              onClick={() => onExchange(0, 30, 0, 1)}
              disabled={goldPacks === 0}
              style={{ width: "100%", background: goldPacks > 0 ? "rgba(255,184,0,0.12)" : "transparent", border: `1px solid ${goldPacks > 0 ? "#FFB800" : "#333"}`, color: goldPacks > 0 ? "#FFE566" : "#444", padding: "8px", borderRadius: 6, fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2, cursor: goldPacks > 0 ? "pointer" : "not-allowed" }}
            >
              {goldPacks > 0 ? `Exchange 30 → 1 gold cube (×${goldPacks} available)` : "Not enough tickets (need 30)"}
            </button>
          </div>
        </div>

        <button onClick={onClose} style={{ marginTop: 16, width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#555", padding: 10, borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2, cursor: "pointer" }}>CLOSE</button>
      </div>
    </div>
  );
}

// ─── PROBABILITIES POPUP ──────────────────────────────────────────────────────

function ProbPanel({ banner, onClose }: { banner: BannerDef; onClose: () => void }) {
  const rows: [string, string, string][] = [
    ["MYTHICAL",  "0.5%",  "Pity boost at 65+"],
    ["LEGENDARY", "1.5%",  "50% chance rate-up"],
    ["EPIC",      "7%",    "—"],
    ["RARE",      "21%",   "—"],
    ["UNCOMMON",  "30%",   "—"],
    ["COMMON",    "40%",   "—"],
  ];
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 800, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 340, background: "linear-gradient(135deg,#0d0800,#070510)", border: `1px solid ${banner.accentColor}44`, borderRadius: 14, padding: 24 }}>
        <div style={{ fontFamily: "Cinzel Decorative, serif", fontSize: 13, color: banner.accentColor, letterSpacing: 2, marginBottom: 4 }}>PROBABILITIES</div>
        <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, marginBottom: 16 }}>{banner.title} · {banner.subtitle}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {rows.map(([label, rate, note]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
              <div style={{ width: 70, fontSize: 9, color: RARITY_CONFIG[label.toLowerCase() as Rarity]?.color ?? "#888", fontFamily: "Cinzel, serif", letterSpacing: 1 }}>{label}</div>
              <div style={{ width: 36, fontSize: 11, color: "#fff", fontWeight: 700, fontFamily: "Cinzel, serif" }}>{rate}</div>
              <div style={{ flex: 1, fontSize: 8, color: "#555" }}>{note}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: "8px 10px", background: `${banner.accentColor}0a`, border: `1px solid ${banner.accentColor}33`, borderRadius: 6 }}>
          <div style={{ fontSize: 9, color: banner.accentColor, letterSpacing: 1 }}>Pity: guaranteed 5★+ within {banner.hardPity} pulls</div>
        </div>
        <button onClick={onClose} style={{ marginTop: 14, width: "100%", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#555", padding: 9, borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 10, letterSpacing: 2, cursor: "pointer" }}>CLOSE</button>
      </div>
    </div>
  );
}

// ─── MAIN GACHA SCREEN ────────────────────────────────────────────────────────

interface GachaScreenProps {
  collection: Record<string, OwnedCard>;
  normalTrashCube: number;
  goldTrashCube: number;
  onCurrencyChange: (normal: number, gold: number) => void;
  onAddToCollection: (cards: CardDefinition[]) => void;
  onBack: () => void;
}

export default function GachaScreen({
  collection, normalTrashCube, goldTrashCube,
  onCurrencyChange, onAddToCollection, onBack,
}: GachaScreenProps) {

  const [activeBanner, setActiveBanner] = useState<BannerKey>("emperor_warid");
  const [pity, setPity] = useState<Record<BannerKey, number>>({ emperor_warid: 0, emperor_euro: 0, hacker: 0, standard: 0 });
  const [results, setResults] = useState<PullResult[] | null>(null);
  const [showProb, setShowProb] = useState(false);
  const [showExchange, setShowExchange] = useState(false);
  const [normalCube, setNormalCube] = useState(normalTrashCube);
  const [goldCube, setGoldCube] = useState(goldTrashCube);
  const [totalPulls, setTotalPulls] = useState(0);
  const bgRef = useRef<HTMLDivElement>(null);

  const banner = BANNERS.find(b => b.key === activeBanner)!;
  const featured = CARD_DATABASE.find(c => c.id === banner.featuredCardId);
  const currentPity = pity[activeBanner];
  const canPull1  = banner.usesGoldCube ? goldCube >= 1   : normalCube >= 1;
  const canPull10 = banner.usesGoldCube ? goldCube >= 10  : normalCube >= 10;

  // parallax on bg image
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rx = (e.clientX / window.innerWidth  - 0.5) * 10;
      const ry = (e.clientY / window.innerHeight - 0.5) * 8;
      el.style.transform = `translate(${rx}px,${ry}px) scale(1.06)`;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const doPull = useCallback((count: 1 | 10) => {
    if (count === 1  && !canPull1)  return;
    if (count === 10 && !canPull10) return;

    const drawn: PullResult[] = [];
    let newPity = currentPity;
    let normDelta = 0, goldDelta = 0;

    for (let i = 0; i < count; i++) {
      newPity++;
      const card = rollFromBanner(banner, newPity);
      const isDuplicate = !!collection[card.id];
      const reward = calcReward(card.rarity, isDuplicate);
      normDelta += reward.normal;
      goldDelta += reward.gold;
      drawn.push({ card, isDuplicate, normalCubeReward: reward.normal, goldCubeReward: reward.gold });

      // reset pity on 5★+
      if (card.rarity === "mythical" || card.rarity === "legendary") newPity = 0;
    }

    // deduct currency
    const newNorm = banner.usesGoldCube ? normalCube : normalCube - count;
    const newGold = banner.usesGoldCube ? goldCube - count : goldCube;
    const finalNorm = Math.max(0, newNorm) + normDelta;
    const finalGold = Math.max(0, newGold) + goldDelta;

    setNormalCube(finalNorm);
    setGoldCube(finalGold);
    onCurrencyChange(finalNorm, finalGold);
    setPity(prev => ({ ...prev, [activeBanner]: newPity }));
    setTotalPulls(p => p + count);
    onAddToCollection(drawn.map(r => r.card));
    setResults(drawn);
  }, [activeBanner, banner, canPull1, canPull10, collection, currentPity, goldCube, normalCube, onAddToCollection, onCurrencyChange]);

  const handleExchange = (normalSpent: number, goldSpent: number, normGain: number, goldGain: number) => {
    const newNorm = Math.max(0, normalCube - normalSpent) + normGain;
    const newGold = Math.max(0, goldCube  - goldSpent)  + goldGain;
    setNormalCube(newNorm);
    setGoldCube(newGold);
    onCurrencyChange(newNorm, newGold);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      fontFamily: "Cinzel, serif",
      background: "#030208",
      overflowY: "auto", overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700&family=Cinzel:wght@400;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #050308; }
        ::-webkit-scrollbar-thumb { background: #3a2060; border-radius: 2px; }
        @keyframes shimmerSlide { 0%{left:-100%} 100%{left:160%} }
        @keyframes bgPulse { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pityBar { from{width:0%} to{width:var(--pity-w)} }
        @keyframes scanLine { 0%{top:-2%} 100%{top:102%} }
      `}</style>

      {/* ── BG ART ── */}
      <div style={{ position: "fixed", inset: "-3%", zIndex: 0, overflow: "hidden" }}>
        <div
          ref={bgRef}
          style={{ position: "absolute", inset: 0, transition: "transform 0.1s ease-out",
            background: banner.bgGradient }}
        >
          {featured?.image && (
            <img
              src={featured.image} alt=""
              style={{ position: "absolute", right: "-5%", bottom: 0, height: "95%", width: "65%", objectFit: "cover",
                objectPosition: "top", opacity: 0.18, filter: `blur(1px) drop-shadow(0 0 60px ${banner.accentColor})` }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>
        {/* scan line */}
        <div style={{ position: "absolute", left: 0, right: 0, height: 1.5,
          background: `linear-gradient(90deg, transparent, ${banner.accentColor}66, transparent)`,
          animation: "scanLine 4s linear infinite", zIndex: 1, opacity: 0.4 }} />
        {/* vignette */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, transparent 20%, rgba(0,0,0,0.75) 100%)", zIndex: 2 }} />
        <div style={{ position: "absolute", inset: 0, background: banner.overlayGradient, zIndex: 3 }} />
      </div>

      {/* ── HEADER ROW ── */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px 8px" }}>
        <button
          onClick={onBack}
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.12)", color: "#888", padding: "7px 14px", borderRadius: 20, fontFamily: "Cinzel, serif", fontSize: 9, letterSpacing: 2, cursor: "pointer", backdropFilter: "blur(8px)" }}
        >
          ← Back
        </button>

        {/* Currency strip */}
        <div style={{ display: "flex", gap: 8 }}>
          <CurrencyBadge amount={normalCube} isGold={false} label="NORMAL" />
          <CurrencyBadge amount={goldCube}   isGold={true}  label="GOLD" />
          <button
            onClick={() => setShowExchange(true)}
            style={{ background: "rgba(255,184,0,0.08)", border: "1px solid rgba(255,184,0,0.25)", color: "#FFB800", padding: "5px 10px", borderRadius: 20, fontFamily: "Cinzel, serif", fontSize: 8, letterSpacing: 2, cursor: "pointer", backdropFilter: "blur(8px)", whiteSpace: "nowrap" }}
          >
            EXCHANGE
          </button>
        </div>
      </div>

      {/* ── BANNER TABS ── */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", gap: 8, padding: "0 16px 12px", overflowX: "auto", scrollbarWidth: "none" }}>
        {BANNERS.map(b => (
          <BannerThumb key={b.key} banner={b} active={activeBanner === b.key} onClick={() => setActiveBanner(b.key)} />
        ))}
      </div>

      {/* ── MAIN BANNER CARD ── */}
      <div style={{ position: "relative", zIndex: 10, margin: "0 16px", borderRadius: 16, overflow: "hidden",
        border: `1px solid ${banner.accentColor}44`,
        boxShadow: `0 0 40px ${banner.glowColor}, 0 20px 60px rgba(0,0,0,0.6)`,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        animation: "fadeUp 0.35s ease-out both",
      }}>
        <ShimmerBar color={banner.accentColor} />

        {/* top accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${banner.accentColor}, transparent)` }} />

        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Banner header */}
          <div style={{ padding: "16px 18px 12px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 8, color: banner.tagColor, letterSpacing: 3, fontFamily: "Cinzel, serif",
                  background: `${banner.tagColor}18`, border: `1px solid ${banner.tagColor}55`,
                  padding: "2px 8px", borderRadius: 3 }}>{banner.tag}</span>
                {banner.isLimited && (
                  <span style={{ fontSize: 8, color: "#888", letterSpacing: 2, fontFamily: "Cinzel, serif" }}>LIMITED</span>
                )}
              </div>
              <div style={{ fontSize: "clamp(18px,5vw,26px)", color: "#fff", fontFamily: "Cinzel Decorative, serif",
                fontWeight: 700, lineHeight: 1.1, textShadow: `0 0 30px ${banner.accentColor}88` }}>
                {banner.title}
              </div>
              <div style={{ fontSize: "clamp(12px,3vw,16px)", color: banner.accentColor, fontFamily: "Cinzel, serif",
                letterSpacing: 3, marginTop: 3 }}>
                {banner.subtitle}
              </div>
            </div>

            {/* Featured card preview */}
            {featured && (
              <div style={{ position: "relative", width: "clamp(70px,20vw,100px)", flexShrink: 0 }}>
                <div style={{ aspectRatio: "2/3", borderRadius: 8, overflow: "hidden",
                  border: `1.5px solid ${banner.accentColor}55`,
                  boxShadow: `0 0 20px ${banner.glowColor}`,
                  animation: "floatY 3s ease-in-out infinite",
                }}>
                  {featured.image ? (
                    <img src={featured.image} alt={featured.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                      background: banner.bgGradient, fontSize: 24 }}>
                      {RARITY_CONFIG[featured.rarity].label[0]}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 4, textAlign: "center" }}>
                  <div style={{ fontSize: 7, color: RARITY_CONFIG[featured.rarity].color, letterSpacing: 1, fontFamily: "Cinzel, serif" }}>
                    {"★".repeat(RARITY_CONFIG[featured.rarity].stars)}
                  </div>
                  <div style={{ fontSize: 8, color: "#888", fontFamily: "Cinzel, serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {featured.name}
                  </div>
                </div>
                {/* UP! badge */}
                <div style={{ position: "absolute", top: -6, right: -6, background: banner.accentColor, color: "#000",
                  fontSize: 7, fontWeight: 700, padding: "2px 6px", borderRadius: 3, fontFamily: "Cinzel, serif",
                  boxShadow: `0 0 8px ${banner.accentColor}` }}>
                  UP!★
                </div>
              </div>
            )}
          </div>

          {/* Info row */}
          <div style={{ padding: "0 18px 12px", display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            {banner.expiry && (
              <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>
                ⏱ Expiry {banner.expiry} (KST)
              </div>
            )}
            {!banner.isLimited && (
              <div style={{ fontSize: 9, color: "#5a4a1a", letterSpacing: 1 }}>
                ∞ Permanent banner — no expiry
              </div>
            )}
          </div>

          {/* Guarantee strip */}
          <div style={{ margin: "0 18px 14px", padding: "8px 12px", background: `${banner.accentColor}0a`,
            border: `1px solid ${banner.accentColor}22`, borderRadius: 8 }}>
            <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 2 }}>
              Every 10 Pulls guarantees a 4★ or above · 5★ guaranteed within {banner.hardPity}
            </div>
            {banner.rateUpIds && (
              <div style={{ fontSize: 9, color: banner.accentColor, letterSpacing: 1 }}>
                ↑ Rate-up: featured card has 50% chance when 5★ is pulled
              </div>
            )}
          </div>

          {/* Pity bar */}
          <div style={{ margin: "0 18px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 8, color: "#4a3a1a", letterSpacing: 2 }}>PITY COUNTER</span>
              <span style={{ fontSize: 9, color: currentPity >= banner.softPity ? banner.accentColor : "#555", fontWeight: 700 }}>
                {currentPity} / {banner.hardPity}
              </span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min((currentPity / banner.hardPity) * 100, 100)}%`,
                background: currentPity >= banner.softPity
                  ? `linear-gradient(90deg, ${banner.accentColor}88, ${banner.accentColor})`
                  : `linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.3))`,
                borderRadius: 3,
                transition: "width 0.5s ease, background 0.4s",
                boxShadow: currentPity >= banner.softPity ? `0 0 6px ${banner.accentColor}` : "none",
              }} />
            </div>
          </div>

          {/* Pull buttons */}
          <div style={{ padding: "0 18px 18px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {/* Info btn */}
            <button
              onClick={() => setShowProb(true)}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#666",
                padding: "10px 12px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 9, letterSpacing: 2, cursor: "pointer" }}
            >
              ℹ Rates
            </button>

            {/* Pull ×1 */}
            <button
              onClick={() => doPull(1)}
              disabled={!canPull1}
              style={{
                flex: 1, minWidth: 100, position: "relative", overflow: "hidden",
                background: canPull1
                  ? `linear-gradient(135deg, ${banner.accentColor}22 0%, rgba(0,0,0,0.4) 100%)`
                  : "transparent",
                border: `1.5px solid ${canPull1 ? banner.accentColor : "#222"}`,
                color: canPull1 ? "#fff" : "#333",
                padding: "12px 16px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 11,
                letterSpacing: 2, cursor: canPull1 ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                boxShadow: canPull1 ? `0 0 16px ${banner.glowColor}` : "none",
              }}
            >
              {canPull1 && <ShimmerBar color={banner.accentColor} />}
              <div style={{ position: "relative", zIndex: 1 }}>
                <div>Pull ×1</div>
                <div style={{ fontSize: 9, color: canPull1 ? banner.accentColor : "#333", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <img
                    src={banner.usesGoldCube ? "wiki image/web/GoldTrashBox.png" : "wiki image/web/TrashBox.png"}
                    alt="" style={{ width: 13, height: 13, objectFit: "contain" }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  ×1
                </div>
              </div>
            </button>

            {/* Pull ×10 */}
            <button
              onClick={() => doPull(10)}
              disabled={!canPull10}
              style={{
                flex: 1, minWidth: 100, position: "relative", overflow: "hidden",
                background: canPull10
                  ? `linear-gradient(135deg, ${banner.accentColor}33 0%, rgba(0,0,0,0.4) 100%)`
                  : "transparent",
                border: `1.5px solid ${canPull10 ? banner.accentColor : "#222"}`,
                color: canPull10 ? "#fff" : "#333",
                padding: "12px 16px", borderRadius: 8, fontFamily: "Cinzel, serif", fontSize: 11,
                letterSpacing: 2, cursor: canPull10 ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                boxShadow: canPull10 ? `0 0 24px ${banner.glowColor}` : "none",
              }}
            >
              {canPull10 && <ShimmerBar color={banner.accentColor} />}
              <div style={{ position: "relative", zIndex: 1 }}>
                <div>Pull ×10</div>
                <div style={{ fontSize: 9, color: canPull10 ? banner.accentColor : "#333", marginTop: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <img
                    src={banner.usesGoldCube ? "wiki image/web/GoldTrashBox.png" : "wiki image/web/TrashBox.png"}
                    alt="" style={{ width: 13, height: 13, objectFit: "contain" }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  ×10
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS FOOTER ── */}
      <div style={{ position: "relative", zIndex: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 9, color: "#2a1a0a", letterSpacing: 3 }}>Total Pulls: {totalPulls}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["epic","legendary","mythical"] as Rarity[]).map(r => (
            <div key={r} style={{ padding: "2px 8px", borderRadius: 20, fontSize: 8, letterSpacing: 1,
              border: `1px solid ${RARITY_CONFIG[r].border}55`,
              color: RARITY_CONFIG[r].color,
              background: `${RARITY_CONFIG[r].color}0c` }}>
              {RARITY_CONFIG[r].label[0]}{RARITY_CONFIG[r].label.slice(1).toLowerCase()} {RARITY_CONFIG[r].rate}
            </div>
          ))}
        </div>
      </div>

      {/* ── OVERLAYS ── */}
      {results && (
        <PullResultOverlay results={results} onClose={() => setResults(null)} />
      )}
      {showProb && (
        <ProbPanel banner={banner} onClose={() => setShowProb(false)} />
      )}
      {showExchange && (
        <ExchangePanel
          normalCube={normalCube}
          goldCube={goldCube}
          onExchange={handleExchange}
          onClose={() => setShowExchange(false)}
        />
      )}
    </div>
  );
}
