"use client";

import { useState } from "react";

export default function HallOfFameCarousel({ items = [] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const [animating, setAnimating] = useState(false);

  const current = items[index];

  function navigate(dir) {
    if (animating) {
      return;
    }
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setIndex((i) => {
        if (dir === "right") {
          return i === items.length - 1 ? 0 : i + 1;
        }
        return i === 0 ? items.length - 1 : i - 1;
      });
      setDirection(null);
      setAnimating(false);
    }, 280);
  }

  if (!items.length) {
    return (
      <div
        style={{
          padding: "40px",
          borderRadius: "20px",
          background: "var(--glass-bg)",
          backdropFilter: "blur(32px)",
          border: "1px solid var(--glass-border)",
          textAlign: "center",
          color: "var(--text-secondary)",
          fontSize: "15px",
        }}
      >
        No captions have reached 70 votes yet. Keep voting! 🗳️
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "420px",
        height: "700px",
      }}
    >
      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, marginBottom: "12px" }}>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text-secondary)",
            letterSpacing: "0.04em",
          }}
        >
          #{current.rank} of {items.length}
        </span>
        {current.rank === 1 ? <span style={{ fontSize: "18px" }}>👑</span> : null}
      </div>

      <div
        style={{
          width: "100%",
          height: "520px",
          borderRadius: "20px",
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.10)",
          overflow: "hidden",
          flexShrink: 0,
          transform: animating
            ? direction === "right"
              ? "translateX(-40px)"
              : "translateX(40px)"
            : "translateX(0)",
          opacity: animating ? 0 : 1,
          transition: "transform 0.28s ease, opacity 0.28s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "340px",
            backgroundColor: "var(--card-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            flexShrink: 0,
            borderRadius: "20px 20px 0 0",
          }}
        >
          <img
            src={current.imageUrl}
            alt="Hall of fame"
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              objectPosition: "center",
              backgroundColor: "var(--card-bg)",
              borderRadius: "20px 20px 0 0",
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            height: "180px",
            padding: "16px 24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            overflow: "hidden",
          }}
        >
          <p
            style={{
              textAlign: "center",
              fontSize: "17px",
              fontWeight: 600,
              color: "var(--text-primary)",
              lineHeight: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              margin: 0,
            }}
          >
            {current.captionContent}
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "var(--stats-bg)",
              border: "1px solid var(--stats-border)",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#4CDE80" }}>{current.likes}</p>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Funny
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                {Math.round(current.ratio * 100)}%
              </p>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Funny Rate
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "18px", fontWeight: 700, color: "#FF4458" }}>{current.dislikes}</p>
              <p
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Not Funny
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "auto", display: "flex", gap: "20px", alignItems: "center", flexShrink: 0 }}>
        <button
          onClick={() => navigate("left")}
          disabled={animating}
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.6)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            cursor: animating ? "not-allowed" : "pointer",
            fontSize: "20px",
            color: "var(--text-primary)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            if (!animating) {
              e.currentTarget.style.transform = "scale(1.08)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          ←
        </button>

        <div style={{ display: "flex", gap: "6px" }}>
          {items.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === index ? "20px" : "6px",
                height: "6px",
                borderRadius: "999px",
                background: i === index ? "#6478ff" : "var(--dot-inactive)",
                transition: "all 0.3s ease",
                cursor: "pointer",
              }}
              onClick={() => {
                if (i !== index && !animating) {
                  setDirection(i > index ? "right" : "left");
                  setAnimating(true);
                  setTimeout(() => {
                    setIndex(i);
                    setDirection(null);
                    setAnimating(false);
                  }, 280);
                }
              }}
            />
          ))}
        </div>

        <button
          onClick={() => navigate("right")}
          disabled={animating}
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.6)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            cursor: animating ? "not-allowed" : "pointer",
            fontSize: "20px",
            color: "var(--text-primary)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            if (!animating) {
              e.currentTarget.style.transform = "scale(1.08)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}
