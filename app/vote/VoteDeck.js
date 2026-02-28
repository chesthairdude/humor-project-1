"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { useTheme } from "../providers/ThemeProvider";

const SWIPE_DURATION_MS = 320;
const METER_TRANSITION = "width 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)";
let cachedVoteItems = null;

export function setCachedVoteItems(items) {
  cachedVoteItems = items;
}

function getSentimentCategory(funnyPercent) {
  if (funnyPercent >= 75) {
    return { key: "hilarious", label: "🔥 Hilarious" };
  }
  if (funnyPercent >= 50) {
    return { key: "pretty-funny", label: "😄 Pretty Funny" };
  }
  if (funnyPercent >= 25) {
    return { key: "meh", label: "😐 Meh" };
  }
  return { key: "not-it", label: "💀 Not It" };
}

function calculateFunnyPercent(likeCount, dislikeCount) {
  const total = likeCount + dislikeCount;
  if (total === 0) {
    return 50;
  }
  return (likeCount / total) * 100;
}

export default function VoteDeck({ initialItems = [] }) {
  const { isDark } = useTheme();
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(() => cachedVoteItems ?? initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [swipeDirection, setSwipeDirection] = useState(null);
  const isSubmittingRef = useRef(false);
  const sentimentTimerRef = useRef(null);
  const likeCountRef = useRef(0);
  const dislikeCountRef = useRef(0);

  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [funnyPercent, setFunnyPercent] = useState(50);
  const [sentiment, setSentiment] = useState(getSentimentCategory(50));
  const [sentimentVisible, setSentimentVisible] = useState(true);
  const [mouseX, setMouseX] = useState(50);
  const [mouseY, setMouseY] = useState(50);
  const [tiltX, setTiltX] = useState(0);
  const [tiltY, setTiltY] = useState(0);

  const current = useMemo(() => items[0] ?? null, [items]);
  const rawCaptionText =
    current?.captionContent === null || current?.captionContent === undefined
      ? ""
      : String(current.captionContent);
  const captionText = rawCaptionText.trim();
  const hasVotes = likeCount + dislikeCount > 0;

  useEffect(() => {
    cachedVoteItems = items;
  }, [items]);

  useEffect(() => {
    setSwipeDirection(null);
  }, [current?.captionId]);

  useEffect(() => {
    let active = true;

    async function loadVoteBreakdown() {
      if (!current?.captionId) {
        return;
      }

      setFunnyPercent(50);
      likeCountRef.current = 0;
      dislikeCountRef.current = 0;
      setLikeCount(0);
      setDislikeCount(0);

      const { data, error: votesError } = await supabase
        .from("caption_votes")
        .select("vote_value")
        .eq("caption_id", current.captionId);

      if (!active || votesError) {
        return;
      }

      const likes = (data ?? []).filter((vote) => vote.vote_value === 1).length;
      const dislikes = (data ?? []).filter((vote) => vote.vote_value === -1).length;

      const percent = calculateFunnyPercent(likes, dislikes);

      likeCountRef.current = likes;
      dislikeCountRef.current = dislikes;
      setLikeCount(likes);
      setDislikeCount(dislikes);
      setFunnyPercent(percent);
    }

    loadVoteBreakdown();

    return () => {
      active = false;
    };
  }, [current?.captionId, supabase]);

  useEffect(() => {
    const nextSentiment = getSentimentCategory(funnyPercent);
    if (nextSentiment.key === sentiment.key) {
      return;
    }

    setSentimentVisible(false);
    if (sentimentTimerRef.current) {
      clearTimeout(sentimentTimerRef.current);
    }

    sentimentTimerRef.current = setTimeout(() => {
      setSentiment(nextSentiment);
      setSentimentVisible(true);
    }, 150);
  }, [funnyPercent, sentiment.key]);

  useEffect(() => {
    return () => {
      if (sentimentTimerRef.current) {
        clearTimeout(sentimentTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!current?.captionId) {
      return;
    }

    const channel = supabase
      .channel(`caption-votes-${current.captionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "caption_votes",
          filter: `caption_id=eq.${current.captionId}`,
        },
        (payload) => {
          const voteValue = payload.new?.vote_value;
          if (voteValue === 1) {
            setLikeCount((count) => {
              const newLikes = count + 1;
              likeCountRef.current = newLikes;
              setFunnyPercent(calculateFunnyPercent(newLikes, dislikeCountRef.current));
              return newLikes;
            });
          } else if (voteValue === -1) {
            setDislikeCount((count) => {
              const newDislikes = count + 1;
              dislikeCountRef.current = newDislikes;
              setFunnyPercent(calculateFunnyPercent(likeCountRef.current, newDislikes));
              return newDislikes;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [current?.captionId, supabase]);

  async function submitVote(voteValue, direction) {
    if (!current || isSubmittingRef.current) {
      return;
    }

    if (!current.captionId || typeof current.captionId !== "string") {
      setItems((previous) => previous.slice(1));
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError("");
    setSwipeDirection(direction);

    try {
      await new Promise((resolve) => {
        setTimeout(resolve, SWIPE_DURATION_MS);
      });

      const response = await fetch("/api/caption-votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          captionId: current.captionId,
          voteValue,
        }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok) {
        if (
          response.status === 409 &&
          typeof result?.error === "string" &&
          result.error.toLowerCase().includes("already voted")
        ) {
          setItems((previous) => previous.slice(1));
          return;
        }

        if (response.status === 400 || response.status === 404) {
          setItems((previous) => previous.slice(1));
          return;
        }

        setSwipeDirection(null);
        throw new Error(result?.error || "Failed to submit vote");
      }

      setItems((previous) => previous.slice(1));
    } catch (err) {
      setSwipeDirection(null);
      setError(err.message || "Failed to submit vote");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleMouseMove(event) {
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    setTiltX(rotateX);
    setTiltY(rotateY);
    setMouseX((x / rect.width) * 100);
    setMouseY((y / rect.height) * 100);
  }

  function handleMouseLeave() {
    setTiltX(0);
    setTiltY(0);
    setMouseX(50);
    setMouseY(50);
  }

  return (
    <section className="mx-auto w-full max-w-[420px]">
      {initialItems.length === 0 ? (
        <div className="vote-card p-6 text-center" style={{ color: "var(--text-secondary)" }}>
          No captions available yet.
        </div>
      ) : !current ? (
        <div className="vote-card p-6 text-center" style={{ color: "#4CDE80" }}>
          You have voted on all available captions.
        </div>
      ) : (
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            maxWidth: "420px",
            height: "100vh",
            paddingTop: "32px",
            paddingBottom: "32px",
            boxSizing: "border-box",
          }}
        >
          <div style={{ flex: 1, minHeight: 0 }} />

          <article
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="vote-card swipe-card relative overflow-hidden"
            style={{
              width: "100%",
              flexShrink: 0,
              opacity: swipeDirection ? 0 : 1,
              transform:
                swipeDirection === "left"
                  ? "translateX(-120%)"
                  : swipeDirection === "right"
                    ? "translateX(120%)"
                    : `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)`,
              transition: swipeDirection
                ? "transform 0.3s ease-out, opacity 0.3s ease-out"
                : "transform 0.15s ease, opacity 0.15s ease",
              transformStyle: "preserve-3d",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "20px",
                background: `radial-gradient(circle at ${mouseX}% ${mouseY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
                pointerEvents: "none",
                zIndex: 10,
              }}
            />
            <div className="w-full">
              {current.imageUrl ? (
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "var(--card-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={current.imageUrl}
                    alt="Caption candidate"
                    style={{
                      width: "100%",
                      height: "auto",
                      objectFit: "contain",
                      display: "block",
                      borderRadius: "20px 20px 0 0",
                    }}
                  />
                </div>
              ) : (
                <div
                  className="flex w-full items-center justify-center rounded-t-[20px] text-sm"
                  style={{
                    minHeight: "320px",
                    background: "var(--stats-bg)",
                    color: "var(--text-secondary)",
                  }}
                >
                  Missing image
                </div>
              )}
              <div
                style={{
                  padding: "20px 32px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <p
                  style={{
                    textAlign: "center",
                    fontSize: "17px",
                    fontWeight: 600,
                    lineHeight: 1.5,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  {captionText || `Caption unavailable (${current.captionId})`}
                </p>
              </div>
            </div>
          </article>

          <div
            style={{
              flexShrink: 0,
              width: "100%",
              paddingTop: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: hasVotes ? "#4CDE80" : "#aaa" }}>
                😂 {likeCount} funny
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: hasVotes ? "#FF4458" : "#aaa" }}>
                {dislikeCount} not funny 😐
              </span>
            </div>

            <div
              style={{
                position: "relative",
                height: "14px",
                width: "100%",
                borderRadius: "999px",
                background: hasVotes ? "rgba(255,255,255,0.18)" : "rgba(180,180,190,0.25)",
                backdropFilter: "blur(16px) saturate(180%)",
                WebkitBackdropFilter: "blur(16px) saturate(180%)",
                border: "1px solid rgba(255,255,255,0.55)",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.08)",
                overflow: "hidden",
              }}
            >
              {hasVotes ? (
                <div
                  className="laugh-meter-fill"
                  style={{
                    height: "100%",
                    width: `${funnyPercent}%`,
                    background:
                      "linear-gradient(90deg, #4CDE80 0%, #a8ff78 35%, #ffdd57 60%, #FF6B6B 85%, #FF4458 100%)",
                    backgroundSize: "400px 100%",
                    borderRadius: "999px",
                    transition: METER_TRANSITION,
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  top: "1px",
                  left: "6px",
                  right: "6px",
                  height: "4px",
                  borderRadius: "999px",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, transparent 100%)",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            </div>

            <p
              style={{
                marginTop: "8px",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: 600,
                color: hasVotes ? "var(--text-primary)" : "#bbb",
                opacity: sentimentVisible ? 1 : 0,
                transform: sentimentVisible ? "scale(1)" : "scale(0.88)",
                transition: "opacity 0.2s ease, transform 0.2s ease",
              }}
            >
              {hasVotes ? sentiment.label : "— no votes yet —"}
            </p>
          </div>

          <div
            style={{
              flexShrink: 0,
              paddingTop: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "60px",
              width: "100%",
            }}
          >
            <button
              type="button"
              onClick={() => submitVote(-1, "left")}
              disabled={isSubmitting}
              aria-label="Dislike"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "2.5px solid #FF4458",
                backgroundColor: isDark ? "#FF4458" : "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                fontSize: "28px",
                color: isDark ? "#fff" : "#FF4458",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 16px rgba(255,68,88,0.2)",
                opacity: isSubmitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.18)" : "#FF4458";
                e.currentTarget.style.color = isDark ? "#FF4458" : "#fff";
                e.currentTarget.style.transform = "scale(1.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#FF4458" : "rgba(255,255,255,0.7)";
                e.currentTarget.style.color = isDark ? "#fff" : "#FF4458";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ✕
            </button>
            <button
              type="button"
              onClick={() => submitVote(1, "right")}
              disabled={isSubmitting}
              aria-label="Like"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "2.5px solid #4CDE80",
                backgroundColor: isDark ? "#4CDE80" : "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                fontSize: "28px",
                color: isDark ? "#fff" : "#4CDE80",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 16px rgba(76,222,128,0.2)",
                opacity: isSubmitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "rgba(255,255,255,0.18)" : "#4CDE80";
                e.currentTarget.style.color = isDark ? "#4CDE80" : "#fff";
                e.currentTarget.style.transform = "scale(1.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isDark ? "#4CDE80" : "rgba(255,255,255,0.7)";
                e.currentTarget.style.color = isDark ? "#fff" : "#4CDE80";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ✓
            </button>
          </div>
        </section>
      )}

      {error ? (
        <p
          className="mt-4 rounded-xl px-4 py-3 text-sm"
          style={{
            border: "1px solid rgba(255,68,88,0.35)",
            background: "rgba(255,68,88,0.08)",
            color: "#FF4458",
          }}
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
