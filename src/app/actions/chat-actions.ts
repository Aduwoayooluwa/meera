"use server";

import { chatSessionIdSchema } from "@/lib/validators";
import { getWorkspace } from "@/lib/workspace/get-workspace";
import { prisma } from "@/lib/prisma";
import type {
  ChatMessageView,
  ChatSessionSummary,
  EvidenceItem,
} from "@/lib/types";

type ChatMessageRow = {
  id: string;
  role: string;
  content: string;
  contextJson: unknown;
  createdAt: Date;
};

function toSessionSummary(session: {
  id: string;
  title: string;
  updatedAt: Date;
  _count: {
    messages: number;
  };
}): ChatSessionSummary {
  return {
    id: session.id,
    title: session.title,
    updatedAt: session.updatedAt.toISOString(),
    messageCount: session._count.messages,
  };
}

function toEvidence(value: unknown): EvidenceItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const evidence = item as Partial<EvidenceItem>;

      if (
        typeof evidence.chunkId !== "string" ||
        typeof evidence.sourceId !== "string" ||
        typeof evidence.sourceTitle !== "string" ||
        typeof evidence.sourceType !== "string" ||
        typeof evidence.sourceDate !== "string" ||
        typeof evidence.snippet !== "string"
      ) {
        return null;
      }

      return {
        chunkId: evidence.chunkId,
        sourceId: evidence.sourceId,
        sourceTitle: evidence.sourceTitle,
        sourceType: evidence.sourceType,
        sourceDate: evidence.sourceDate,
        snippet: evidence.snippet,
        score: typeof evidence.score === "number" ? evidence.score : 0,
      };
    })
    .filter((item): item is EvidenceItem => item !== null);
}

export async function listChatSessions() {
  const workspace = await getWorkspace();
  const sessions = await prisma.chatSession.findMany({
    where: {
      workspaceId: workspace.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 12,
    include: {
      _count: {
        select: {
          messages: true,
        },
      },
    },
  });

  return sessions.map(toSessionSummary);
}

export async function getChatSessionMessages(input: { id: string }) {
  const workspace = await getWorkspace();
  const parsed = chatSessionIdSchema.parse(input);
  const session = await prisma.chatSession.findFirst({
    where: {
      id: parsed.id,
      workspaceId: workspace.id,
    },
    select: {
      id: true,
    },
  });

  if (!session) {
    throw new Error("That conversation was not found.");
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      sessionId: session.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return messages.map(
    (message: ChatMessageRow): ChatMessageView => ({
      id: message.id,
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content,
      evidence:
        message.role === "assistant" ? toEvidence(message.contextJson) : [],
      createdAt: message.createdAt.toISOString(),
    }),
  );
}
