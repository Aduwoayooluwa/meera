import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { isDatabaseUnavailableError } from "@/lib/prisma-errors";
import type { UserSummary } from "@/lib/types";

const SESSION_COOKIE = "mm-session";
const SESSION_DAYS = 30;
const WORKSPACE_COOKIE = "workspace-id";

const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

function toUserSummary(user: {
  id: string;
  name: string | null;
  email: string;
}): UserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  try {
    const session = await prisma.authSession.findUnique({
      where: {
        tokenHash: hashSessionToken(token),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!session || session.expiresAt <= new Date()) {
      return null;
    }

    return toUserSummary(session.user);
  } catch (error) {
    if (isDatabaseUnavailableError(error)) {
      return null;
    }

    throw error;
  }
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Please sign in to use Memory Mirror.");
  }

  return user;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.authSession.create({
    data: {
      tokenHash: hashSessionToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    ...sessionCookieOptions,
    expires: expiresAt,
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.authSession.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function claimWorkspaceForUser(userId: string) {
  const cookieStore = await cookies();
  const anonymousWorkspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value;
  const existingWorkspace = await prisma.workspace.findUnique({
    where: {
      userId,
    },
    select: {
      id: true,
    },
  });

  if (existingWorkspace) {
    cookieStore.delete(WORKSPACE_COOKIE);
    return;
  }

  if (anonymousWorkspaceId) {
    const claimed = await prisma.workspace.updateMany({
      where: {
        id: anonymousWorkspaceId,
        userId: null,
      },
      data: {
        userId,
      },
    });

    if (claimed.count > 0) {
      cookieStore.delete(WORKSPACE_COOKIE);
      return;
    }
  }

  await prisma.workspace.upsert({
    where: {
      userId,
    },
    update: {},
    create: {
      userId,
    },
  });
}
