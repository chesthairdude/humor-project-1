"use client";

import { useState } from "react";
import VoteDeck from "./VoteDeck";
import UploadPanel from "./UploadPanel";

export default function VoteWorkspace({ initialItems = [], userEmail = "" }) {
  const [mode, setMode] = useState("vote");

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
          backdropFilter: "blur(32px) saturate(200%)",
          WebkitBackdropFilter: "blur(32px) saturate(200%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: "inset 1px 0 0 rgba(255,255,255,0.7), 4px 0 32px rgba(0,0,0,0.05)",
          zIndex: 40,
        }}
      >
        <div style={{ marginBottom: "24px", paddingLeft: "8px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.03em", color: "#111" }}>
            FunnyOrNot
          </h1>
          {userEmail ? (
            <p style={{ fontSize: "11px", color: "#999", marginTop: "2px", letterSpacing: "0.02em" }}>
              {userEmail}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => setMode("vote")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.5)",
            backgroundColor: mode === "vote" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow:
              mode === "vote" ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "#222",
            transition: "all 0.18s ease",
            textAlign: "left",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.65)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              mode === "vote" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)";
            e.currentTarget.style.boxShadow =
              mode === "vote" ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <span style={{ fontSize: "18px" }}>🗳️</span>
          <span>Voting</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("upload")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.5)",
            backgroundColor: mode === "upload" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow:
              mode === "upload" ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
            color: "#222",
            transition: "all 0.18s ease",
            textAlign: "left",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.65)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor =
              mode === "upload" ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.35)";
            e.currentTarget.style.boxShadow =
              mode === "upload" ? "0 4px 16px rgba(0,0,0,0.10)" : "0 1px 4px rgba(0,0,0,0.06)";
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
              border: "1px solid rgba(255,255,255,0.5)",
              backgroundColor: "rgba(255,255,255,0.35)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
              color: "#222",
              transition: "all 0.18s ease",
              textAlign: "left",
              width: "100%",
              marginTop: "8px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.65)";
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.10)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.35)";
              e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={{ fontSize: "18px" }}>↩</span>
            <span>Sign Out</span>
          </button>
        </form>
      </aside>

      <section
        style={{
          marginLeft: "220px",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}>
          {mode === "vote" ? <VoteDeck initialItems={initialItems} /> : <UploadPanel />}
        </div>
      </section>
    </main>
  );
}
