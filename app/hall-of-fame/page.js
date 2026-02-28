import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";
import HallOfFameCarousel from "./HallOfFameCarousel";
import ThemeToggleButton from "../components/ThemeToggleButton";

export const revalidate = 0;

export default async function HallOfFamePage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  const { data: votes } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value")
    .not("caption_id", "is", null);

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
  const averageVotesPerImage =
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
    .filter((entry) => entry.total >= averageVotesPerImage)
    .sort((a, b) => b.ratio - a.ratio || b.total - a.total)
    .slice(0, 20);

  const qualifiedIds = qualified.map((item) => item.captionId);
  let ranked = [];

  if (qualifiedIds.length > 0) {
    const { data: captions } = await supabase
      .from("captions")
      .select("id, content, image:images!inner(url)")
      .in("id", qualifiedIds);

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
            {session.user.email ?? ""}
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
          href="/vote?mode=upload"
          className="sidebar-nav-item"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 14px",
            borderRadius: "12px",
            border: "1px solid var(--glass-border)",
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
        <div style={{ marginBottom: "36px", textAlign: "center" }}>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-tertiary)",
              marginBottom: "8px",
            }}
          >
            Hall of Fame
          </p>
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
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "8px" }}>
            Top 20 by community vote · minimum avg votes/image ({averageVotesPerImage.toFixed(1)})
          </p>
        </div>
        <HallOfFameCarousel items={ranked} />
      </main>
    </>
  );
}
