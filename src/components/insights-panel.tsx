"use client";

import { Progress, Typography } from "antd";
import { Activity, Layers, Shapes, TrendingUp } from "lucide-react";

import type { MemorySourceSummary } from "@/lib/types";

const { Text } = Typography;

export function InsightsPanel({ sources }: { sources: MemorySourceSummary[] }) {
  const sourceTypes = new Set(sources.map((source) => source.type)).size;
  const chunks = sources.reduce((total, source) => total + source.chunkCount, 0);
  const readiness = Math.min(100, Math.round((sources.length / 4) * 100));

  const stats = [
    {
      icon: Layers,
      value: sources.length,
      label: "Sources",
    },
    {
      icon: Shapes,
      value: sourceTypes,
      label: "Kinds",
    },
    {
      icon: Activity,
      value: chunks,
      label: "Chunks",
    },
  ];

  return (
    <section
      className="mm-panel p-5"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-5">
        <div
          className="mm-section-icon"
          style={{ borderRadius: "var(--radius-sm)" }}
        >
          <TrendingUp size={16} />
        </div>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--foreground)",
              lineHeight: 1.2,
            }}
          >
            Reflection pulse
          </div>
          <Text type="secondary" style={{ fontSize: "0.78rem" }}>
            A feel for how much the mirror has to work with.
          </Text>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="mm-stat-tile">
            <Icon size={14} style={{ color: "var(--primary)" }} />
            <div className="mm-stat-value">{value}</div>
            <div className="mm-stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Mirror readiness */}
      <div style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <Text
            strong
            style={{ fontSize: "0.83rem", color: "var(--foreground)" }}
          >
            Mirror readiness
          </Text>
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 800,
              color: readiness >= 100 ? "var(--success)" : "var(--primary)",
            }}
          >
            {readiness}%
          </span>
        </div>
        <Progress
          percent={readiness}
          showInfo={false}
          strokeColor="var(--primary)"
          railColor="var(--border)"
          style={{ margin: 0 }}
        />
        <Text
          type="secondary"
          style={{
            display: "block",
            fontSize: "0.75rem",
            marginTop: "6px",
            lineHeight: 1.5,
          }}
        >
          {readiness < 50
            ? "Add more memories for richer reflections."
            : readiness < 100
            ? "Good depth — keep adding to improve patterns."
            : "Your mirror has strong material to reflect from."}
        </Text>
      </div>

      {/* Suggested questions */}
      <div>
        <Text
          strong
          style={{
            display: "block",
            fontSize: "0.83rem",
            color: "var(--foreground)",
            marginBottom: "10px",
          }}
        >
          Gentle first questions
        </Text>
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          {[
            "What am I avoiding?",
            "What should I finish first?",
            "What changed in my thinking?",
          ].map((q) => (
            <div
              key={q}
              style={{
                fontSize: "0.8rem",
                color: "var(--muted)",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                background: "var(--surface-soft)",
                border: "1px solid var(--border-soft)",
                lineHeight: 1.4,
              }}
            >
              {q}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
