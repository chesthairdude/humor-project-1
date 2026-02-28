import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";
import VoteWorkspace from "./VoteWorkspace";

export const revalidate = 0;

function shuffleItems(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default async function VotePage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  const { data: existingVotes } = await supabase
    .from("caption_votes")
    .select("caption_id")
    .eq("profile_id", session.user.id);

  const votedCaptionIds = (existingVotes ?? [])
    .map((vote) => vote.caption_id)
    .filter(Boolean);

  let captionsQuery = supabase
    .from("captions")
    .select("id, caption_content:content, image:images!inner(id, url)")
    .not("content", "is", null)
    .not("content", "eq", "")
    .not("images.url", "is", null)
    .not("images.url", "eq", "")
    .order("created_datetime_utc", { ascending: false });

  if (votedCaptionIds.length > 0) {
    const escapedIds = votedCaptionIds.map((id) => `"${id}"`).join(",");
    captionsQuery = captionsQuery.not("id", "in", `(${escapedIds})`);
  }

  const { data: captions } = await captionsQuery;

  const mappedItems = (captions ?? [])
    .map((caption) => {
      const image = Array.isArray(caption.image) ? caption.image[0] : caption.image;
      return {
        captionId: caption.id,
        captionContent: caption.caption_content,
        imageId: image?.id ?? null,
        imageUrl: image?.url ?? null,
      };
    })
    .filter(
      (item) =>
        item.captionContent !== null &&
        item.captionContent !== undefined &&
        String(item.captionContent).trim() !== "" &&
        item.imageId !== null &&
        item.imageId !== undefined &&
        item.imageUrl !== null &&
        item.imageUrl !== undefined &&
        String(item.imageUrl).trim() !== ""
    );

  const items = shuffleItems(mappedItems);
  const mode = resolvedSearchParams?.mode === "upload" ? "upload" : "vote";

  return (
    <VoteWorkspace
      initialItems={items}
      userEmail={session.user.email ?? ""}
      initialMode={mode}
    />
  );
}
