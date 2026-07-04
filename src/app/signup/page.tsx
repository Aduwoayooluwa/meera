import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a private Meera workspace for memories, reflections, weekly reviews, and next moves.",
  alternates: {
    canonical: "/signup",
  },
};

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  return <AuthCard mode="signup" />;
}
