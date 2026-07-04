import {
  claimWorkspaceForUser,
  createSession,
  deleteCurrentSession,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import type { AuthInput, SignupInput } from "@/lib/validators";

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function registerUser(input: SignupInput) {
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: {
        id: true,
      },
    });

    await claimWorkspaceForUser(user.id);
    await createSession(user.id);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new Error("An account already exists for that email.");
    }

    throw error;
  }
}

export async function authenticateUser(input: AuthInput) {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email,
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw new Error("Email or password is incorrect.");
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new Error("Email or password is incorrect.");
  }

  await claimWorkspaceForUser(user.id);
  await createSession(user.id);
}

export async function signOutUser() {
  await deleteCurrentSession();
}
