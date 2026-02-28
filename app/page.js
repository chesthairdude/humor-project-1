import { redirect } from "next/navigation";
import { createClient } from "../utils/supabase/server";

export const revalidate = 0;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  redirect(session ? "/vote" : "/auth");
}
