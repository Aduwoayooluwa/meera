import type {
  InsightCardView,
  InsightFeedback,
  InsightStrength,
  PatternEngineSnapshot,
  UnfinishedShelfItem,
  WeeklyMirrorView,
} from "@/lib/types";

type MemorySourceForInsights = {
  id: string;
  title: string;
  type: string;
  contentText: string;
  createdAt: Date;
  chunks: Array<{
    id: string;
    content: string;
  }>;
};

type InsightReactionForView = {
  insightKey: string;
  pinned: boolean;
  feedback: string | null;
};

type Candidate = {
  source: MemorySourceForInsights;
  sentence: string;
  score: number;
};

const STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "because",
  "before",
  "being",
  "been",
  "could",
  "from",
  "have",
  "into",
  "just",
  "more",
  "most",
  "need",
  "needs",
  "over",
  "said",
  "same",
  "that",
  "their",
  "there",
  "this",
  "what",
  "when",
  "where",
  "which",
  "while",
  "with",
  "work",
  "would",
  "your",
]);

const THEME_LABELS: Record<string, string> = {
  users: "talking to users",
  user: "talking to users",
  customer: "customer feedback",
  customers: "customer feedback",
  feedback: "asking for feedback",
  launch: "launching the work",
  launched: "launching the work",
  publish: "publishing",
  publishing: "publishing",
  distribution: "distribution",
  ship: "shipping",
  shipped: "shipping",
  shipping: "shipping",
  project: "the same project idea",
  product: "the product story",
  demo: "the demo",
  pitch: "the pitch",
  portfolio: "the portfolio",
  essay: "the launch essay",
  design: "design polish",
  polish: "polish",
  research: "research",
  decision: "the decision",
  decisions: "decisions",
  database: "database cleanup",
  onboarding: "onboarding",
};

const ACTION_TERMS = [
  "finish",
  "finished",
  "send",
  "message",
  "contact",
  "call",
  "ship",
  "launch",
  "publish",
  "record",
  "write",
  "draft",
  "clean",
  "choose",
  "decide",
  "build",
  "share",
];

const OPEN_LOOP_MARKERS = [
  "i will",
  "i would",
  "i should",
  "need to",
  "needs to",
  "have to",
  "todo",
  "to-do",
  "next step",
  "next action",
  "unfinished",
  "loose ends",
  "still",
];

const COMPLETION_MARKERS = [
  "done",
  "finished",
  "completed",
  "sent",
  "shipped",
  "launched",
  "published",
  "shared",
  "closed",
];

const AVOIDANCE_MARKERS = [
  "avoid",
  "avoiding",
  "delay",
  "delaying",
  "postpone",
  "postponing",
  "switching",
  "research as a way",
  "not ready",
  "perfect",
  "polish",
  "proof before",
  "shield",
  "judged",
  "feedback",
  "launch",
  "distribution",
];

function normalize(value: string) {
  return value.toLowerCase();
}

