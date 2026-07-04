import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { authenticateUser } from "@/lib/auth/operations";
import { isDatabaseUnavailableError } from "@/lib/prisma-errors";
import { authInputSchema } from "@/lib/validators";

function messageFor(error: unknown) {
  if (isDatabaseUnavailableError(error)) {
    return "Memory Mirror could not reach the database. Try again in a moment.";
  }

  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Check your login details.";
  }

  return error instanceof Error ? error.message : "Login failed.";
}

export async function POST(request: Request) {
  try {
    const parsed = authInputSchema.parse(await request.json());
    await authenticateUser(parsed);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: messageFor(error),
      },
      {
        status: isDatabaseUnavailableError(error) ? 503 : 400,
      },
    );
  }
}
