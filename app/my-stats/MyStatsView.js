"use client";

import Link from "next/link";
import PageTransition from "../components/PageTransition";
import ThemeToggleButton from "../components/ThemeToggleButton";

function StatCard({ emoji, label, value, valueColor, sub }) {
  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "16px",
        background: "var(--glass-bg)",
        backdropFilter: "blur(32px) saturate(180%)",
        WebkitBackdropFilter: "blur(32px) saturate(180%)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-highlight), var(--glass-shadow)",
      }}
    >
      <p style={{ fontSize: "20px", marginBottom: "8px" }}>{emoji}</p>
      <p
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--text-tertiary)",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "32px",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: valueColor ?? "var(--text-primary)",
          margin: 0,
          lineHeight: 1,
        }}
      >
        {value}
      </p>
      {sub ? (
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-tertiary)",
            marginTop: "6px",
          }}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

function getConsensusLabel(percent) {
  if (percent === null) return { label: "Not enough data yet", emoji: "🤷" };
  if (percent >= 90) return { label: "Hive mind", emoji: "🧠" };
  if (percent >= 75) return { label: "Goes with the crowd", emoji: "👥" };
  if (percent >= 55) return { label: "Mostly agreeable", emoji: "🤝" };
  if (percent >= 45) return { label: "Independent thinker", emoji: "🤔" };
  if (percent >= 25) return { label: "Contrarian", emoji: "😤" };
  return { label: "Chaos agent", emoji: "🔥" };
}

export default function MyStatsView({
  totalRated,
  upvotes,
  downvotes,
  consensusPercent,
  validConsensusVotes,
  email,
}) {
  const consensus = getConsensusLabel(consensusPercent);
  const upvotePercent = totalRated > 0 ? Math.round((upvotes / totalRated) * 100) : 0;

  return (
    <>
      <aside
        style={{
          width: "220px",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          padding: "28px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          background: "var(--sidebar-bg)",
          backdropFilter: "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
          borderRight: "1px solid var(--sidebar-border)",
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.7), 4px 0 32px rgba(0,0,0,0.05)",
          zIndex: 40,
        }}
      >
        <div style={{ marginBottom: "24px", paddingLeft: "8px" }}>
          <h1
            style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", color: "var(--text-primary)" }}
          >
            FunnyOrNot
          </h1>
          <p
            style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px", letterSpacing: "0.02em" }}
          >
            {email}
          </p>
        </div>

        <Link
          href="/vote"
          className="sidebar-nav-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
            borderLeft: "3px solid transparent",
            backgroundColor: "var(--nav-item-bg)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary)",
            textAlign: "left",
            width: "100%",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "18px" }}>🗳️</span>
          <span>Voting</span>
        </Link>

        <Link
          href="/hall-of-fame"
          className="sidebar-nav-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
            borderLeft: "3px solid transparent",
            backgroundColor: "var(--nav-item-bg)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary)",
            textAlign: "left",
            width: "100%",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "18px" }}>🏆</span>
          <span>Hall of Fame</span>
        </Link>

        <Link
          href="/my-stats"
          className="sidebar-nav-item active"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
            borderLeft: "3px solid #6478ff",
            backgroundColor: "var(--nav-item-hover)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary)",
            textAlign: "left",
            width: "100%",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "18px" }}>📊</span>
          <span>My Stats</span>
        </Link>

        <Link
          href="/upload"
          className="sidebar-nav-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
            borderLeft: "3px solid transparent",
            backgroundColor: "var(--nav-item-bg)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary)",
            textAlign: "left",
            width: "100%",
            textDecoration: "none",
          }}
        >
          <span style={{ fontSize: "18px" }}>⬆️</span>
          <span>Upload</span>
        </Link>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="sidebar-nav-item"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 14px",
              borderRadius: "12px",
              border: "1px solid var(--glass-border)",
              borderLeft: "3px solid transparent",
              backgroundColor: "var(--nav-item-bg)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--text-primary)",
              textAlign: "left",
              width: "100%",
              marginTop: "8px",
            }}
          >
            <span style={{ fontSize: "18px" }}>↩</span>
            <span>Sign Out</span>
          </button>
        </form>

        <ThemeToggleButton />
      </aside>

      <main
        style={{
          marginLeft: "220px",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-gradient)",
          padding: "40px 32px",
          fontFamily: "var(--font-geist-sans)",
          boxSizing: "border-box",
        }}
      >
        <PageTransition>
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  marginBottom: "6px",
                }}
              >
                My Stats
              </p>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Your Voting Record
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>{email}</p>
            </div>

            <StatCard emoji="🗳️" label="Total Rated" value={totalRated} sub="image/caption pairs" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <StatCard
                emoji="😂"
                label="Funny Votes"
                value={upvotes}
                valueColor="#4CDE80"
                sub={`${upvotePercent}% of your votes`}
              />
              <StatCard
                emoji="💀"
                label="Not Funny"
                value={downvotes}
                valueColor="#FF4458"
                sub={`${100 - upvotePercent}% of your votes`}
              />
            </div>

            {totalRated > 0 ? (
              <div
                style={{
                  padding: "16px 20px",
                  borderRadius: "16px",
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(32px) saturate(180%)",
                  WebkitBackdropFilter: "blur(32px) saturate(180%)",
                  border: "1px solid var(--glass-border)",
                  boxShadow: "var(--glass-highlight), var(--glass-shadow)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#4CDE80" }}>😂 Funny</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#FF4458" }}>Not Funny 💀</span>
                </div>
                <div
                  style={{
                    position: "relative",
                    height: "10px",
                    width: "100%",
                    borderRadius: "999px",
                    overflow: "hidden",
                    background: "rgba(255,68,88,0.4)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${upvotePercent}%`,
                      background: "linear-gradient(90deg, #4CDE80, #a8ff78)",
                      borderRadius: "999px",
                      transition: "width 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    }}
                  />
                </div>
              </div>
            ) : null}

            <div
              style={{
                padding: "24px",
                borderRadius: "16px",
                background: "var(--glass-bg)",
                backdropFilter: "blur(32px) saturate(180%)",
                WebkitBackdropFilter: "blur(32px) saturate(180%)",
                border: "1px solid var(--glass-border)",
                boxShadow: "var(--glass-highlight), var(--glass-shadow)",
                textAlign: "center",
              }}
            >
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--text-tertiary)",
                  marginBottom: "12px",
                }}
              >
                Consensus Agreement
              </p>

              <div style={{ fontSize: "48px", marginBottom: "8px" }}>{consensus.emoji}</div>

              <p
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                  marginBottom: "4px",
                }}
              >
                {consensusPercent !== null ? `${consensusPercent}%` : "—"}
              </p>

              <p
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                }}
              >
                {consensus.label}
              </p>

              {validConsensusVotes > 0 ? (
                <p style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                  Based on {validConsensusVotes} votes with a clear majority
                </p>
              ) : null}
            </div>
          </div>
        </PageTransition>
      </main>
    </>
  );
}
