"use server";

import { revalidatePath } from "next/cache";

import { generateTextEmbeddings } from "@/lib/btl/client";
import { countPatternHints } from "@/lib/insights/pattern-engine";
import { chunkText, normalizeMemoryText } from "@/lib/memory/chunk-text";
import { prisma } from "@/lib/prisma";
import type { MemorySourceSummary } from "@/lib/types";
import {
  memoryIdSchema,
  memorySourceInputSchema,
  type MemorySourceInput,
} from "@/lib/validators";
import { getWorkspace } from "@/lib/workspace/get-workspace";

const demoMemories: MemorySourceInput[] = [
  {
    title: "Monday planning note",
    type: "note",
    contentText:
      "I said the launch essay should be the first thing I finish, but I spent the morning tuning dashboards and reading old customer notes. The essay is still rough because I keep wanting the product story to be perfect before I send it. I wrote that I am avoiding asking Maya for direct feedback because I already know she will point out the vague parts.",
  },
  {
    title: "Founder chat transcript",
    type: "chat",
    contentText:
      "Maya told me the recurring pattern is that I keep collecting more proof before making the public version. She said the product is good enough for a small demo, but the story needs a sharper before-and-after. I replied that I would rather fix the onboarding first. She asked whether onboarding is real work or a shield from publishing.",
  },
  {
    title: "Voice memo after standup",
    type: "voice-transcript",
    contentText:
      "I feel proud of the Memory Mirror prototype, but I am tired from carrying all the loose ends in my head. The unfinished loops are: write the launch essay, send Maya the demo, clean up the database reset flow, and choose the three clips for the hackathon video. This weekend should be about finishing the visible story, not polishing internals.",
  },
  {
    title: "Friday journal",
    type: "note",
    contentText:
      "The same theme is back: I use research as a way to delay being judged. The useful change this week is that I can name it faster. When I asked what would make the work feel lighter, the answer was a short Saturday plan: draft for 90 minutes, send the demo link, then do one database cleanup only if the story is sent.",
  },
];

type MemoryTransaction = {
  memorySource: Pick<typeof prisma.memorySource, "create" | "deleteMany">;
};

async function buildChunkCreateInputs(chunks: string[]) {
  try {
    const embeddingResult = await generateTextEmbeddings(chunks);

    return chunks.map((content, chunkIndex) => ({
      chunkIndex,
      content,
      embeddingJson: embeddingResult?.embeddings[chunkIndex],
      embeddingModel: embeddingResult?.model,
    }));
  } catch {
    return chunks.map((content, chunkIndex) => ({
      chunkIndex,
      content,
    }));
  }
}

function toSummary(source: {
  id: string;
  title: string;
  type: string;
  contentText: string;
  createdAt: Date;
  _count: {
    chunks: number;
  };
}): MemorySourceSummary {
  return {
    id: source.id,
    title: source.title,
    type: source.type,
    contentPreview: source.contentText.slice(0, 180),
    createdAt: source.createdAt.toISOString(),
    chunkCount: source._count.chunks,
  };
}

export async function listMemorySources() {
  const workspace = await getWorkspace();
  const sources = await prisma.memorySource.findMany({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          chunks: true,
        },
      },
    },
  });

  return sources.map(toSummary);
}

export async function addMemorySource(input: MemorySourceInput) {
  const workspace = await getWorkspace();
  const parsed = memorySourceInputSchema.parse(input);
  const contentText = normalizeMemoryText(parsed.contentText);
  const chunks = chunkText(contentText);
  const chunkCreateInputs = await buildChunkCreateInputs(chunks);

  await prisma.memorySource.create({
    data: {
      workspaceId: workspace.id,
      title: parsed.title,
      type: parsed.type,
      contentText,
      chunks: {
        create: chunkCreateInputs,
      },
    },
  });

  revalidatePath("/");
  revalidatePath("/insights");

  return {
    ok: true,
    patternHints: countPatternHints(contentText),
  };
}

export async function deleteMemorySource(input: { id: string }) {
  const workspace = await getWorkspace();
  const parsed = memoryIdSchema.parse(input);

  await prisma.memorySource.deleteMany({
    where: {
      id: parsed.id,
      workspaceId: workspace.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/insights");
  return { ok: true };
}

export async function loadDemoMemories() {
  const workspace = await getWorkspace();
  const titles = demoMemories.map((memory) => memory.title);
  const preparedMemories = await Promise.all(
    demoMemories.map(async (memory) => {
      const contentText = normalizeMemoryText(memory.contentText);
      const chunks = chunkText(contentText);

      return {
        ...memory,
        contentText,
        chunks: await buildChunkCreateInputs(chunks),
      };
    }),
  );

  await prisma.$transaction(async (tx: MemoryTransaction) => {
    await tx.memorySource.deleteMany({
      where: {
        workspaceId: workspace.id,
        title: {
          in: titles,
        },
      },
    });

    for (const memory of preparedMemories) {
      await tx.memorySource.create({
        data: {
          workspaceId: workspace.id,
          title: memory.title,
          type: memory.type,
          contentText: memory.contentText,
          chunks: {
            create: memory.chunks,
          },
        },
      });
    }
  });

  revalidatePath("/");
  revalidatePath("/insights");

  return {
    ok: true,
    patternHints: demoMemories.length,
  };
}
