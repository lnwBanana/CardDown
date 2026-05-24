import { useState } from "react";
import {
  CARD_DATABASE,
  RARITY_CONFIG,
  Card,
} from "./App";
import type { CardDefinition, Rarity } from "./App";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type LobbyTab = "lobby" | "wallet" | "collection" | "gacha";

interface WalletState {
  gold: number;
  gems: number;
  tickets: number;
}

interface CollectionState {
  [cardId: string]: { count: number; isNew: boolean };
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const RARITY_ORDER: Rarity[] = ["mythical", "legendary", "epic", "rare", "uncommon", "common"];

const RARITY_AURA: Record<Rarity, string> = {
  mythical:  "0 0 60px 20px rgba(255,76,76,0.6),  0 0 140px 60px rgba(255,76,76,0.2)",
  legendary: "0 0 50px 16px rgba(255,184,0,0.6),  0 0 120px 50px rgba(255,184,0,0.2)",
  epic:      "0 0 44px 14px rgba(192,64,255,0.55), 0 0 100px 40px rgba(192,64,255,0.18)",
  rare:      "0 0 36px 10px rgba(30,144,255,0.5),  0 0 80px 30px rgba(30,144,255,0.14)",
  uncommon:  "0 0 24px 8px  rgba(0,200,100,0.4),   0 0 60px 20px rgba(0,200,100,0.1)",
  common:    "0 0 16px 5px  rgba(140,140,140,0.3), 0 0 40px 14px rgba(140,140,140,0.08)",
};

// ─────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Cinzel:wght@400;600&family=Share+Tech+Mono&display=swap');

