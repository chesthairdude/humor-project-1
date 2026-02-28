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
  const CHART_MAX_BAR_HEIGHT = 92;
  const funnyBarHeight = Math.max(8, Math.round((upvotePercent / 100) * CHART_MAX_BAR_HEIGHT));
  const notFunnyPercent = 100 - upvotePercent;
  const notFunnyBarHeight = Math.max(8, Math.round((notFunnyPercent / 100) * CHART_MAX_BAR_HEIGHT));

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
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-gradient)",
          padding: "24px 24px",
          fontFamily: "var(--font-geist-sans)",
          boxSizing: "border-box",
        }}
      >
        <PageTransition>
          <div
            style={{
              width: "100%",
              maxWidth: "860px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ marginBottom: "8px" }}>
              <h1
                style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                My Stats
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>{email}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <StatCard emoji="🗳️" label="Total Rated" value={totalRated} sub="image/caption pairs" />
              <StatCard
                emoji="😂"
                label="Funny Votes"
                value={upvotes}
                valueColor="#4CDE80"
                sub={`${upvotePercent}% of your votes`}
              />
              <StatCard
                emoji="😐"
                label="Not Funny"
                value={downvotes}
                valueColor="#FF4458"
                sub={`${100 - upvotePercent}% of your votes`}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
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
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "space-around",
                    gap: "20px",
                    height: "140px",
                    paddingTop: "8px",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#4CDE80", marginBottom: "8px" }}>
                      {upvotePercent}%
                    </span>
                    <div
                      style={{
                        width: "56px",
                        height: `${funnyBarHeight}px`,
                        borderRadius: "12px 12px 6px 6px",
                        background: "linear-gradient(180deg, #a8ff78 0%, #4CDE80 100%)",
                        transition: "height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#4CDE80", marginTop: "8px" }}>
                      😂 Funny
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#FF4458", marginBottom: "8px" }}>
                      {notFunnyPercent}%
                    </span>
                    <div
                      style={{
                        width: "56px",
                        height: `${notFunnyBarHeight}px`,
                        borderRadius: "12px 12px 6px 6px",
                        background: "linear-gradient(180deg, #ff8a97 0%, #FF4458 100%)",
                        transition: "height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#FF4458", marginTop: "8px" }}>
                      Not Funny 😐
                    </span>
                  </div>
                </div>
              </div>
            ) : (
                <div />
              )}

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
                  My Voter Archetype
                </p>

                <div style={{ fontSize: "48px", marginBottom: "8px" }}>{consensus.emoji}</div>

                <p
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: "var(--text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {consensus.label}
                </p>

                <p
                  style={{
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--text-tertiary)",
                    marginBottom: "0",
                  }}
                >
                  {consensusPercent !== null ? `${consensusPercent}% agreeability` : "—"}
                </p>
              </div>
            </div>
          </div>
        </PageTransition>
      </main>
    </>
  );
}
