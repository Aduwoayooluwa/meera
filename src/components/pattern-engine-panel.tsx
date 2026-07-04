"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Empty, Skeleton, Typography } from "antd";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Compass,
  Flag,
  Pin,
  PinOff,
  Repeat2,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";

import {
  getPatternEngineSnapshot,
  updateInsightReaction,
} from "@/app/actions/insight-actions";
import type {
  InsightCardKind,
  InsightCardView,
  InsightFeedback,
  InsightStrength,
} from "@/lib/types";

const { Text } = Typography;

const cardMeta: Record<
  InsightCardKind,
  {
    Icon: typeof Repeat2;
    tone: string;
  }
> = {
  "repeated-pattern": {
    Icon: Repeat2,
    tone: "teal",
  },
  "open-loop": {
    Icon: Archive,
    tone: "amber",
  },
  "avoided-decision": {
    Icon: CircleHelp,
    tone: "coral",
  },
  "next-move": {
    Icon: Target,
    tone: "green",
  },
};

const feedbackOptions: Array<{
  value: InsightFeedback;
  label: string;
  Icon: typeof CheckCircle2;
}> = [
  { value: "true", label: "True", Icon: CheckCircle2 },
  { value: "not_true", label: "Not true", Icon: XCircle },
  { value: "surprising", label: "Surprising", Icon: Sparkles },
];

function strengthLabel(strength: InsightStrength) {
  if (strength === "strong") return "Strong evidence";
  if (strength === "medium") return "Medium evidence";
  return "Weak evidence";
}

