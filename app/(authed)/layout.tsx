import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/sidebar";
import { ChatBot } from "@/components/chat-bot";
import { EvalNotification } from "@/components/eval-notification";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-h-screen mr-0 md:mr-56">
        <div className="mx-auto max-w-4xl px-6 py-8 mt-14 md:mt-0">
          {children}
        </div>
      </main>
      <ChatBot />
      <EvalNotification />
    </div>
  );
}
