import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";
import MyStatsView from "./MyStatsView";

export const revalidate = 0;

export default async function MyStatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: myVotes } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value")
    .eq("profile_id", user.id);

  const { data: allVotes } = await supabase
    .from("caption_votes")
    .select("caption_id, vote_value");

  const totalRated = myVotes?.length ?? 0;
  const upvotes = myVotes?.filter((vote) => vote.vote_value === 1).length ?? 0;
  const downvotes = myVotes?.filter((vote) => vote.vote_value === -1).length ?? 0;

  const votesByCaption = {};
  for (const vote of allVotes ?? []) {
    if (!vote?.caption_id) {
      continue;
    }
    if (!votesByCaption[vote.caption_id]) {
      votesByCaption[vote.caption_id] = { likes: 0, dislikes: 0 };
    }
    if (vote.vote_value === 1) {
      votesByCaption[vote.caption_id].likes += 1;
    }
    if (vote.vote_value === -1) {
      votesByCaption[vote.caption_id].dislikes += 1;
    }
  }

  let agreedWithConsensus = 0;
  let validConsensusVotes = 0;

  for (const myVote of myVotes ?? []) {
    const tally = votesByCaption[myVote.caption_id];
    if (!tally || tally.likes === tally.dislikes) {
      continue;
    }
    validConsensusVotes += 1;
    const majorityVote = tally.likes > tally.dislikes ? 1 : -1;
    if (myVote.vote_value === majorityVote) {
      agreedWithConsensus += 1;
    }
  }

  const consensusPercent =
    validConsensusVotes > 0 ? Math.round((agreedWithConsensus / validConsensusVotes) * 100) : null;

  return (
    <MyStatsView
      totalRated={totalRated}
      upvotes={upvotes}
      downvotes={downvotes}
      consensusPercent={consensusPercent}
      validConsensusVotes={validConsensusVotes}
      email={user.email ?? ""}
    />
  );
}
