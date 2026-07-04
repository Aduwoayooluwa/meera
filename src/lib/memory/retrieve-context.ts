import { prisma } from "@/lib/prisma";

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "before",
  "could",
  "from",
  "have",
  "into",
  "just",
  "should",
  "that",
  "their",
  "there",
  "this",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
]);

export type RetrievedMemory = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  sourceDate: string;
  content: string;
  snippet: string;
  score: number;
};

function termsFor(value: string) {
  return value
    .toLowerCase()
    .match(/[a-z0-9']{3,}/g)
    ?.filter((word) => !STOP_WORDS.has(word));
}

function snippetFor(content: string, terms: Set<string>) {
  const sentences = content.match(/[^.!?]+[.!?]?/g) ?? [content];
  const best = sentences
    .map((sentence) => ({
      sentence: sentence.trim(),
      hits: termsFor(sentence)?.filter((term) => terms.has(term)).length ?? 0,
    }))
    .sort((a, b) => b.hits - a.hits)[0]?.sentence;

  return (best || content).slice(0, 260);
}

export async function retrieveContext(workspaceId: string, question: string) {
  const queryTerms = new Set(termsFor(question) ?? []);

  const chunks = await prisma.memoryChunk.findMany({
    where: {
      source: {
        workspaceId,
      },
    },
    include: {
      source: {
        select: {
          id: true,
          title: true,
          type: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  const now = Date.now();

  return chunks
    .map((chunk) => {
      const chunkTerms = termsFor(`${chunk.source.title} ${chunk.content}`) ?? [];
      const overlap = chunkTerms.filter((term) => queryTerms.has(term)).length;
      const ageDays = Math.max(
        0,
        (now - chunk.source.createdAt.getTime()) / 86_400_000,
      );
      const recency = Math.max(0, 1 - ageDays / 90);
      const score = overlap * 5 + recency;

      return {
        chunkId: chunk.id,
        sourceId: chunk.source.id,
        sourceTitle: chunk.source.title,
        sourceType: chunk.source.type,
        sourceDate: chunk.source.createdAt.toISOString(),
        content: chunk.content,
        snippet: snippetFor(chunk.content, queryTerms),
        score,
      };
    })
    .filter((item) => item.score > 0 || queryTerms.size === 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) satisfies RetrievedMemory[];
}
