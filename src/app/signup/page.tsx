import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return <AuthCard mode="signup" />;
}
