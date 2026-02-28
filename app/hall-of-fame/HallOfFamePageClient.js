"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import HallOfFameCarousel from "./HallOfFameCarousel";
import ThemeToggleButton from "../components/ThemeToggleButton";
import PageTransition from "../components/PageTransition";

let cachedHallOfFame = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

function LoadingSkeleton() {
  return (
    <main
      style={{
        marginLeft: "220px",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-gradient)",
      }}
    >
      <div
        style={{
          width: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "520px",
            borderRadius: "20px",
            background: "var(--glass-bg)",
            backdropFilter: "blur(32px)",
            WebkitBackdropFilter: "blur(32px)",
            border: "1px solid var(--glass-border)",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        />
        <div style={{ display: "flex", gap: "6px" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--dot-inactive)",
                animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function HallOfFamePageClient({ userEmail = "" }) {
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;

    async function loadHallOfFame() {
      const now = Date.now();
      if (cachedHallOfFame && now - cacheTimestamp < CACHE_TTL) {
        setItems(cachedHallOfFame);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: votes } = await supabase
        .from("caption_votes")
        .select("caption_id, vote_value")
        .not("caption_id", "is", null);

      if (!active) {
        return;
      }

      const tally = {};
      for (const vote of votes ?? []) {
        if (!vote?.caption_id) {
          continue;
        }
        if (!tally[vote.caption_id]) {
          tally[vote.caption_id] = { likes: 0, dislikes: 0 };
        }
        if (vote.vote_value === 1) {
          tally[vote.caption_id].likes += 1;
        }
        if (vote.vote_value === -1) {
          tally[vote.caption_id].dislikes += 1;
        }
      }

      const voteTotals = Object.values(tally).map((counts) => counts.likes + counts.dislikes);
      const avgVotes =
        voteTotals.length > 0
          ? voteTotals.reduce((sum, total) => sum + total, 0) / voteTotals.length
          : 0;

      const qualified = Object.entries(tally)
        .map(([captionId, counts]) => ({
          captionId,
          likes: counts.likes,
          dislikes: counts.dislikes,
          total: counts.likes + counts.dislikes,
          ratio: counts.likes / (counts.likes + counts.dislikes),
        }))
        .filter((entry) => entry.total >= avgVotes)
        .sort((a, b) => b.ratio - a.ratio || b.total - a.total)
        .slice(0, 20);

      const qualifiedIds = qualified.map((item) => item.captionId);
      let ranked = [];

      if (qualifiedIds.length > 0) {
        const { data: captions } = await supabase
          .from("captions")
          .select("id, content, image:images!inner(url)")
          .in("id", qualifiedIds);

        if (!active) {
          return;
        }

        const captionMap = new Map(
          (captions ?? []).map((caption) => {
            const image = Array.isArray(caption.image) ? caption.image[0] : caption.image;
            return [
              caption.id,
              {
                captionContent: caption.content ?? "",
                imageUrl: image?.url ?? "",
              },
            ];
          })
        );

        ranked = qualified
          .map((entry, index) => {
            const match = captionMap.get(entry.captionId);
            if (!match?.captionContent || !match?.imageUrl) {
              return null;
            }
            return {
              ...entry,
              ...match,
              rank: index + 1,
            };
          })
          .filter(Boolean);
      }

      if (!active) {
        return;
      }

      cachedHallOfFame = ranked;
      cacheTimestamp = Date.now();

      setItems(ranked);
      setLoading(false);
    }

    loadHallOfFame();

    return () => {
      active = false;
    };
  }, [supabase]);

  if (loading) {
    return <LoadingSkeleton />;
  }

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
            {userEmail}
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

        <div
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
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-primary)",
            textAlign: "left",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "18px" }}>🏆</span>
          <span>Hall of Fame</span>
        </div>

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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 32px",
          background: "var(--bg-gradient)",
          fontFamily: "var(--font-geist-sans)",
        }}
      >
        <PageTransition>
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minHeight: "calc(100vh - 80px)",
            }}
          >
            <div style={{ marginBottom: "10px", textAlign: "center" }}>
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                }}
              >
                The Funniest of All Time
              </h1>
            </div>
            <HallOfFameCarousel items={items} />
          </div>
        </PageTransition>
      </main>
    </>
  );
}
