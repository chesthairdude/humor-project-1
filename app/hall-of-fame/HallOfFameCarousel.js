"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    function handleKeyDown(event) {
      if (
        event.target instanceof HTMLElement &&
        (event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA" ||
          event.target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "ArrowRight") {
        navigate("right");
      }
      if (event.key === "ArrowLeft") {
        navigate("left");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [animating, items.length]);

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
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <div style={{ flex: 1, minHeight: "32px", maxHeight: "120px" }} />

      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            borderRadius: "20px",
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.10)",
            overflow: "hidden",
            transform: animating
              ? direction === "right"
                ? "translateX(-40px)"
                : "translateX(40px)"
              : "translateX(0)",
            opacity: animating ? 0 : 1,
            transition: "transform 0.28s ease, opacity 0.28s ease",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              maxHeight: "420px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              borderRadius: "20px 20px 0 0",
              backgroundColor: "var(--card-bg)",
            }}
          >
            <img
              src={current.imageUrl}
              alt="Hall of fame"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
                backgroundColor: "var(--card-bg)",
                borderRadius: "20px 20px 0 0",
                display: "block",
              }}
            />
          </div>
          <div style={{ padding: "20px 24px 24px" }}>
            <p
              style={{
                textAlign: "center",
                fontSize: "17px",
                fontWeight: 600,
                color: "var(--text-primary)",
                lineHeight: 1.5,
                marginBottom: 0,
              }}
            >
              {current.captionContent}
            </p>
          </div>
        </div>

        <div style={{ marginTop: "4px", width: "100%", flexShrink: 0 }}>
          <div
            style={{
              marginBottom: "8px",
              width: "100%",
              padding: "0 4px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
                padding: "0 2px",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#4CDE80",
                  letterSpacing: "0.02em",
                }}
              >
                😂 {current.likes} funny
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#FF4458",
                  letterSpacing: "0.02em",
                }}
              >
                {current.dislikes} not funny 😐
              </span>
            </div>
            <div
              style={{
                position: "relative",
                height: "14px",
                width: "100%",
                borderRadius: "999px",
                background: "rgba(255, 68, 88, 0.45)",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                border: "1px solid var(--glass-border)",
                boxShadow:
                  "inset 0 1px 3px rgba(0, 0, 0, 0.10), inset 0 -1px 0 rgba(255,255,255,0.4), 0 2px 8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0,0,0,0.04)",
                overflow: "hidden",
              }}
            >
              <div
                className="laugh-meter-fill"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${Math.round(current.ratio * 100)}%`,
                  background: "#4CDE80",
                  borderRadius: "999px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "1px",
                  left: "6px",
                  right: "6px",
                  height: "4px",
                  borderRadius: "999px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            </div>
            <p
              style={{
                marginTop: "8px",
                textAlign: "center",
                fontSize: "11px",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {Math.round(current.ratio * 100)}% funny rate
            </p>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            marginTop: "24px",
            marginBottom: 0,
            display: "flex",
            gap: "20px",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => navigate("left")}
            disabled={animating}
            style={{
              flexShrink: 0,
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
              flexShrink: 0,
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

      <div style={{ height: "32px", flexShrink: 0 }} />
    </div>
  );
}