  @keyframes floatCard {
    0%,100% { transform: translateY(0px) rotate(-1deg); }
    50%      { transform: translateY(-10px) rotate(-1deg); }
  }
  @keyframes floatCardL {
    0%,100% { transform: translateY(0px) rotate(-6deg) scale(0.82); }
    50%      { transform: translateY(-7px) rotate(-6deg) scale(0.82); }
  }
  @keyframes floatCardR {
    0%,100% { transform: translateY(0px) rotate(6deg) scale(0.82); }
    50%      { transform: translateY(-13px) rotate(6deg) scale(0.82); }
  }
  @keyframes scanline {
    0%   { top: -4px; opacity: 0.6; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes cornerPulse {
    0%,100% { opacity: 0.4; }
    50%      { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(30px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes slideRight {
    from { transform: translateX(-20px); opacity: 0; }
    to   { transform: translateX(0);     opacity: 1; }
  }
  @keyframes glitchBar {
    0%   { transform: translateX(0); }
    20%  { transform: translateX(-3px); }
    40%  { transform: translateX(3px); }
    60%  { transform: translateX(-1px); }
    80%  { transform: translateX(2px); }
    100% { transform: translateX(0); }
  }
  @keyframes orbDrift {
    0%   { transform: translate(0,0) scale(1); }
    33%  { transform: translate(40px,-30px) scale(1.1); }
    66%  { transform: translate(-25px,20px) scale(0.92); }
    100% { transform: translate(0,0) scale(1); }
  }
  @keyframes particleDrift {
    0%   { transform: translateY(0); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.5; }
    100% { transform: translateY(-110vh); opacity: 0; }
  }
  @keyframes navGlow {
    0%,100% { box-shadow: 0 -1px 0 #FFB800, 0 0 12px rgba(255,184,0,0.2); }
    50%      { box-shadow: 0 -1px 0 #FFE566, 0 0 24px rgba(255,184,0,0.45); }
  }
  @keyframes hpBar {
    from { width: 0%; }
    to   { width: 100%; }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .lobby-card-center { animation: floatCard 4s ease-in-out infinite; }
  .lobby-card-left   { animation: floatCardL 3.6s ease-in-out infinite; }
  .lobby-card-right  { animation: floatCardR 4.4s ease-in-out infinite 0.5s; }

  .corner-tl, .corner-tr, .corner-bl, .corner-br {
    position: absolute; width: 14px; height: 14px;
    animation: cornerPulse 2s ease-in-out infinite;
  }
  .corner-tl { top: 0; left: 0;  border-top: 1.5px solid #FFB800; border-left: 1.5px solid #FFB800; }
  .corner-tr { top: 0; right: 0; border-top: 1.5px solid #FFB800; border-right: 1.5px solid #FFB800; }
  .corner-bl { bottom: 0; left: 0;  border-bottom: 1.5px solid #FFB800; border-left: 1.5px solid #FFB800; }
  .corner-br { bottom: 0; right: 0; border-bottom: 1.5px solid #FFB800; border-right: 1.5px solid #FFB800; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2a1a0a; border-radius: 2px; }
`;

// ─────────────────────────────────────────────
// CARD PICKER MODAL
// ─────────────────────────────────────────────
function CardPickerModal({
  ownedCards,
  onPick,
  onClose,
}: {
  ownedCards: CardDefinition[];
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<Rarity | "all">("all");
  const shown = filter === "all" ? ownedCards : ownedCards.filter((c) => c.rarity === filter);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "fadeIn 0.18s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(480px, 94vw)", maxHeight: "82vh",
          background: "linear-gradient(160deg, #0c0a06 0%, #060400 100%)",
          border: "1px solid #2a1a06",
          borderRadius: 4,
          display: "flex", flexDirection: "column", overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Corner brackets */}
        <div className="corner-tl"/><div className="corner-tr"/>
        <div className="corner-bl"/><div className="corner-br"/>

        {/* Header */}
        <div style={{
          padding: "14px 18px", borderBottom: "1px solid #1a1206",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 13, color: "#FFB800", letterSpacing: 4, fontWeight: 700, textTransform: "uppercase" }}>
            ◈ Select Card
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#4a3a1a", cursor: "pointer", fontSize: 14, fontFamily: "Rajdhani" }}>✕</button>
        </div>

        {/* Filter */}
        <div style={{ display: "flex", gap: 4, padding: "10px 14px", overflowX: "auto", borderBottom: "1px solid #1a1206", flexShrink: 0 }}>
          {(["all", ...RARITY_ORDER] as const).map((r) => {
            const cfg = r !== "all" ? RARITY_CONFIG[r] : null;
            const active = filter === r;
            return (
              <button key={r} onClick={() => setFilter(r)} style={{
                flexShrink: 0, padding: "4px 10px", borderRadius: 2,
                border: active ? `1px solid ${cfg ? cfg.border : "#FFB800"}` : "1px solid #1a1206",
                background: active ? (cfg ? `${cfg.color}18` : "rgba(255,184,0,0.1)") : "transparent",
                color: active ? (cfg ? cfg.color : "#FFB800") : "#3a2a1a",
                fontSize: 8, letterSpacing: 2, fontFamily: "Rajdhani, sans-serif",
                textTransform: "uppercase", cursor: "pointer", fontWeight: 600,
              }}>
                {r === "all" ? "ALL" : cfg!.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div style={{ overflowY: "auto", padding: 14, flex: 1 }}>
          {shown.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#2a1a0a", fontSize: 9, letterSpacing: 3, fontFamily: "Rajdhani" }}>
              NO CARDS AVAILABLE
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
              {shown.map((c) => {
                const cfg = RARITY_CONFIG[c.rarity];
                return (
                  <div key={c.id} onClick={() => onPick(c.id)} style={{
                    cursor: "pointer", borderRadius: 3,
                    border: `1px solid ${cfg.border}30`,
                    padding: 4, background: cfg.bgGradient,
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${cfg.color}50`; (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
                  >
                    <Card card={c} size="small" />
                    <div style={{ fontSize: 6, color: cfg.color, letterSpacing: 1, textAlign: "center", fontFamily: "Rajdhani", fontWeight: 600 }}>
                      {c.name.length > 12 ? c.name.slice(0, 11) + "…" : c.name}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STAT BAR
// ─────────────────────────────────────────────
function StatBar({ label, value, max = 999, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 7, color: "#4a3a1a", letterSpacing: 2, fontFamily: "Share Tech Mono, monospace" }}>{label}</span>
        <span style={{ fontSize: 7, color, letterSpacing: 1, fontFamily: "Share Tech Mono, monospace" }}>{value}</span>
      </div>
      <div style={{ height: 3, background: "#0d0a04", borderRadius: 0, overflow: "hidden", position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}60, ${color})`,
          animation: "hpBar 1s ease-out",
        }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CARD INFO PANEL — shows when card selected
// ─────────────────────────────────────────────
function CardInfoPanel({ card }: { card: CardDefinition }) {
  const cfg = RARITY_CONFIG[card.rarity];
  return (
    <div style={{
      background: "linear-gradient(160deg, rgba(10,8,4,0.95) 0%, rgba(4,3,1,0.98) 100%)",
      border: `1px solid ${cfg.border}30`,
      borderRadius: 4, padding: "14px 16px",
      animation: "slideRight 0.25s ease",
      position: "relative", overflow: "hidden",
    }}>
      {/* scan line */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${cfg.color}60, transparent)`,
        animation: "scanline 3s linear infinite",
      }} />

      <div style={{ fontSize: 7, color: "#3a2a0a", letterSpacing: 4, fontFamily: "Share Tech Mono", marginBottom: 6, textTransform: "uppercase" }}>
        ◈ Unit Data
      </div>

      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, color: cfg.textColor, fontWeight: 700, letterSpacing: 1, marginBottom: 2, lineHeight: 1.2 }}>
        {card.name}
      </div>
      <div style={{ fontSize: 8, color: cfg.color, letterSpacing: 3, fontFamily: "Share Tech Mono", marginBottom: 12, textTransform: "uppercase" }}>
        {card.title} · {card.faction}
      </div>

      {/* Stats */}
      <StatBar label="ATK" value={card.atk} max={999} color="#FF6B6B" />
      <StatBar label="DEF" value={card.def} max={999} color="#4ECDC4" />
      <StatBar label="SPD" value={card.spd} max={999} color="#FFE566" />

      {/* Element */}
      <div style={{
        marginTop: 10, padding: "5px 8px",
        background: `${cfg.color}10`, border: `1px solid ${cfg.border}25`,
        borderRadius: 2, fontSize: 8, color: cfg.color,
        fontFamily: "Rajdhani", letterSpacing: 2, fontWeight: 600,
      }}>
        {card.element}
      </div>

      {/* Rarity stars */}
      <div style={{ marginTop: 8, fontSize: 9, color: cfg.color, letterSpacing: 2 }}>
        {"★".repeat(cfg.stars)}{"☆".repeat(Math.max(0, 6 - cfg.stars))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOBBY MAIN
// ─────────────────────────────────────────────
interface LobbyMainProps {
  ownedCards: CardDefinition[];
  wallet: WalletState;
  featuredSlots: (string | null)[];
  onSetFeatured: (i: number, id: string | null) => void;
  onNavigate: (tab: LobbyTab) => void;
}

function LobbyMain({ ownedCards, wallet, featuredSlots, onSetFeatured, onNavigate }: LobbyMainProps) {
  const [picking, setPicking] = useState<number | null>(null);
  const [focusedSlot, setFocusedSlot] = useState(1); // 0=left, 1=center, 2=right

  const cards = featuredSlots.map(id => id ? CARD_DATABASE.find(c => c.id === id) ?? null : null);
  const centerCard = cards[1];
  const cfg = centerCard ? RARITY_CONFIG[centerCard.rarity] : null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", animation: "slideUp 0.3s ease" }}>

      {/* ── HERO SECTION ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: centerCard && cfg
          ? `linear-gradient(180deg, ${cfg.color}08 0%, transparent 60%)`
          : "transparent",
        padding: "20px 0 0",
        minHeight: 300,
        display: "flex", flexDirection: "column", alignItems: "center",
        transition: "background 0.6s ease",
      }}>

        {/* Background grid lines — Arknights feel */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `
            linear-gradient(rgba(255,184,0,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,184,0,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }} />

        {/* Background aura behind center card */}
        {centerCard && cfg && (
          <div style={{
            position: "absolute", top: "30%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 220, height: 220, borderRadius: "50%",
            background: `radial-gradient(circle, ${cfg.color}18 0%, transparent 70%)`,
            filter: "blur(30px)",
            pointerEvents: "none",
            transition: "background 0.6s ease",
          }} />
        )}

        {/* 3 Cards */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          gap: 0, position: "relative", zIndex: 2,
          width: "100%", maxWidth: 420,
        }}>

          {/* LEFT card */}
          <div
            className="lobby-card-left"
            onClick={() => cards[0] ? setFocusedSlot(0) : setPicking(0)}
            style={{
              cursor: "pointer", flexShrink: 0,
              opacity: focusedSlot === 0 ? 1 : 0.55,
              transition: "opacity 0.3s",
              filter: focusedSlot === 0 ? "none" : "brightness(0.6)",
              zIndex: focusedSlot === 0 ? 3 : 1,
              marginRight: -20,
            }}
          >
            {cards[0] ? (
              <div style={{ boxShadow: focusedSlot === 0 ? RARITY_AURA[cards[0].rarity] : "none", borderRadius: 10, transition: "box-shadow 0.3s" }}>
                <Card card={cards[0]} size="medium" glowing={focusedSlot === 0} />
              </div>
            ) : (
              <EmptySlot index={0} onPick={() => setPicking(0)} size="small" />
            )}
          </div>

          {/* CENTER card */}
          <div
            className="lobby-card-center"
            onClick={() => centerCard ? setFocusedSlot(1) : setPicking(1)}
            style={{
              cursor: "pointer", flexShrink: 0,
              zIndex: focusedSlot === 1 ? 5 : 2,
              transform: "scale(1.1)",
              filter: focusedSlot === 1 ? "none" : "brightness(0.6)",
              opacity: focusedSlot === 1 ? 1 : 0.7,
              transition: "all 0.3s",
            }}
          >
            {centerCard ? (
              <div style={{
                boxShadow: focusedSlot === 1 ? RARITY_AURA[centerCard.rarity] : "none",
                borderRadius: 10, transition: "box-shadow 0.4s",
              }}>
                <Card card={centerCard} size="large" glowing={focusedSlot === 1} />
              </div>
            ) : (
              <EmptySlot index={1} onPick={() => setPicking(1)} size="large" />
            )}
          </div>

          {/* RIGHT card */}
          <div
            className="lobby-card-right"
            onClick={() => cards[2] ? setFocusedSlot(2) : setPicking(2)}
            style={{
              cursor: "pointer", flexShrink: 0,
              opacity: focusedSlot === 2 ? 1 : 0.55,
              filter: focusedSlot === 2 ? "none" : "brightness(0.6)",
              zIndex: focusedSlot === 2 ? 3 : 1,
              transition: "all 0.3s",
              marginLeft: -20,
            }}
          >
            {cards[2] ? (
              <div style={{ boxShadow: focusedSlot === 2 ? RARITY_AURA[cards[2].rarity] : "none", borderRadius: 10, transition: "box-shadow 0.3s" }}>
                <Card card={cards[2]} size="medium" glowing={focusedSlot === 2} />
              </div>
            ) : (
              <EmptySlot index={2} onPick={() => setPicking(2)} size="small" />
            )}
          </div>
        </div>

        {/* Slot labels */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, zIndex: 3 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: i === 1 ? 40 : 28, height: 2,
              background: focusedSlot === i
                ? (cards[i] ? RARITY_CONFIG[cards[i]!.rarity].color : "#FFB800")
                : "#1a1206",
              borderRadius: 1, transition: "all 0.3s",
              cursor: "pointer",
            }} onClick={() => setFocusedSlot(i)} />
          ))}
        </div>

        {/* Change button */}
        <button
          onClick={() => setPicking(focusedSlot)}
          style={{
            marginTop: 10, marginBottom: 16,
            background: "rgba(255,184,0,0.06)",
            border: "1px solid #2a1a06",
            color: "#4a3a1a", padding: "5px 16px", borderRadius: 2,
            fontSize: 7, letterSpacing: 3, fontFamily: "Rajdhani, sans-serif",
            cursor: "pointer", textTransform: "uppercase", fontWeight: 600,
            transition: "all 0.15s", zIndex: 3,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#FFB80060"; (e.currentTarget as HTMLElement).style.color = "#FFB800"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a1a06"; (e.currentTarget as HTMLElement).style.color = "#4a3a1a"; }}
        >
          ◈ Change Slot {focusedSlot + 1}
        </button>
      </div>

      {/* ── INFO PANEL — focused card data ── */}
      <div style={{ padding: "0 16px", marginBottom: 12 }}>
        {cards[focusedSlot] ? (
          <CardInfoPanel card={cards[focusedSlot]!} key={focusedSlot} />
        ) : (
          <div style={{
            border: "1px dashed #1a1206", borderRadius: 4,
            padding: "16px", textAlign: "center",
            color: "#2a1a0a", fontSize: 8, letterSpacing: 3,
            fontFamily: "Rajdhani", textTransform: "uppercase",
          }}>
            — No unit assigned to slot {focusedSlot + 1} —
          </div>
        )}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div style={{ padding: "0 16px", marginBottom: 8 }}>
        <div style={{ fontSize: 7, color: "#3a2a0a", letterSpacing: 4, fontFamily: "Share Tech Mono", textTransform: "uppercase", marginBottom: 10 }}>
          ◈ Operations
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { icon: "🎴", label: "Gacha Pull", sub: "Summon cards", color: "#FFB800", tab: "gacha" as LobbyTab },
            { icon: "📚", label: "Collection", sub: `${ownedCards.length} cards`, color: "#C040FF", tab: "collection" as LobbyTab },
            { icon: "🪙", label: "Wallet", sub: `${wallet.gold.toLocaleString()} gold`, color: "#60D0FF", tab: "wallet" as LobbyTab },
            { icon: "🏪", label: "Shop", sub: "Coming soon", color: "#4a3a1a", tab: null as any, disabled: true },
          ].map(item => (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => !item.disabled && onNavigate(item.tab)}
              style={{
                background: item.disabled ? "transparent" : `${item.color}06`,
                border: `1px solid ${item.disabled ? "#1a1206" : item.color + "28"}`,
                borderRadius: 4, padding: "12px 14px",
                display: "flex", alignItems: "center", gap: 10,
                cursor: item.disabled ? "default" : "pointer",
                transition: "all 0.15s",
                opacity: item.disabled ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!item.disabled) { (e.currentTarget as HTMLElement).style.borderColor = item.color + "60"; (e.currentTarget as HTMLElement).style.background = item.color + "0f"; } }}
              onMouseLeave={e => { if (!item.disabled) { (e.currentTarget as HTMLElement).style.borderColor = item.color + "28"; (e.currentTarget as HTMLElement).style.background = item.color + "06"; } }}
            >
              <div style={{ fontSize: 20 }}>{item.icon}</div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 11, color: item.color, fontWeight: 700, letterSpacing: 1 }}>{item.label}</div>
                <div style={{ fontSize: 7, color: "#3a2a0a", letterSpacing: 1, fontFamily: "Share Tech Mono" }}>{item.sub}</div>
              </div>
              {!item.disabled && <div style={{ marginLeft: "auto", fontSize: 9, color: "#2a1a0a" }}>›</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Picker Modal */}
      {picking !== null && (
        <CardPickerModal
          ownedCards={ownedCards}
          onPick={(id) => { onSetFeatured(picking, id); setPicking(null); }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPTY SLOT
// ─────────────────────────────────────────────
function EmptySlot({ index, onPick, size }: { index: number; onPick: () => void; size: "small" | "large" }) {
  const dims = size === "large" ? { w: 240, h: 336 } : { w: 160, h: 224 };
  return (
    <div onClick={onPick} style={{
      width: dims.w, height: dims.h,
      border: "1.5px dashed #1a1206", borderRadius: 10,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 8, cursor: "pointer", transition: "all 0.2s",
      background: "rgba(255,184,0,0.015)",
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#FFB80050"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#1a1206"; }}
    >
      <div style={{ fontSize: 24, opacity: 0.12 }}>🎴</div>
      <div style={{ fontSize: 7, color: "#2a1a0a", letterSpacing: 3, fontFamily: "Share Tech Mono", textTransform: "uppercase" }}>Slot {index + 1}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// WALLET TAB
// ─────────────────────────────────────────────
function WalletTab({ wallet }: { wallet: WalletState }) {
  return (
    <div style={{ padding: "16px 16px 40px", animation: "slideUp 0.25s ease" }}>
      <SectionHeader label="Treasury" title="Wallet" />
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
        {[
          { icon: "🪙", label: "GOLD", value: wallet.gold, color: "#FFB800", desc: "General currency" },
          { icon: "💎", label: "GEMS", value: wallet.gems, color: "#60D0FF", desc: "Premium currency" },
          { icon: "🎫", label: "TICKETS", value: wallet.tickets, color: "#C040FF", desc: "Free gacha pulls" },
        ].map(c => (
          <div key={c.label} style={{
            background: "linear-gradient(135deg, #0c0a06 0%, #070500 100%)",
            border: `1px solid ${c.color}18`, borderRadius: 4,
            padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
            position: "relative", overflow: "hidden",
          }}>
            <div className="corner-tl" style={{ width: 8, height: 8 }} />
            <div className="corner-br" style={{ width: 8, height: 8 }} />
            <div style={{ fontSize: 24 }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 7, color: "#3a2a0a", letterSpacing: 4, fontFamily: "Share Tech Mono", textTransform: "uppercase" }}>{c.label}</div>
              <div style={{ fontSize: 8, color: "#2a1a0a", fontFamily: "Rajdhani", marginTop: 2 }}>{c.desc}</div>
            </div>
            <div style={{ fontFamily: "Share Tech Mono", fontSize: 22, color: c.color }}>{c.value.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <ComingSoonBox label="Transaction History" />
    </div>
  );
}

// ─────────────────────────────────────────────
// COLLECTION TAB
// ─────────────────────────────────────────────
function CollectionTab({ ownedCards, collectionState }: { ownedCards: CardDefinition[]; collectionState: CollectionState }) {
  const [filter, setFilter] = useState<Rarity | "all">("all");
  const [selected, setSelected] = useState<CardDefinition | null>(null);

  const shown = filter === "all" ? ownedCards : ownedCards.filter(c => c.rarity === filter);
  const pct = CARD_DATABASE.length > 0 ? Math.round((ownedCards.length / CARD_DATABASE.length) * 100) : 0;
  const rarityCounts = RARITY_ORDER.map(r => ({
    rarity: r,
    count: ownedCards.filter(c => c.rarity === r).length,
    cfg: RARITY_CONFIG[r],
  }));

  return (
    <div style={{ padding: "16px 16px 40px", animation: "slideUp 0.25s ease" }}>
      <SectionHeader label="Archives" title="Collection" />

      <div style={{
        background: "linear-gradient(135deg, #1a1000 0%, #0d0800 100%)",
        border: "1px solid #3a2a0a", borderRadius: 12,
        padding: "14px 16px", marginBottom: 16, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: 8, right: 12, fontSize: 28, opacity: 0.06, pointerEvents: "none", fontFamily: "Rajdhani", color: "#FFB800" }}>✦</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 7, color: "#4a3a1a", letterSpacing: 3, textTransform: "uppercase", fontFamily: "Share Tech Mono" }}>Inventory</div>
            <div style={{ fontSize: 18, color: "#FFB800", fontFamily: "Rajdhani, sans-serif", letterSpacing: 1, marginTop: 2 }}>
              {ownedCards.length} <span style={{ fontSize: 10, color: "#5a4a25" }}>/ {CARD_DATABASE.length}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 7, color: "#4a3a1a", letterSpacing: 2, textTransform: "uppercase", fontFamily: "Share Tech Mono" }}>Completion</div>
            <div style={{ fontSize: 20, color: "#FFE566", fontFamily: "Rajdhani, sans-serif" }}>{pct}%</div>
          </div>
        </div>
        <div style={{ height: 4, background: "#1a1200", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #FFB800, #FFE566)", borderRadius: 2, boxShadow: "0 0 8px rgba(255,184,0,0.5)", transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
          {rarityCounts.filter(item => item.count > 0).map(item => (
            <div key={item.rarity} style={{ fontSize: 8, padding: "2px 7px", borderRadius: 20, background: `${item.cfg.color}14`, border: `1px solid ${item.cfg.border}44`, color: item.cfg.color, letterSpacing: 1, fontFamily: "Rajdhani, sans-serif" }}>
              {item.cfg.label} ×{item.count}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {(["all", ...RARITY_ORDER] as const).map(r => {
          const cfg = r !== "all" ? RARITY_CONFIG[r] : null;
          const active = filter === r;
          return (
            <button key={r} onClick={() => setFilter(r)} style={{
              flexShrink: 0,
              padding: "5px 12px",
              borderRadius: 20,
              border: active ? `1.5px solid ${cfg ? cfg.border : "#FFB800"}` : "1px solid #2a1a0a",
              background: active ? (cfg ? `${cfg.color}18` : "rgba(255,184,0,0.1)") : "transparent",
              color: active ? (cfg ? cfg.color : "#FFB800") : "#3a2a1a",
              fontSize: 9,
              letterSpacing: 2,
              fontFamily: "Rajdhani, sans-serif",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s",
            }}>
              {r === "all" ? "All" : cfg!.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#2a1a0a", fontSize: 10, letterSpacing: 3, fontFamily: "Rajdhani, sans-serif", textTransform: "uppercase" }}>
          {ownedCards.length === 0 ? "— No records. Start pulling! —" : "— No units in this tier —"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 10 }}>
          {shown.map(c => {
            const cfg = RARITY_CONFIG[c.rarity];
            const entry = collectionState[c.id];
            return (
              <div key={c.id} onClick={() => setSelected(c)} style={{
                cursor: "pointer",
                borderRadius: 3,
                border: `1px solid ${cfg.border}30`,
                background: cfg.bgGradient,
                padding: 5,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                transition: "all 0.15s",
                position: "relative",
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${cfg.color}35`; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
              >
                {entry?.isNew && <div style={{ position: "absolute", top: 3, right: 3, background: "#FF3860", borderRadius: 2, padding: "1px 3px", fontSize: 6, color: "#fff", fontFamily: "Rajdhani", fontWeight: 700, letterSpacing: 1 }}>NEW</div>}
                <Card card={c} size="small" />
                <div style={{ fontSize: 6, color: cfg.color, letterSpacing: 1, textAlign: "center", fontFamily: "Rajdhani", fontWeight: 600 }}>
                  {c.name.length > 12 ? c.name.slice(0, 11) + "…" : c.name}
                </div>
                {entry?.count > 1 && <div style={{ fontSize: 6, color: "#3a2a0a", fontFamily: "Share Tech Mono" }}>×{entry.count}</div>}
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          background: "rgba(0,0,0,0.92)",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          animation: "fadeIn 0.2s ease",
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "min(420px, 92vw)",
            background: "linear-gradient(160deg, #0c0a06 0%, #060400 100%)",
            border: `1px solid ${RARITY_CONFIG[selected.rarity].border}35`,
            borderRadius: 12,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            position: "relative",
          }}>
            <div className="corner-tl" style={{ width: 10, height: 10 }} />
            <div className="corner-tr" style={{ width: 10, height: 10 }} />
            <div className="corner-bl" style={{ width: 10, height: 10 }} />
            <div className="corner-br" style={{ width: 10, height: 10 }} />

            <div style={{ boxShadow: RARITY_AURA[selected.rarity], borderRadius: 12 }}>
              <Card card={selected} size="large" glowing />
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 16, color: RARITY_CONFIG[selected.rarity].textColor, letterSpacing: 1, fontWeight: 700 }}>{selected.name}</div>
              <div style={{ fontSize: 9, color: RARITY_CONFIG[selected.rarity].color, letterSpacing: 3, fontFamily: "Share Tech Mono", textTransform: "uppercase", marginTop: 4 }}>{selected.title} · {selected.faction}</div>
            </div>

            <div style={{ width: "100%" }}>
              <CardInfoPanel card={selected} />
            </div>

            <button onClick={() => setSelected(null)} style={{
              background: "transparent",
              border: "1px solid #2a1a06",
              color: "#4a3a1a",
              padding: "8px 28px",
              borderRadius: 2,
              fontFamily: "Rajdhani",
              fontSize: 9,
              letterSpacing: 4,
              cursor: "pointer",
              textTransform: "uppercase",
              fontWeight: 700,
            }}>✕ Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// GACHA TAB
// ─────────────────────────────────────────────
function GachaTab({ onGoToGacha }: { onGoToGacha: () => void }) {
  return (
    <div style={{ padding: "16px 16px 40px", animation: "slideUp 0.25s ease" }}>
      <SectionHeader label="Summoning Gate" title="Gacha" />
      <div style={{
        background: "linear-gradient(135deg, #0c0a06 0%, #070500 100%)",
        border: "1px solid #2a1a06", borderRadius: 4, padding: "32px 24px",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 16,
        position: "relative",
      }}>
        <div className="corner-tl"/><div className="corner-tr"/>
        <div className="corner-bl"/><div className="corner-br"/>
        <div style={{ fontSize: 52 }}>🎴</div>
        <div style={{ fontFamily: "Rajdhani", fontSize: 16, color: "#FFE566", letterSpacing: 3, fontWeight: 700, textTransform: "uppercase" }}>Summoning Awaits</div>
        <div style={{ fontSize: 8, color: "#3a2a0a", letterSpacing: 2, textAlign: "center", lineHeight: 2, fontFamily: "Share Tech Mono" }}>
          The gate to legendary cards awaits.<br/>Step into the ritual.
        </div>
        <button onClick={onGoToGacha} style={{
          background: "rgba(255,184,0,0.08)", border: "1px solid #FFB80060",
          color: "#FFE566", padding: "12px 36px", borderRadius: 2,
          fontFamily: "Rajdhani", fontSize: 12, letterSpacing: 4,
          cursor: "pointer", textTransform: "uppercase", fontWeight: 700,
          boxShadow: "0 0 30px rgba(255,184,0,0.15)", transition: "all 0.2s",
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,184,0,0.16)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 50px rgba(255,184,0,0.3)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,184,0,0.08)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(255,184,0,0.15)"; }}
        >◈ Open Gacha</button>
      </div>

      {/* Drop rates */}
      <div style={{ background: "rgba(255,184,0,0.02)", border: "1px solid #1a1206", borderRadius: 4, padding: "14px 16px" }}>
        <div style={{ fontSize: 7, color: "#3a2a0a", letterSpacing: 4, fontFamily: "Share Tech Mono", textTransform: "uppercase", marginBottom: 12 }}>◈ Drop Rates</div>
        {RARITY_ORDER.map(r => {
          const cfg = RARITY_CONFIG[r];
          return (
            <div key={r} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 72, fontSize: 7, color: cfg.color, letterSpacing: 1, fontFamily: "Share Tech Mono" }}>{cfg.label}</div>
              <div style={{ flex: 1, height: 2, background: "#0d0a04" }}>
                <div style={{ height: "100%", width: cfg.rate, background: `linear-gradient(90deg, ${cfg.color}50, ${cfg.color})` }} />
              </div>
              <div style={{ fontSize: 7, color: cfg.color, width: 28, textAlign: "right", fontFamily: "Share Tech Mono" }}>{cfg.rate}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 7, color: "#3a2a0a", letterSpacing: 5, fontFamily: "Share Tech Mono", textTransform: "uppercase", marginBottom: 5 }}>
        ◈ {label}
      </div>
      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 24, color: "#FFB800", letterSpacing: 3, fontWeight: 700 }}>{title}</div>
      <div style={{ height: 1, background: "linear-gradient(90deg, #FFB80040, transparent)", marginTop: 8 }} />
    </div>
  );
}

function ComingSoonBox({ label }: { label: string }) {
  return (
    <div style={{ background: "rgba(255,184,0,0.02)", border: "1px dashed #1a1206", borderRadius: 4, padding: "24px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 8, color: "#2a1a0a", letterSpacing: 3, fontFamily: "Share Tech Mono", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 7, color: "#1a1000", letterSpacing: 2, fontFamily: "Share Tech Mono" }}>— Coming soon —</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────
function NavBar({ activeTab, onNavigate }: { activeTab: LobbyTab; onNavigate: (t: LobbyTab) => void }) {
  const tabs: { id: LobbyTab; icon: string; label: string; disabled?: boolean }[] = [
    { id: "lobby",      icon: "⬡",  label: "Lobby" },
    { id: "wallet",     icon: "◈",  label: "Wallet" },
    { id: "collection", icon: "▣",  label: "Cards" },
    { id: "gacha",      icon: "◉",  label: "Gacha" },
    { id: "lobby",      icon: "⊞",  label: "Shop", disabled: true },
  ];

  return (
    <div style={{
      position: "sticky", bottom: 0,
      background: "linear-gradient(180deg, transparent 0%, #040300 30%)",
      paddingTop: 12, paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)",
      zIndex: 50,
    }}>
      <div style={{
        display: "flex",
        background: "#060500",
        borderTop: "1px solid #1a1206",
        margin: "0 0",
      }}>
        {tabs.map((t, i) => {
          const isShop = i === 4;
          const active = !isShop && activeTab === t.id;
          return (
            <button key={i}
              onClick={() => !isShop && onNavigate(t.id)}
              disabled={isShop}
              style={{
                flex: 1, border: "none",
                background: active ? "rgba(255,184,0,0.06)" : "transparent",
                borderTop: active ? "1px solid #FFB800" : "1px solid transparent",
                padding: "10px 4px 8px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                cursor: isShop ? "default" : "pointer",
                opacity: isShop ? 0.3 : 1,
                transition: "all 0.15s",
                animation: active ? "navGlow 2s ease-in-out infinite" : "none",
              }}
            >
              <div style={{ fontSize: 14, color: active ? "#FFB800" : "#2a1a0a" }}>{t.icon}</div>
              <div style={{ fontSize: 6, letterSpacing: 2, textTransform: "uppercase", fontFamily: "Rajdhani", fontWeight: 700, color: active ? "#FFB800" : "#2a1a0a" }}>
                {t.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TOP BAR
// ─────────────────────────────────────────────
function TopBar({ activeTab, gems }: { activeTab: LobbyTab; gems: number }) {
  const titles: Record<LobbyTab, string> = { lobby: "Lobby", wallet: "Wallet", collection: "Collection", gacha: "Gacha" };
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 40,
      background: "linear-gradient(180deg, #040300 60%, transparent 100%)",
      padding: "14px 18px 6px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      borderBottom: "1px solid #0d0a04",
    }}>
      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: 12, color: "#FFB800", letterSpacing: 4, fontWeight: 700 }}>
        ◈ CHATT
      </div>
      <div style={{ fontSize: 7, color: "#2a1a0a", letterSpacing: 4, fontFamily: "Share Tech Mono", textTransform: "uppercase" }}>
        {titles[activeTab]}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(96,208,255,0.06)", border: "1px solid #60D0FF20", padding: "4px 10px", borderRadius: 2 }}>
        <span style={{ fontSize: 11 }}>💎</span>
        <span style={{ fontFamily: "Share Tech Mono", fontSize: 10, color: "#60D0FF" }}>{gems}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
interface GameLobbyProps {
  collectionState?: CollectionState;
  onGoToGacha?: () => void;
}

export default function GameLobby({ collectionState = {}, onGoToGacha }: GameLobbyProps) {
  const [activeTab, setActiveTab] = useState<LobbyTab>("lobby");
  const [wallet] = useState<WalletState>({ gold: 4200, gems: 380, tickets: 3 });
  const [featuredSlots, setFeaturedSlots] = useState<(string | null)[]>([null, null, null]);

  const ownedCards: CardDefinition[] = Object.entries(collectionState)
    .filter(([, v]) => v.count > 0)
    .map(([id]) => CARD_DATABASE.find(c => c.id === id)!)
    .filter(Boolean);

  const handleNavigate = (tab: LobbyTab) => {
    if (tab === "gacha" && onGoToGacha) { onGoToGacha(); return; }
    setActiveTab(tab);
  };

  return (
    <div style={{
      width: "100%",
      minHeight: "100dvh",
      background: "#040300",
      color: "#e8d5a3",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      margin: 0,
      overflow: "hidden",
      boxSizing: "border-box",
    }}>
      <style>{GLOBAL_CSS}</style>

      {/* Ambient background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "10%", left: "15%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,184,0,0.04) 0%, transparent 70%)", animation: "orbDrift 20s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "25%", right: "8%", width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(192,64,255,0.035) 0%, transparent 70%)", animation: "orbDrift 28s ease-in-out infinite reverse" }} />
        {/* Floating particles */}
        {[...Array(16)].map((_, i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(i * 6.25) % 100}%`,
            bottom: "-5px",
            width: 1 + (i % 3),
            height: 1 + (i % 3),
            borderRadius: "50%",
            background: "#FFB800",
            opacity: 0.06 + (i % 4) * 0.03,
            animation: `particleDrift ${8 + i * 0.8}s ${i * 0.5}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      <TopBar activeTab={activeTab} gems={wallet.gems} />

      <div style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 10, display: "flex", flexDirection: "column" }}>
        {activeTab === "lobby" && (
          <LobbyMain
            ownedCards={ownedCards}
            wallet={wallet}
            featuredSlots={featuredSlots}
            onSetFeatured={(i, id) => setFeaturedSlots(prev => { const n = [...prev]; n[i] = id; return n; })}
            onNavigate={handleNavigate}
          />
        )}
        {activeTab === "wallet" && <WalletTab wallet={wallet} />}
        {activeTab === "collection" && <CollectionTab ownedCards={ownedCards} collectionState={collectionState} />}
        {activeTab === "gacha" && <GachaTab onGoToGacha={() => onGoToGacha ? onGoToGacha() : undefined} />}
      </div>

      <NavBar activeTab={activeTab} onNavigate={handleNavigate} />
    </div>
  );
}