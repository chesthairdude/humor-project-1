"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";

const SWIPE_DURATION_MS = 320;
const METER_TRANSITION = "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";

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
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(initialItems);
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
  const [meterAnimated, setMeterAnimated] = useState(false);
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

  useEffect(() => {
    setSwipeDirection(null);
  }, [current?.captionId]);

  useEffect(() => {
    let active = true;

    async function loadVoteBreakdown() {
      if (!current?.captionId) {
        return;
      }

      setMeterAnimated(false);
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

      requestAnimationFrame(() => {
        if (!active) {
          return;
        }
        setMeterAnimated(true);
        requestAnimationFrame(() => {
          if (!active) {
            return;
          }
          setFunnyPercent(percent);
        });
      });
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
    <section className="mx-auto w-full max-w-[400px]">
      {initialItems.length === 0 ? (
        <div className="vote-card p-6 text-center text-slate-700">
          No captions available yet.
        </div>
      ) : !current ? (
        <div className="vote-card p-6 text-center text-emerald-700">
          You have voted on all available captions.
        </div>
      ) : (
        <>
          <article
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="vote-card relative overflow-hidden"
            style={{
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
              <div className="h-[480px] w-full">
              {current.imageUrl ? (
                <img
                  src={current.imageUrl}
                  alt="Caption candidate"
                  className="h-[60%] w-full rounded-t-[20px] object-cover"
                />
              ) : (
                <div className="flex h-[60%] w-full items-center justify-center rounded-t-[20px] bg-slate-100 text-sm text-slate-500">
                  Missing image
                </div>
              )}
                <div className="flex h-[40%] items-center justify-center px-6 pb-6 pt-6">
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "18px",
                      fontWeight: 600,
                      lineHeight: 1.5,
                      color: "#1a1a1a",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {captionText || `Caption unavailable (${current.captionId})`}
                  </p>
                </div>
              </div>
            </article>

          <div style={{ marginTop: "12px", marginBottom: "4px", width: "100%", minHeight: "12px" }}>
            <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide leading-none">
              <span className="text-[#4CDE80]">😂 {likeCount} funny</span>
              <span className="text-[#FF4458]">{dislikeCount} not funny 💀</span>
            </div>
            <div
              style={{
                position: "relative",
                height: "12px",
                width: "100%",
                borderRadius: "999px",
                backgroundColor: "#FF4458",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "#4CDE80",
                  borderRadius: "999px",
                  width: `${funnyPercent}%`,
                  transition: meterAnimated ? METER_TRANSITION : "none",
                }}
              />
            </div>
            <p
              className={`mt-2 text-center text-sm font-bold text-slate-700 transition-all duration-150 ${
                sentimentVisible ? "scale-100 opacity-100" : "scale-[0.85] opacity-0"
              }`}
            >
              {sentiment.label}
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-[60px]">
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
                backgroundColor: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                fontSize: "28px",
                color: "#FF4458",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 16px rgba(255,68,88,0.2)",
                opacity: isSubmitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FF4458";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.transform = "scale(1.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.7)";
                e.currentTarget.style.color = "#FF4458";
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
                backgroundColor: "rgba(255,255,255,0.7)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                fontSize: "28px",
                color: "#4CDE80",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 16px rgba(76,222,128,0.2)",
                opacity: isSubmitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#4CDE80";
                e.currentTarget.style.color = "#fff";
                e.currentTarget.style.transform = "scale(1.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.7)";
                e.currentTarget.style.color = "#4CDE80";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              ✓
            </button>
          </div>
        </>
      )}

      {error ? (
        <p className="mt-4 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
