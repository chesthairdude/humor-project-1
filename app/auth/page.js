import { redirect } from "next/navigation";
import { createClient } from "../../utils/supabase/server";
import AuthForm from "./AuthForm";

export const revalidate = 0;

export default async function AuthPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    redirect("/vote");
  }

  return <AuthForm />;
}