function InsightCard({
  card,
  compact,
  isPending,
  onFeedback,
  onPin,
}: {
  card: InsightCardView;
  compact?: boolean;
  isPending: boolean;
  onFeedback: (card: InsightCardView, feedback: InsightFeedback) => void;
  onPin: (card: InsightCardView) => void;
}) {
  const meta = cardMeta[card.kind];
  const Icon = meta.Icon;

  return (
    <article className="mm-insight-card" data-tone={meta.tone}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mm-insight-icon">
            <Icon size={16} />
          </div>
          <div className="min-w-0">
            <div className="mm-insight-title">{card.title}</div>
            <div className="mm-insight-strength">
              {strengthLabel(card.strength)}
            </div>
          </div>
        </div>
        <button
          aria-label={card.pinned ? `Unpin ${card.title}` : `Pin ${card.title}`}
          className="mm-icon-action"
          data-active={card.pinned}
          disabled={isPending}
          onClick={() => onPin(card)}
          type="button"
        >
          {card.pinned ? <PinOff size={14} /> : <Pin size={14} />}
        </button>
      </div>

      <p className="mm-insight-summary">{card.summary}</p>

      <div className="mm-evidence-strip">
        <span>Evidence</span>
        {card.sourceTitle ? <strong>{card.sourceTitle}</strong> : null}
        <mark className="mm-evidence-highlight">{card.evidenceSnippet}</mark>
      </div>

      {!compact ? (
        <div className="mm-feedback-row" aria-label={`${card.title} feedback`}>
          {feedbackOptions.map(({ value, label, Icon: FeedbackIcon }) => (
            <button
              className="mm-feedback-btn"
              data-active={card.feedback === value}
              disabled={isPending}
              key={value}
              onClick={() => onFeedback(card, value)}
              type="button"
            >
              <FeedbackIcon size={13} />
              {label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function PatternEnginePanel({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["pattern-engine"],
    queryFn: getPatternEngineSnapshot,
  });
  const reactionMutation = useMutation({
    mutationFn: updateInsightReaction,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["pattern-engine"] });
    },
  });

  const handlePin = (card: InsightCardView) => {
    reactionMutation.mutate({
      key: card.key,
      pinned: !card.pinned,
    });
  };

  const handleFeedback = (
    card: InsightCardView,
    feedback: InsightFeedback,
  ) => {
    reactionMutation.mutate({
      key: card.key,
      feedback: card.feedback === feedback ? null : feedback,
    });
  };

  if (isLoading) {
    return (
      <section
        className={`mm-panel mm-pattern-board ${compact ? "mm-pattern-compact" : ""}`}
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <div className="mm-pattern-header">
          <div>
            <div className="mm-kicker">Pattern engine</div>
            <h2>Looking across your memories...</h2>
          </div>
        </div>
        <Skeleton active paragraph={{ rows: compact ? 4 : 8 }} title={false} />
      </section>
    );
  }

  if (isError || !data || data.cards.length === 0) {
    return (
      <section
        className={`mm-panel mm-pattern-board ${compact ? "mm-pattern-compact" : ""}`}
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <div className="mm-pattern-header">
          <div>
            <div className="mm-kicker">Pattern engine</div>
            <h2>Meera is waiting for material.</h2>
          </div>
        </div>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary" style={{ fontSize: "0.82rem" }}>
              Add a few real memories and this turns into insight cards,
              weekly signals, and unfinished loops.
            </Text>
          }
        />
      </section>
    );
  }

  const cards = compact ? data.cards.slice(0, 2) : data.cards;
  const pending = reactionMutation.isPending;

  return (
    <section
      className={`mm-panel mm-pattern-board ${compact ? "mm-pattern-compact" : ""}`}
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="mm-pattern-header">
        <div>
          <div className="mm-kicker">Pattern engine</div>
          <h2>{compact ? "Meera's read" : "Meera's pattern board"}</h2>
          {!compact ? (
            <p>
              Insight cards from your own notes, with the exact snippets Meera
              used as evidence.
            </p>
          ) : null}
        </div>
        <span className="mm-strength-pill" data-strength={data.memoryStrength}>
          {strengthLabel(data.memoryStrength)}
        </span>
      </div>

      <div className="mm-insight-grid">
        {cards.map((card) => (
          <InsightCard
            card={card}
            compact={compact}
            isPending={pending}
            key={card.key}
            onFeedback={handleFeedback}
            onPin={handlePin}
          />
        ))}
      </div>

      {compact ? (
        <div className="mm-compact-link">
          <a href="/insights">Open full pattern board</a>
        </div>
      ) : (
        <>
          <div className="mm-weekly-card">
            <div className="mm-block-heading">
              <CalendarDays size={16} />
              <div>
                <h3>Weekly Mirror</h3>
                <p>The sticky view: what changed, repeated, and needs attention.</p>
              </div>
            </div>
            <div className="mm-weekly-grid">
              {[
                ["What changed", data.weeklyMirror.changed],
                ["What repeated", data.weeklyMirror.repeated],
                ["What you avoided", data.weeklyMirror.avoided],
                ["What you finished", data.weeklyMirror.finished],
                ["Attention next", data.weeklyMirror.attention],
              ].map(([label, value]) => (
                <div className="mm-weekly-item" key={label}>
                  <span>{label}</span>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mm-shelf-card">
            <div className="mm-block-heading">
              <Flag size={16} />
              <div>
                <h3>The Unfinished Shelf</h3>
                <p>Things that appear started, but not clearly completed.</p>
              </div>
            </div>
            {data.unfinishedShelf.length > 0 ? (
              <div className="mm-shelf-list">
                {data.unfinishedShelf.map((item, index) => (
                  <article className="mm-shelf-item" key={item.key}>
                    <div className="mm-shelf-index">{index + 1}</div>
                    <div>
                      <div className="mm-shelf-title">{item.title}</div>
                      <p>{item.note}</p>
                      <mark className="mm-evidence-highlight">
                        {item.evidenceSnippet}
                      </mark>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mm-soft-panel mm-empty-shelf">
                <Compass size={18} />
                <span>
                  No unfinished shelf items yet. Add memories with plans,
                  promises, or project updates.
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
