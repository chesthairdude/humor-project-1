"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { useTheme } from "../providers/ThemeProvider";

const SWIPE_DURATION_MS = 320;
const METER_TRANSITION = "width 0.75s cubic-bezier(0.34, 1.56, 0.64, 1)";
const SWIPE_THRESHOLD = 60;
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
  const dragRef = useRef({ dragging: false, startX: 0, currentX: 0, offset: 0 });
  const tiltRef = useRef({ x: 0, y: 0, mouseX: 50, mouseY: 50 });
  const cardRef = useRef(null);
  const overlayRef = useRef(null);
  const specularRef = useRef(null);
  const funnyStampRef = useRef(null);
  const nopeStampRef = useRef(null);

  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [funnyPercent, setFunnyPercent] = useState(50);
  const [sentiment, setSentiment] = useState(getSentimentCategory(50));
  const [sentimentVisible, setSentimentVisible] = useState(true);
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
    dragRef.current = { dragging: false, startX: 0, currentX: 0, offset: 0 };
    if (overlayRef.current) {
      overlayRef.current.style.background = "transparent";
    }
    if (funnyStampRef.current) {
      funnyStampRef.current.style.opacity = "0";
    }
    if (nopeStampRef.current) {
      nopeStampRef.current.style.opacity = "0";
    }
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
    function handleKeyDown(event) {
      if (
        event.target instanceof HTMLElement &&
        (event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA" ||
          event.target.isContentEditable)
      ) {
        return;
      }

      if (!current || isSubmittingRef.current) {
        return;
      }

      if (event.key === "ArrowRight") {
        submitVote(1, "right");
      }
      if (event.key === "ArrowLeft") {
        submitVote(-1, "left");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [current, isSubmitting]);

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
    dragRef.current.offset = 0;
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
      dragRef.current.offset = 0;
      setSwipeDirection(null);
      setError(err.message || "Failed to submit vote");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  function handleCardMouseMove(event) {
    if (dragRef.current.dragging) {
      return;
    }
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;

    tiltRef.current = {
      x: rotateX,
      y: rotateY,
      mouseX: (x / rect.width) * 100,
      mouseY: (y / rect.height) * 100,
    };

    if (cardRef.current) {
      cardRef.current.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    }

    if (specularRef.current) {
      specularRef.current.style.background = `radial-gradient(circle at ${tiltRef.current.mouseX}% ${tiltRef.current.mouseY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
    }
  }

  function handleCardMouseLeave() {
    if (dragRef.current.dragging) {
      return;
    }

    tiltRef.current = { x: 0, y: 0, mouseX: 50, mouseY: 50 };

    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.3s ease";
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    if (specularRef.current) {
      specularRef.current.style.background = "transparent";
    }
  }

  function handleMouseDown(event) {
    if (isSubmittingRef.current || swipeDirection) {
      return;
    }
    tiltRef.current = { x: 0, y: 0, mouseX: 50, mouseY: 50 };
    if (cardRef.current) {
      cardRef.current.style.transition = "none";
      cardRef.current.style.willChange = "transform";
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    if (specularRef.current) {
      specularRef.current.style.background = "transparent";
    }
    dragRef.current = { dragging: true, startX: event.clientX, currentX: event.clientX, offset: 0 };
  }

  function updateDragFeedback(offset) {
    if (!overlayRef.current || !funnyStampRef.current || !nopeStampRef.current) {
      return;
    }

    if (offset > 50) {
      overlayRef.current.style.background = `rgba(76, 222, 128, ${Math.min((offset - 50) / 150, 0.35)})`;
      funnyStampRef.current.style.opacity = String(Math.min((offset - 50) / 100, 1));
      nopeStampRef.current.style.opacity = "0";
      return;
    }

    if (offset < -50) {
      overlayRef.current.style.background = `rgba(255, 68, 88, ${Math.min((-offset - 50) / 150, 0.35)})`;
      nopeStampRef.current.style.opacity = String(Math.min((-offset - 50) / 100, 1));
      funnyStampRef.current.style.opacity = "0";
      return;
    }

    overlayRef.current.style.background = "transparent";
    funnyStampRef.current.style.opacity = "0";
    nopeStampRef.current.style.opacity = "0";
  }

  function setSwipeFeedback(direction) {
    if (!overlayRef.current || !funnyStampRef.current || !nopeStampRef.current) {
      return;
    }

    if (direction === "right") {
      overlayRef.current.style.background = "rgba(76, 222, 128, 0.25)";
      funnyStampRef.current.style.opacity = "1";
      nopeStampRef.current.style.opacity = "0";
      return;
    }

    if (direction === "left") {
      overlayRef.current.style.background = "rgba(255, 68, 88, 0.25)";
      nopeStampRef.current.style.opacity = "1";
      funnyStampRef.current.style.opacity = "0";
      return;
    }

    overlayRef.current.style.background = "transparent";
    funnyStampRef.current.style.opacity = "0";
    nopeStampRef.current.style.opacity = "0";
  }

  function handleWindowMouseMove(event) {
    if (!dragRef.current.dragging) {
      return;
    }
    dragRef.current.currentX = event.clientX;
    const offset = event.clientX - dragRef.current.startX;
    dragRef.current.offset = offset;
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${offset}px)`;
    }
    updateDragFeedback(offset);
  }

  function handleWindowMouseUp() {
    if (!dragRef.current.dragging) {
      return;
    }
    dragRef.current.dragging = false;

    const offset = dragRef.current.offset;

    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)";
      cardRef.current.style.willChange = "auto";
    }

    if (offset > SWIPE_THRESHOLD) {
      dragRef.current.offset = 0;
      submitVote(1, "right");
      return;
    }
    if (offset < -SWIPE_THRESHOLD) {
      dragRef.current.offset = 0;
      submitVote(-1, "left");
      return;
    }

    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    if (overlayRef.current) {
      overlayRef.current.style.background = "transparent";
    }
    if (funnyStampRef.current) {
      funnyStampRef.current.style.opacity = "0";
    }
    if (nopeStampRef.current) {
      nopeStampRef.current.style.opacity = "0";
    }
    dragRef.current.offset = 0;
  }

  function handleWindowMouseLeave() {
    if (!dragRef.current.dragging) {
      return;
    }
    dragRef.current.dragging = false;
    if (cardRef.current) {
      cardRef.current.style.transition = "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)";
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
      cardRef.current.style.willChange = "auto";
    }
    if (overlayRef.current) {
      overlayRef.current.style.background = "transparent";
    }
    if (funnyStampRef.current) {
      funnyStampRef.current.style.opacity = "0";
    }
    if (nopeStampRef.current) {
      nopeStampRef.current.style.opacity = "0";
    }
    dragRef.current.offset = 0;
  }

  function handleTouchStart(event) {
    if (isSubmittingRef.current || swipeDirection) {
      return;
    }
    const point = event.touches?.[0];
    if (!point) {
      return;
    }
    tiltRef.current = { x: 0, y: 0, mouseX: 50, mouseY: 50 };
    if (cardRef.current) {
      cardRef.current.style.transition = "none";
      cardRef.current.style.willChange = "transform";
      cardRef.current.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
    if (specularRef.current) {
      specularRef.current.style.background = "transparent";
    }
    dragRef.current = { dragging: true, startX: point.clientX, currentX: point.clientX, offset: 0 };
  }

  function handleTouchMove(event) {
    if (!dragRef.current.dragging) {
      return;
    }
    const point = event.touches?.[0];
    if (!point) {
      return;
    }
    dragRef.current.currentX = point.clientX;
    const offset = point.clientX - dragRef.current.startX;
    dragRef.current.offset = offset;
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${offset}px)`;
    }
    updateDragFeedback(offset);
  }

  function handleTouchEnd() {
    handleWindowMouseUp();
  }

  useEffect(() => {
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
    window.addEventListener("mouseleave", handleWindowMouseLeave);
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
      window.removeEventListener("mouseleave", handleWindowMouseLeave);
    };
  }, [current, isSubmitting, swipeDirection]);

  useEffect(() => {
    if (dragRef.current.dragging) {
      return;
    }
    setSwipeFeedback(swipeDirection);
  }, [swipeDirection]);

  return (
    <section
      className="mx-auto w-full max-w-[400px]"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      {initialItems.length === 0 ? (
        <div className="vote-card p-6 text-center" style={{ color: "var(--text-secondary)" }}>
          No captions available yet.
        </div>
      ) : !current ? (
        <div className="vote-card p-6 text-center" style={{ color: "#4CDE80" }}>
          You have voted on all available captions.
        </div>
      ) : (
        <>
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
            <article
              ref={cardRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="vote-card swipe-card relative overflow-hidden"
              style={{
                touchAction: "none",
                cursor: dragRef.current.dragging ? "grabbing" : "grab",
                userSelect: "none",
                opacity: swipeDirection ? 0 : undefined,
                transform:
                  swipeDirection === "left"
                    ? "translateX(-120%) rotate(-20deg)"
                    : swipeDirection === "right"
                      ? "translateX(120%) rotate(20deg)"
                      : undefined,
                transition: swipeDirection ? "transform 0.32s ease, opacity 0.32s ease" : undefined,
                transformStyle: "preserve-3d",
                width: "100%",
                flexShrink: 0,
              }}
            >
              <div
                ref={overlayRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "20px",
                  pointerEvents: "none",
                  zIndex: 9,
                  transition: "background 0.1s ease",
                  background: "transparent",
                }}
              />
              <div
                ref={specularRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "20px",
                  background: "transparent",
                  pointerEvents: "none",
                  zIndex: 10,
                }}
              />
              <div
                ref={funnyStampRef}
                style={{
                  position: "absolute",
                  top: "24px",
                  left: "24px",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "3px solid #4CDE80",
                  color: "#4CDE80",
                  fontSize: "22px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  transform: "rotate(-15deg)",
                  opacity: 0,
                  pointerEvents: "none",
                  zIndex: 11,
                }}
              >
                FUNNY
              </div>
              <div
                ref={nopeStampRef}
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "3px solid #FF4458",
                  color: "#FF4458",
                  fontSize: "22px",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  transform: "rotate(15deg)",
                  opacity: 0,
                  pointerEvents: "none",
                  zIndex: 11,
                }}
              >
                NOPE
              </div>
              <div className="w-full">
                {current.imageUrl ? (
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
                      alt="Caption candidate"
                      draggable="false"
                      onDragStart={(event) => event.preventDefault()}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        objectPosition: "center",
                        backgroundColor: "var(--card-bg)",
                        borderRadius: "20px 20px 0 0",
                        userSelect: "none",
                        WebkitUserDrag: "none",
                        pointerEvents: "none",
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
                <div style={{ padding: "24px 32px 32px" }} className="flex items-center justify-center">
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "18px",
                      fontWeight: 600,
                      lineHeight: 1.5,
                      color: "var(--text-primary)",
                      letterSpacing: "-0.01em",
                      maxWidth: "320px",
                      margin: "0 auto",
                    }}
                  >
                    {captionText || `Caption unavailable (${current.captionId})`}
                  </p>
                </div>
              </div>
            </article>

            <div style={{ marginTop: "20px", width: "100%", flexShrink: 0 }}>
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
                    color: hasVotes ? "#4CDE80" : "var(--text-tertiary)",
                    letterSpacing: "0.02em",
                    transition: "color 0.3s ease",
                  }}
                >
                  😂 {likeCount} funny
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: hasVotes ? "#FF4458" : "var(--text-tertiary)",
                    letterSpacing: "0.02em",
                    transition: "color 0.3s ease",
                  }}
                >
                  {dislikeCount} not funny 😐
                </span>
              </div>

              {!hasVotes ? (
                <div
                  style={{
                    height: "14px",
                    width: "100%",
                    borderRadius: "999px",
                    background: "var(--stats-bg)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid var(--glass-border)",
                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.6)",
                  }}
                />
              ) : (
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
                      width: `${funnyPercent}%`,
                      background: "#4CDE80",
                      borderRadius: "999px",
                      transition: METER_TRANSITION,
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
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 100%)",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

            <div
              style={{
                marginTop: "28px",
                marginBottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "60px",
                width: "100%",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => submitVote(-1, "left")}
                disabled={isSubmitting}
                aria-label="Dislike"
                style={{
                  flexShrink: 0,
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
                  flexShrink: 0,
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
          </div>

          <div style={{ height: "32px", flexShrink: 0 }} />
        </>
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
