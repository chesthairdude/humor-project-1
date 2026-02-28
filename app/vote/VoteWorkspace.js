"use client";

import Link from "next/link";
import { useState } from "react";
import VoteDeck from "./VoteDeck";
import UploadPanel from "./UploadPanel";
import ThemeToggleButton from "../components/ThemeToggleButton";
import PageTransition from "../components/PageTransition";

export default function VoteWorkspace({ initialItems = [], userEmail = "", initialMode = "vote" }) {
  const [mode, setMode] = useState(initialMode === "upload" ? "upload" : "vote");
  const [uploadExpanded, setUploadExpanded] = useState(false);
  const isVoteActive = mode === "vote";
  const isUploadActive = mode === "upload";

  return (
    <main style={{ minHeight: "100vh" }}>
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
          backgroundColor: "rgba(255, 255, 255, 0.5)",
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
            style={{
              fontSize: "22px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--text-primary)",
            }}
          >
            FunnyOrNot
          </h1>
          {userEmail ? (
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                marginTop: "2px",
                letterSpacing: "0.02em",
              }}
            >
              {userEmail}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            setMode("vote");
            setUploadExpanded(false);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
            borderLeft: isVoteActive ? "3px solid #6478ff" : "3px solid transparent",
            backgroundColor: isVoteActive ? "var(--nav-item-hover)" : "var(--nav-item-bg)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow:
              isVoteActive ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary)",
            transition: "all 0.18s ease",
            textAlign: "left",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--nav-item-hover)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              isVoteActive ? "var(--nav-item-hover)" : "var(--nav-item-bg)";
            e.currentTarget.style.boxShadow =
              isVoteActive ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span style={{ fontSize: "18px" }}>🗳️</span>
          <span>Voting</span>
        </button>

        <Link
          href="/hall-of-fame"
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
            transition: "all 0.18s ease",
            textAlign: "left",
            width: "100%",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--nav-item-hover)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--nav-item-bg)";
            e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span style={{ fontSize: "18px" }}>🏆</span>
          <span>Hall of Fame</span>
        </Link>

        <Link
          href="/my-stats"
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
            transition: "all 0.18s ease",
            textAlign: "left",
            width: "100%",
            textDecoration: "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--nav-item-hover)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--nav-item-bg)";
            e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span style={{ fontSize: "18px" }}>📊</span>
          <span>My Stats</span>
        </Link>

        <button
          type="button"
          onClick={() => setMode("upload")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
            borderLeft: isUploadActive ? "3px solid #6478ff" : "3px solid transparent",
            backgroundColor: isUploadActive ? "var(--nav-item-hover)" : "var(--nav-item-bg)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow:
              isUploadActive ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary)",
            transition: "all 0.18s ease",
            textAlign: "left",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--nav-item-hover)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              isUploadActive ? "var(--nav-item-hover)" : "var(--nav-item-bg)";
            e.currentTarget.style.boxShadow =
              isUploadActive ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span style={{ fontSize: "18px" }}>⬆️</span>
          <span>Upload</span>
        </button>

        <form action="/auth/signout" method="post">
          <button
            type="submit"
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
              transition: "all 0.18s ease",
              textAlign: "left",
              width: "100%",
              marginTop: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--nav-item-hover)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--nav-item-bg)";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={{ fontSize: "18px" }}>↩</span>
            <span>Sign Out</span>
          </button>
        </form>

        <ThemeToggleButton />
      </aside>

      <section
        style={{
          marginLeft: "220px",
          minHeight: "100vh",
          height: mode === "vote" ? "100vh" : "auto",
          overflow: mode === "vote" ? "hidden" : "visible",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
        }}
      >
        {mode === "vote" ? (
          <p
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              margin: 0,
              textAlign: "center",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--text-secondary)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
            }}
          >
            use buttons/arrow keys/swipe to vote
          </p>
        ) : null}
        <PageTransition>
          <div
            style={{
              width: "100%",
              maxWidth: mode === "vote" ? "400px" : uploadExpanded ? "900px" : "480px",
              margin: "0 auto",
              display: mode === "vote" ? "flex" : undefined,
              flexDirection: mode === "vote" ? "column" : undefined,
              alignItems: mode === "vote" ? "center" : undefined,
              minHeight: mode === "vote" ? "calc(100vh - 64px)" : undefined,
              transition: "max-width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          >
            {mode === "vote" ? (
              <VoteDeck initialItems={initialItems} />
            ) : (
              <UploadPanel onResultsChange={setUploadExpanded} />
            )}
          </div>
        </PageTransition>
      </section>
    </main>
  );
}
