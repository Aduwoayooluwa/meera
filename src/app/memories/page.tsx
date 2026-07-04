import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { getCurrentUser } from "@/lib/auth/session";

export default async function MemoriesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user} view="memories" />;
}
