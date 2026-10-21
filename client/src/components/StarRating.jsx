import React from "react";
import { Star, Award, ShieldCheck, Zap, Heart, Trophy } from "lucide-react";

export function getReputationTier(role, count = 0) {
  const num = Number(count) || 0;

  if (role === "DONOR") {
    if (num >= 11) {
      return { stars: 5, label: "Platinum Hero", icon: Trophy, color: "#d97706", nextTarget: null, prevTarget: 11 };
    }
    if (num >= 6) {
      return { stars: 4, label: "Gold Champion", icon: Award, color: "#f59e0b", nextTarget: 11, prevTarget: 6 };
    }
    if (num >= 3) {
      return { stars: 3, label: "Silver Giver", icon: Heart, color: "#059669", nextTarget: 6, prevTarget: 3 };
    }
    if (num >= 1) {
      return { stars: 2, label: "Bronze Donor", icon: ShieldCheck, color: "#0d9488", nextTarget: 3, prevTarget: 1 };
    }
    return { stars: 1, label: "Green Starter", icon: Zap, color: "#64748b", nextTarget: 1, prevTarget: 0 };
  }

  if (role === "DELIVERY") {
    if (num >= 13) {
      return { stars: 5, label: "Master Courier", icon: Trophy, color: "#d97706", nextTarget: null, prevTarget: 13 };
    }
    if (num >= 7) {
      return { stars: 4, label: "Premier Driver", icon: Award, color: "#f59e0b", nextTarget: 13, prevTarget: 7 };
    }
    if (num >= 3) {
      return { stars: 3, label: "Swift Deliverer", icon: Zap, color: "#6366f1", nextTarget: 7, prevTarget: 3 };
    }
    if (num >= 1) {
      return { stars: 2, label: "Verified Courier", icon: ShieldCheck, color: "#0ea5e9", nextTarget: 3, prevTarget: 1 };
    }
    return { stars: 1, label: "Rookie Rider", icon: Zap, color: "#64748b", nextTarget: 1, prevTarget: 0 };
  }

  // NGO / Default
  if (num >= 13) {
    return { stars: 5, label: "Humanitarian Pillar", icon: Trophy, color: "#d97706", nextTarget: null, prevTarget: 13 };
  }
  if (num >= 7) {
    return { stars: 4, label: "Community Aid Ally", icon: Award, color: "#f59e0b", nextTarget: 13, prevTarget: 7 };
  }
  if (num >= 3) {
    return { stars: 3, label: "Active Distributor", icon: Heart, color: "#059669", nextTarget: 7, prevTarget: 3 };
  }
  if (num >= 1) {
    return { stars: 2, label: "Community Partner", icon: ShieldCheck, color: "#0d9488", nextTarget: 3, prevTarget: 1 };
  }
  return { stars: 1, label: "Verified NGO", icon: ShieldCheck, color: "#64748b", nextTarget: 1, prevTarget: 0 };
}

export default function StarRating({ role = "DONOR", count = 0, compact = false, showProgress = true }) {
  const tier = getReputationTier(role, count);
  const Icon = tier.icon;
  const num = Number(count) || 0;

  // Calculate progress to next tier
  let progressPercent = 100;
  let remaining = 0;
  if (tier.nextTarget !== null) {
    const range = tier.nextTarget - tier.prevTarget;
    const current = num - tier.prevTarget;
    progressPercent = Math.min(Math.max(Math.round((current / range) * 100), 10), 95);
    remaining = tier.nextTarget - num;
  }

  if (compact) {
    return (
      <div className="star-rating-box" title={`${tier.label} - ${count} completed`}>
        <div className="star-stars-row">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={14}
              className={star <= tier.stars ? "star-filled" : "star-empty"}
            />
          ))}
        </div>
        <span className="star-tier-title">{tier.label}</span>
      </div>
    );
  }

  return (
    <div className="card" style={{
      background: "linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)",
      border: "1px solid var(--gold-border)",
      boxShadow: "0 4px 16px rgba(245, 158, 11, 0.08)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span style={{
              background: "#fef3c7",
              color: "#b45309",
              padding: "4px 8px",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              fontWeight: "700",
              fontSize: "0.75rem",
              textTransform: "uppercase"
            }}>
              <Icon size={14} /> Reputation Tier
            </span>
            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {role === "DONOR" ? `${num} Donations Done` : role === "DELIVERY" ? `${num} Deliveries Done` : `${num} Grants Claimed`}
            </span>
          </div>
          <h3 style={{ fontSize: "1.35rem", color: "#78350f", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {tier.label}
          </h3>
        </div>

        {/* 5 Stars Rating Display */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "0.25rem"
        }}>
          <div style={{ display: "flex", gap: "3px" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={20}
                className={star <= tier.stars ? "star-filled" : "star-empty"}
              />
            ))}
          </div>
          <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#b45309" }}>
            {tier.stars} of 5 Stars
          </span>
        </div>
      </div>

      {/* Progress towards next star tier */}
      {showProgress && (
        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px dashed var(--gold-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: "600", marginBottom: "0.4rem" }}>
            <span style={{ color: "#92400e" }}>
              {tier.nextTarget !== null
                ? `${remaining} more ${role === "DONOR" ? "donation" : role === "DELIVERY" ? "delivery" : "action"}${remaining > 1 ? "s" : ""} to unlock next star!`
                : "🏆 Top Tier Achieved! You are a community hero."}
            </span>
            <span style={{ color: "var(--text-muted)" }}>{progressPercent}%</span>
          </div>
          <div style={{
            height: "8px",
            background: "#fef3c7",
            borderRadius: "var(--radius-full)",
            overflow: "hidden",
            border: "1px solid var(--gold-border)"
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: "linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)",
              borderRadius: "var(--radius-full)",
              transition: "width 0.5s ease"
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
