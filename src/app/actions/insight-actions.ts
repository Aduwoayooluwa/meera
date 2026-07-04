"use server";

import { revalidatePath } from "next/cache";

import { buildPatternEngineSnapshot } from "@/lib/insights/pattern-engine";
import { prisma } from "@/lib/prisma";
import type { PatternEngineSnapshot } from "@/lib/types";
import {
  insightReactionInputSchema,
  type InsightReactionInput,
} from "@/lib/validators";
import { getWorkspace } from "@/lib/workspace/get-workspace";

export async function getPatternEngineSnapshot(): Promise<PatternEngineSnapshot> {
  const workspace = await getWorkspace();
  const [sources, reactions] = await Promise.all([
    prisma.memorySource.findMany({
      where: {
        workspaceId: workspace.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 40,
      include: {
        chunks: {
          select: {
            id: true,
            content: true,
          },
          orderBy: {
            chunkIndex: "asc",
          },
        },
      },
    }),
    prisma.insightReaction.findMany({
      where: {
        workspaceId: workspace.id,
      },
    }),
  ]);

  return buildPatternEngineSnapshot({
    sources,
    reactions,
  });
}

export async function updateInsightReaction(input: InsightReactionInput) {
  const workspace = await getWorkspace();
  const parsed = insightReactionInputSchema.parse(input);
  const data: {
    pinned?: boolean;
    feedback?: string | null;
  } = {};

  if (typeof parsed.pinned === "boolean") {
    data.pinned = parsed.pinned;
  }

  if ("feedback" in parsed) {
    data.feedback = parsed.feedback ?? null;
  }

  await prisma.insightReaction.upsert({
    where: {
      workspaceId_insightKey: {
        workspaceId: workspace.id,
        insightKey: parsed.key,
      },
    },
    create: {
      workspaceId: workspace.id,
      insightKey: parsed.key,
      pinned: parsed.pinned ?? false,
      feedback: parsed.feedback ?? null,
    },
    update: data,
  });

  revalidatePath("/");
  revalidatePath("/insights");

  return { ok: true };
}
