"use client";

const prompts = [
  { label: "What am I avoiding?", emoji: "🪞" },
  { label: "What keeps repeating?", emoji: "🔁" },
  { label: "What should I do next?", emoji: "🎯" },
  { label: "What feels unfinished?", emoji: "🧩" },
  { label: "What changed lately?", emoji: "📈" },
];

export function QuickPrompts({
  disabled,
  onSelect,
}: {
  disabled?: boolean;
  onSelect: (prompt: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
      }}
    >
      {prompts.map((p) => (
        <button
          key={p.label}
          className="mm-chip"
          disabled={disabled}
          onClick={() => onSelect(p.label)}
          style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          <span style={{ fontSize: "0.9em" }}>{p.emoji}</span>
          {p.label}
        </button>
      ))}
    </div>
  );
}
