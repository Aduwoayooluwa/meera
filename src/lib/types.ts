export type MemorySourceSummary = {
  id: string;
  title: string;
  type: string;
  contentPreview: string;
  createdAt: string;
  chunkCount: number;
};

export type UserSummary = {
  id: string;
  name: string | null;
  email: string;
};

export type EvidenceItem = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  sourceDate: string;
  snippet: string;
  score: number;
};

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: EvidenceItem[];
  createdAt?: string;
};

export type ChatSessionSummary = {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
};

export type ChatMode =
  | "reflect"
  | "execute"
  | "recall"
  | "decide"
  | "weekly-review";

export type InsightFeedback = "true" | "not_true" | "surprising";

export type InsightStrength = "weak" | "medium" | "strong";

export type InsightCardKind =
  | "repeated-pattern"
  | "open-loop"
  | "avoided-decision"
  | "next-move";

export type InsightCardView = {
  key: string;
  kind: InsightCardKind;
  title: string;
  summary: string;
  evidenceSnippet: string;
  sourceTitle?: string;
  strength: InsightStrength;
  pinned: boolean;
  feedback: InsightFeedback | null;
};

export type WeeklyMirrorView = {
  changed: string;
  repeated: string;
  avoided: string;
  finished: string;
  attention: string;
};

export type UnfinishedShelfItem = {
  key: string;
  title: string;
  mentionCount: number;
  note: string;
  evidenceSnippet: string;
};

export type PatternEngineSnapshot = {
  cards: InsightCardView[];
  weeklyMirror: WeeklyMirrorView;
  unfinishedShelf: UnfinishedShelfItem[];
  memoryStrength: InsightStrength;
};
