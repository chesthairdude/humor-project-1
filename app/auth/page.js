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

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e8eeff 0%, #f5f5ff 40%, #ffe8f5 100%)",
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      <AuthForm />
    </main>
  );
}
