"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  App,
  Button,
  Empty,
  Popconfirm,
  Progress,
  Skeleton,
  Typography,
} from "antd";
import { BookOpen, MessageSquare, FileText, Link2, Mic, Trash2 } from "lucide-react";

import { deleteMemorySource } from "@/app/actions/memory-actions";
import { formatRelativeDay } from "@/lib/format-relative-time";
import type { MemorySourceSummary } from "@/lib/types";

const { Text } = Typography;

const typeConfig: Record<
  string,
  {
    Icon: typeof BookOpen;
    badgeClass: string;
    label: string;
  }
> = {
  note: { Icon: FileText, badgeClass: "mm-type-note", label: "Note" },
  chat: { Icon: MessageSquare, badgeClass: "mm-type-chat", label: "Chat" },
  pdf: { Icon: FileText, badgeClass: "mm-type-pdf", label: "PDF" },
  link: { Icon: Link2, badgeClass: "mm-type-link", label: "Link" },
  "voice-transcript": { Icon: Mic, badgeClass: "mm-type-voice", label: "Voice" },
};

function getTypeConfig(type: string) {
  return typeConfig[type] ?? { Icon: BookOpen, badgeClass: "mm-type-note", label: type };
}

export function MemorySourceList({
  isLoading,
  sources,
}: {
  isLoading: boolean;
  sources: MemorySourceSummary[];
}) {
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const deleteMutation = useMutation({
    mutationFn: deleteMemorySource,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["memory-sources"] }),
        queryClient.invalidateQueries({ queryKey: ["pattern-engine"] }),
      ]);
      message.success("Memory deleted.");
    },
    onError: (error) => {
      message.error(
        error instanceof Error ? error.message : "Delete failed."
      );
    },
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="mm-soft-panel"
            style={{ borderRadius: "var(--radius)", padding: "14px" }}
          >
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div
        className="mm-soft-panel"
        style={{
          borderRadius: "var(--radius)",
          padding: "32px 20px",
          textAlign: "center",
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Text type="secondary" style={{ fontSize: "0.83rem" }}>
              Your mirror is empty for now.
            </Text>
          }
        />
        <Text
          type="secondary"
          style={{ display: "block", maxWidth: "280px", margin: "0 auto", fontSize: "0.78rem", lineHeight: 1.6 }}
        >
          Add one real note or use demo memories to see the reflection flow.
        </Text>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {sources.map((source) => {
        const cfg = getTypeConfig(source.type);
        const Icon = cfg.Icon;

        return (
          <article key={source.id} className="mm-memory-card">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  minWidth: 0,
                }}
              >
                {/* Icon */}
                <div
                  className="mm-section-icon"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "var(--radius-sm)",
                    flexShrink: 0,
                    marginTop: "1px",
                  }}
                >
                  <Icon size={14} />
                </div>

                {/* Meta */}
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      color: "var(--foreground)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginBottom: "4px",
                    }}
                  >
                    {source.title}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <span className={`mm-type-badge ${cfg.badgeClass}`}>
                      {cfg.label}
                    </span>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--muted)",
                        fontWeight: 500,
                      }}
                    >
                      {formatRelativeDay(source.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delete */}
              <Popconfirm
                title="Delete this memory?"
                okText="Delete"
                okButtonProps={{ danger: true }}
                onConfirm={() => deleteMutation.mutate({ id: source.id })}
              >
                <Button
                  aria-label={`Delete ${source.title}`}
                  icon={<Trash2 size={14} />}
                  loading={deleteMutation.isPending}
                  size="small"
                  type="text"
                  danger
                  style={{ flexShrink: 0, marginTop: "2px" }}
                />
              </Popconfirm>
            </div>

            {/* Preview */}
            <Text
              type="secondary"
              style={{
                display: "block",
                fontSize: "0.8rem",
                lineHeight: "1.6",
                marginBottom: "10px",
              }}
            >
              {source.contentPreview}
              {source.contentPreview.length >= 180 ? "…" : ""}
            </Text>

            {/* Progress */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div style={{ flex: 1 }}>
                <Progress
                  percent={Math.min(100, source.chunkCount * 28)}
                  showInfo={false}
                  size="small"
                  strokeColor="var(--primary)"
                  railColor="var(--border)"
                />
              </div>
              <Text
                type="secondary"
                style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}
              >
                {source.chunkCount} {source.chunkCount === 1 ? "part" : "parts"}
              </Text>
            </div>
          </article>
        );
      })}
    </div>
  );
}
