import { requireCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function getWorkspace() {
  const user = await requireCurrentUser();

  return prisma.workspace.upsert({
    where: {
      userId: user.id,
    },
    update: {},
    create: {
      userId: user.id,
    },
  });
}
