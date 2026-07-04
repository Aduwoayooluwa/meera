"use client";

import { Empty, Typography } from "antd";
import { BookOpen } from "lucide-react";

import type { EvidenceItem } from "@/lib/types";

const { Text } = Typography;

const typeColors: Record<string, string> = {
  note: "mm-type-note",
  chat: "mm-type-chat",
  pdf: "mm-type-pdf",
  link: "mm-type-link",
  "voice-transcript": "mm-type-voice",
};

export function EvidenceList({ evidence }: { evidence?: EvidenceItem[] }) {
  if (!evidence?.length) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Text type="secondary" style={{ fontSize: "0.78rem" }}>
            No strong memory evidence was found.
          </Text>
        }
      />
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        borderTop: "1px solid var(--border-soft)",
        paddingTop: "12px",
        marginTop: "4px",
      }}
    >
      <div
        style={{
          fontSize: "0.72rem",
          fontWeight: 700,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "2px",
          display: "flex",
          alignItems: "center",
          gap: "5px",
        }}
      >
        <BookOpen size={11} />
        Memory evidence
      </div>
      {evidence.slice(0, 4).map((item) => (
        <div
          key={item.chunkId}
          className="mm-soft-panel"
          style={{
            borderRadius: "var(--radius-sm)",
            padding: "10px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "5px",
            }}
          >
            <Text
              strong
              style={{ fontSize: "0.8rem", color: "var(--foreground)" }}
            >
              {item.sourceTitle}
            </Text>
            <span
              className={`mm-type-badge ${typeColors[item.sourceType] ?? "mm-type-note"}`}
            >
              {item.sourceType}
            </span>
          </div>
          <mark className="mm-evidence-highlight">{item.snippet}</mark>
        </div>
      ))}
    </div>
  );
}
