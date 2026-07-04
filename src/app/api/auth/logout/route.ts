import { NextResponse } from "next/server";

import { signOutUser } from "@/lib/auth/operations";
import { isDatabaseUnavailableError } from "@/lib/prisma-errors";

export async function POST() {
  try {
    await signOutUser();
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return NextResponse.json(
        {
          error:
            "Memory Mirror could not reach the database. Try again in a moment.",
        },
        {
          status: 503,
        },
      );
    }

    throw error;
  }

  return NextResponse.json({ ok: true });
}