function sentencesFor(value: string) {
  return (
    value
      .replace(/\s+/g, " ")
      .match(/[^.!?]+[.!?]?/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []
  );
}

function termsFor(value: string) {
  return (
    normalize(value)
      .match(/[a-z0-9']{3,}/g)
      ?.filter((word) => !STOP_WORDS.has(word)) ?? []
  );
}

function truncate(value: string, max = 180) {
  const clean = value.replace(/\s+/g, " ").trim();

  if (clean.length <= max) {
    return clean;
  }

  return `${clean.slice(0, max - 1).trim()}...`;
}

function titleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`)
    .join(" ");
}

function scoreSentence(sentence: string, markers: string[]) {
  const lower = normalize(sentence);

  return markers.reduce(
    (score, marker) => score + (lower.includes(marker) ? 1 : 0),
    0,
  );
}

function bestSentence(
  sources: MemorySourceForInsights[],
  markers: string[],
): Candidate | null {
  const candidates = sources.flatMap((source) =>
    sentencesFor(source.contentText).map((sentence) => ({
      source,
      sentence,
      score: scoreSentence(sentence, markers),
    })),
  );

  return (
    candidates
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score)[0] ?? null
  );
}

function sourceByMostRecent(sources: MemorySourceForInsights[]) {
  return [...sources].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  )[0];
}

function topThemes(sources: MemorySourceForInsights[]) {
  const counts = new Map<string, number>();

  for (const source of sources) {
    const text = `${source.title} ${source.contentText}`;

    for (const term of termsFor(text)) {
      if (!THEME_LABELS[term]) {
        continue;
      }

      counts.set(term, (counts.get(term) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([term, count]) => ({
      term,
      label: THEME_LABELS[term],
      count,
    }));
}

function strengthFor(sourceCount: number, chunkCount: number): InsightStrength {
  if (sourceCount >= 4 || chunkCount >= 6) {
    return "strong";
  }

  if (sourceCount >= 2 || chunkCount >= 3) {
    return "medium";
  }

  return "weak";
}

function strengthFromScore(score: number, fallback: InsightStrength) {
  if (score >= 3) {
    return "strong";
  }

  if (score >= 2 || fallback === "strong") {
    return "medium";
  }

  return fallback;
}

function feedbackFor(value: string | null): InsightFeedback | null {
  if (value === "true" || value === "not_true" || value === "surprising") {
    return value;
  }

  return null;
}

function applyReaction(
  card: Omit<InsightCardView, "feedback" | "pinned">,
  reactions: Map<string, InsightReactionForView>,
): InsightCardView {
  const reaction = reactions.get(card.key);

  return {
    ...card,
    pinned: reaction?.pinned ?? false,
    feedback: feedbackFor(reaction?.feedback ?? null),
  };
}

function fallbackSnippet(sources: MemorySourceForInsights[]) {
  const source = sourceByMostRecent(sources);

  return {
    sentence: truncate(source?.contentText ?? "Add a few memories and Meera will start finding patterns.", 180),
    sourceTitle: source?.title,
  };
}

function repeatedPatternCard(
  sources: MemorySourceForInsights[],
  reactions: Map<string, InsightReactionForView>,
) {
  const themes = topThemes(sources);
  const primary = themes[0];
  const secondary = themes.find((theme) => theme.label !== primary?.label);
  const source = sourceByMostRecent(sources);
  const snippet = primary
    ? bestSentence(sources, [primary.term, primary.label]) ??
      bestSentence(sources, [primary.term])
    : null;
  const fallback = fallbackSnippet(sources);

  return applyReaction(
    {
      key: "repeated-pattern",
      kind: "repeated-pattern",
      title: "Repeated Pattern",
      summary: primary
        ? `You keep returning to ${primary.label}${
            secondary ? `, especially around ${secondary.label}` : ""
          }.`
        : "A repeated theme will appear here once Meera has more memory to compare.",
      evidenceSnippet: truncate(snippet?.sentence ?? fallback.sentence),
      sourceTitle: snippet?.source.title ?? fallback.sourceTitle ?? source?.title,
      strength: strengthFor(Math.max(primary?.count ?? 0, 1), sources.length),
    },
    reactions,
  );
}

function openLoopCard(
  sources: MemorySourceForInsights[],
  reactions: Map<string, InsightReactionForView>,
  baseStrength: InsightStrength,
) {
  const candidate = bestSentence(sources, [
    ...OPEN_LOOP_MARKERS,
    ...ACTION_TERMS,
  ]);
  const completion = bestSentence(sources, COMPLETION_MARKERS);
  const fallback = fallbackSnippet(sources);
  const hasUnclosedAction =
    candidate &&
    (!completion ||
      candidate.source.createdAt.getTime() >= completion.source.createdAt.getTime() ||
      candidate.score > completion.score);

  return applyReaction(
    {
      key: "open-loop",
      kind: "open-loop",
      title: "Open Loop",
      summary: hasUnclosedAction
        ? "You named a next step, but Meera has not found a clear completion signal yet."
        : "No strong open loop is visible yet. Add notes with promised next steps to sharpen this.",
      evidenceSnippet: truncate(candidate?.sentence ?? fallback.sentence),
      sourceTitle: candidate?.source.title ?? fallback.sourceTitle,
      strength: strengthFromScore(candidate?.score ?? 0, baseStrength),
    },
    reactions,
  );
}

function avoidedDecisionCard(
  sources: MemorySourceForInsights[],
  reactions: Map<string, InsightReactionForView>,
  baseStrength: InsightStrength,
) {
  const candidate = bestSentence(sources, AVOIDANCE_MARKERS);
  const themes = topThemes(sources);
  const avoidanceTheme =
    themes.find((theme) =>
      ["launch", "distribution", "feedback", "polish", "research"].includes(
        theme.term,
      ),
    ) ?? themes[0];
  const fallback = fallbackSnippet(sources);

  return applyReaction(
    {
      key: "avoided-decision",
      kind: "avoided-decision",
      title: "Avoided Decision",
      summary: candidate
        ? `The stuck place seems to be ${avoidanceTheme?.label ?? "the decision"} more than the work itself.`
        : "No avoided decision is obvious yet. Meera will watch for delay, switching, or polish loops.",
      evidenceSnippet: truncate(candidate?.sentence ?? fallback.sentence),
      sourceTitle: candidate?.source.title ?? fallback.sourceTitle,
      strength: strengthFromScore(candidate?.score ?? 0, baseStrength),
    },
    reactions,
  );
}

function nextMoveCard(
  sources: MemorySourceForInsights[],
  reactions: Map<string, InsightReactionForView>,
  baseStrength: InsightStrength,
) {
  const openLoop = bestSentence(sources, [
    "next step",
    "next action",
    "should",
    "finish",
    "send",
    "ship",
    "launch",
    "publish",
  ]);
  const themes = topThemes(sources);
  const primary = themes[0];
  const fallback = fallbackSnippet(sources);
  const action = primary
    ? `Ship one small public step around ${primary.label} this week.`
    : "Add two or three memories, then ask Meera for the smallest next move.";

  return applyReaction(
    {
      key: "next-move",
      kind: "next-move",
      title: "Next Move",
      summary: openLoop
        ? "Turn the clearest loose end into one visible action with a deadline."
        : action,
      evidenceSnippet: truncate(openLoop?.sentence ?? fallback.sentence),
      sourceTitle: openLoop?.source.title ?? fallback.sourceTitle,
      strength: strengthFromScore(openLoop?.score ?? 0, baseStrength),
    },
    reactions,
  );
}

function weeklyMirror(sources: MemorySourceForInsights[]): WeeklyMirrorView {
  if (sources.length === 0) {
    return {
      changed: "Add memories this week and Meera will show what shifted.",
      repeated: "No recurring signal yet.",
      avoided: "No avoided theme yet.",
      finished: "No finished loop yet.",
      attention: "Start by adding one honest note.",
    };
  }

  const now = Date.now();
  const week = sources.filter(
    (source) => now - source.createdAt.getTime() <= 7 * 86_400_000,
  );
  const active = week.length > 0 ? week : sources.slice(0, 5);
  const themes = topThemes(active);
  const avoidance = bestSentence(active, AVOIDANCE_MARKERS);
  const completion = bestSentence(active, COMPLETION_MARKERS);
  const change = bestSentence(active, [
    "changed",
    "change",
    "new",
    "now",
    "lately",
    "this week",
  ]);
  const openLoop = bestSentence(active, [
    ...OPEN_LOOP_MARKERS,
    "finish",
    "send",
    "ship",
  ]);

  return {
    changed: truncate(
      change?.sentence ??
        `The freshest material is "${active[0]?.title ?? "your latest memory"}".`,
      150,
    ),
    repeated: themes[0]
      ? `You returned to ${themes[0].label}${themes[1] ? ` and ${themes[1].label}` : ""}.`
      : "No repeated theme is strong yet.",
    avoided: truncate(
      avoidance?.sentence ?? "No clear avoidance pattern appeared this week.",
      150,
    ),
    finished: truncate(
      completion?.sentence ?? "Meera has not found a clear completion signal yet.",
      150,
    ),
    attention: truncate(
      openLoop?.sentence ??
        "Choose one visible next step and leave evidence that it happened.",
      150,
    ),
  };
}

function shelfTitleFromSentence(sentence: string) {
  const lower = normalize(sentence);
  const matchedTheme = Object.entries(THEME_LABELS).find(([term]) =>
    lower.includes(term),
  );

  if (matchedTheme) {
    return titleCase(matchedTheme[1]);
  }

  const afterAction = sentence.match(
    /\b(?:finish|send|message|contact|ship|launch|publish|record|write|draft|clean|choose|decide|build|share)\s+([^,.!?]{3,48})/i,
  )?.[1];

  if (afterAction) {
    return titleCase(afterAction.replace(/\b(the|a|an|my|our)\b/gi, "").trim());
  }

  return "Unfinished Thread";
}

function unfinishedShelf(
  sources: MemorySourceForInsights[],
): UnfinishedShelfItem[] {
  const candidates = sources.flatMap((source) =>
    sentencesFor(source.contentText)
      .map((sentence) => ({
        source,
        sentence,
        score: scoreSentence(sentence, [
          ...OPEN_LOOP_MARKERS,
          ...ACTION_TERMS,
        ]),
      }))
      .filter((candidate) => candidate.score > 0),
  );
  const groups = new Map<
    string,
    { title: string; count: number; snippets: string[]; latest: Candidate }
  >();

  for (const candidate of candidates) {
    const title = shelfTitleFromSentence(candidate.sentence);
    const key = normalize(title).replace(/[^a-z0-9]+/g, "-") || "thread";
    const current = groups.get(key);

    if (current) {
      current.count += 1;
      current.snippets.push(candidate.sentence);
      if (candidate.source.createdAt > current.latest.source.createdAt) {
        current.latest = candidate;
      }
      continue;
    }

    groups.set(key, {
      title,
      count: 1,
      snippets: [candidate.sentence],
      latest: candidate,
    });
  }

  return [...groups.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4)
    .map(([key, group]) => ({
      key,
      title: group.title,
      mentionCount: group.count,
      note:
        group.count > 1
          ? `Mentioned ${group.count} times, no clear finish found.`
          : "Mentioned once, no clear finish found.",
      evidenceSnippet: truncate(group.latest.sentence, 150),
    }));
}

export function countPatternHints(contentText: string) {
  const text = normalize(contentText);
  const markerCount = [
    ...OPEN_LOOP_MARKERS,
    ...AVOIDANCE_MARKERS,
    ...ACTION_TERMS,
  ].filter((marker) => text.includes(marker)).length;
  const themeCount = new Set(
    termsFor(contentText).filter((term) => THEME_LABELS[term]),
  ).size;

  return Math.min(4, Math.max(1, Math.ceil((markerCount + themeCount) / 4)));
}

export function buildPatternEngineSnapshot({
  reactions,
  sources,
}: {
  reactions: InsightReactionForView[];
  sources: MemorySourceForInsights[];
}): PatternEngineSnapshot {
  const reactionMap = new Map(
    reactions.map((reaction) => [reaction.insightKey, reaction]),
  );
  const chunkCount = sources.reduce(
    (total, source) => total + source.chunks.length,
    0,
  );
  const memoryStrength = strengthFor(sources.length, chunkCount);
  const cards =
    sources.length === 0
      ? []
      : [
          repeatedPatternCard(sources, reactionMap),
          openLoopCard(sources, reactionMap, memoryStrength),
          avoidedDecisionCard(sources, reactionMap, memoryStrength),
          nextMoveCard(sources, reactionMap, memoryStrength),
        ];

  return {
    cards,
    weeklyMirror: weeklyMirror(sources),
    unfinishedShelf: unfinishedShelf(sources),
    memoryStrength,
  };
}
