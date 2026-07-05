import { generateTextEmbedding, generateTextEmbeddings } from "@/lib/btl/client";
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

type MemoryChunkWithSource = {
  id: string;
  content: string;
  embeddingJson: unknown;
  embeddingModel: string | null;
  source: {
    id: string;
    title: string;
    type: string;
    createdAt: Date;
  };
};

function asEmbedding(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const embedding = value.filter(
    (item): item is number => typeof item === "number" && Number.isFinite(item),
  );

  return embedding.length === value.length && embedding.length > 0
    ? embedding
    : null;
}

function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);

  if (length === 0) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    dot += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
}

async function backfillMissingEmbeddings(chunks: MemoryChunkWithSource[]) {
  const missingChunks = chunks.filter((chunk) => !asEmbedding(chunk.embeddingJson));

  if (missingChunks.length === 0) {
    return chunks;
  }

  const embeddingResult = await generateTextEmbeddings(
    missingChunks.map((chunk) => chunk.content),
  ).catch(() => null);

  if (!embeddingResult) {
    return chunks;
  }

  const updates = missingChunks.map((chunk, index) => ({
    chunk,
    embedding: embeddingResult.embeddings[index],
  }));

  await Promise.all(
    updates.map(({ chunk, embedding }) =>
      prisma.memoryChunk
        .update({
          where: {
            id: chunk.id,
          },
          data: {
            embeddingJson: embedding,
            embeddingModel: embeddingResult.model,
          },
        })
        .catch(() => null),
    ),
  );

  const updatedEmbeddings = new Map(
    updates
      .filter((item) => item.embedding)
      .map(({ chunk, embedding }) => [chunk.id, embedding]),
  );

  return chunks.map((chunk) => {
    const embedding = updatedEmbeddings.get(chunk.id);

    return embedding
      ? {
          ...chunk,
          embeddingJson: embedding,
          embeddingModel: embeddingResult.model,
        }
      : chunk;
  });
}

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
  const questionEmbedding = await generateTextEmbedding(question)
    .then((result) => result?.embedding ?? null)
    .catch(() => null);

  const chunks: MemoryChunkWithSource[] = await prisma.memoryChunk.findMany({
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
  const searchableChunks = questionEmbedding
    ? await backfillMissingEmbeddings(chunks)
    : chunks;

  const now = Date.now();

  return searchableChunks
    .map((chunk) => {
      const chunkTerms = termsFor(`${chunk.source.title} ${chunk.content}`) ?? [];
      const overlap = chunkTerms.filter((term) => queryTerms.has(term)).length;
      const chunkEmbedding = asEmbedding(chunk.embeddingJson);
      const semanticScore =
        questionEmbedding && chunkEmbedding
          ? Math.max(0, cosineSimilarity(questionEmbedding, chunkEmbedding))
          : null;
      const ageDays = Math.max(
        0,
        (now - chunk.source.createdAt.getTime()) / 86_400_000,
      );
      const recency = Math.max(0, 1 - ageDays / 90);
      const score =
        semanticScore === null
          ? overlap * 5 + recency
          : semanticScore * 100 + overlap * 2 + recency;

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
    .filter(
      (item) =>
        item.score > 0 || queryTerms.size === 0 || questionEmbedding !== null,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 10) satisfies RetrievedMemory[];
}
