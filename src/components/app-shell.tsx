"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dropdown, Skeleton, Typography } from "antd";
import {
  BarChart3,
  BookOpenText,
  Brain,
  ChevronDown,
  History,
  Layers,
  Library,
  LogOut,
  MessageSquareText,
  Moon,
  PenLine,
  PlusCircle,
  Sun,
  UserRound,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { listChatSessions } from "@/app/actions/chat-actions";
import { listMemorySources } from "@/app/actions/memory-actions";
import { ChatPanel } from "@/components/chat-panel";
import { InsightsPanel } from "@/components/insights-panel";
import { MemoryComposer } from "@/components/memory-composer";
import { MemorySourceList } from "@/components/memory-source-list";
import { PatternEnginePanel } from "@/components/pattern-engine-panel";
import { useThemeMode } from "@/components/providers";
import { apiClient } from "@/lib/api-client";
import { formatRelativeDay } from "@/lib/format-relative-time";
import type {
  ChatSessionSummary,
  MemorySourceSummary,
  UserSummary,
} from "@/lib/types";

const { Text } = Typography;

type AppView = "mirror" | "memories" | "insights";

const navItems = [
  {
    href: "/",
    key: "mirror",
    label: "Mirror",
    icon: MessageSquareText,
  },
  {
    href: "/memories",
    key: "memories",
    label: "Memories",
    icon: Library,
  },
  {
    href: "/insights",
    key: "insights",
    label: "Insights",
    icon: BarChart3,
  },
] as const;

function AppHeader({
  view,
  memoryCount,
  user,
}: {
  view: AppView;
  memoryCount: number;
  user: UserSummary;
}) {
  const { mode, toggleMode } = useThemeMode();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post("/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
      router.refresh();
    },
  });
  const displayName = user.name || user.email.split("@")[0];
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const menuItems = [
    {
      key: "identity",
      disabled: true,
      label: (
        <div style={{ minWidth: 190 }}>
          <div style={{ color: "var(--foreground)", fontWeight: 800 }}>
            {displayName}
          </div>
          <div style={{ color: "var(--muted)", fontSize: "0.78rem" }}>
            {user.email}
          </div>
        </div>
      ),
    },
    {
      type: "divider" as const,
    },
    {
      key: "memory",
      icon: <PenLine size={14} />,
      label: <Link href="/memories">Add memory</Link>,
    },
    {
      key: "theme",
      icon:
        mode === "dark" ? <Sun size={14} /> : <Moon size={14} />,
      label: mode === "dark" ? "Light mode" : "Dark mode",
      onClick: toggleMode,
    },
    {
      key: "logout",
      danger: true,
      icon: <LogOut size={14} />,
      label: logoutMutation.isPending ? "Signing out..." : "Sign out",
      onClick: () => logoutMutation.mutate(),
    },
  ];

  return (
    <header className="mm-app-header shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="mm-logo-dot">
          <Brain size={18} strokeWidth={2.4} />
        </div>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "1.2rem",
              fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "var(--foreground)",
              lineHeight: 1.2,
            }}
          >
            Memory Mirror
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "0.76rem",
              color: "var(--muted)",
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            patterns hiding in your own words
          </p>
        </div>
      </div>

      <nav className="mm-nav-bar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = view === item.key;

          return (
            <Link
              key={item.key}
              data-active={isActive}
              href={item.href}
              className="mm-nav-link"
            >
              <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
              {item.label}
              {item.key === "memories" && memoryCount > 0 ? (
                <span className="mm-nav-count">{memoryCount}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <Dropdown
        menu={{ items: menuItems }}
        placement="bottomRight"
        trigger={["click"]}
      >
        <button className="mm-account-btn" type="button">
          <span className="mm-account-avatar">
            {initials || <UserRound size={14} />}
          </span>
          <span className="mm-account-name">{displayName}</span>
          <ChevronDown size={14} />
        </button>
      </Dropdown>
    </header>
  );
}

function MemoryLibrary({
  isLoading,
  sources,
}: {
  isLoading: boolean;
  sources: MemorySourceSummary[];
}) {
  return (
    <section
      className="mm-panel rounded-xl p-5 flex flex-col gap-4"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="mm-section-icon" style={{ borderRadius: "var(--radius-sm)" }}>
            <Layers size={16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--foreground)" }}>
              Memory library
            </div>
            <div style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
              {sources.length === 0
                ? "Empty – add your first memory"
                : `${sources.length} saved source${sources.length === 1 ? "" : "s"}`}
            </div>
          </div>
        </div>
        {sources.length > 0 && (
          <span
            style={{
              background: "var(--primary-soft)",
              color: "var(--primary)",
              fontSize: "0.72rem",
              fontWeight: 800,
              borderRadius: "99px",
              padding: "3px 10px",
              letterSpacing: "0.05em",
            }}
          >
            {sources.length}
          </span>
        )}
      </div>
      <MemorySourceList isLoading={isLoading} sources={sources} />
    </section>
  );
}

function formatSessionDate(value: string) {
  return formatRelativeDay(value, "Last seen");
}

function ChatHistoryList({
  activeSessionId,
  isLoading,
  onNewChat,
  onSelectSession,
  sessions,
}: {
  activeSessionId?: string;
  isLoading: boolean;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  sessions: ChatSessionSummary[];
}) {
  return (
    <section
      className="mm-panel p-4"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History size={14} style={{ color: "var(--primary)" }} />
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.82rem",
              color: "var(--foreground)",
            }}
          >
            Conversation history
          </span>
        </div>
        <button
          aria-label="Start a new mirror chat"
          className="mm-chip"
          onClick={onNewChat}
          style={{ padding: "6px 8px", borderRadius: "var(--radius-sm)" }}
          type="button"
        >
          <PlusCircle size={13} />
          New
        </button>
      </div>

      {isLoading ? (
        <Skeleton active paragraph={{ rows: 3 }} title={false} />
      ) : sessions.length === 0 ? (
        <div
          style={{
            background: "var(--surface-soft)",
            border: "1px solid var(--border-soft)",
            borderRadius: "var(--radius-sm)",
            color: "var(--muted)",
            fontSize: "0.8rem",
            lineHeight: 1.5,
            padding: "12px",
          }}
        >
          Your mirror chats will appear here.
        </div>
      ) : (
        <div className="flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1">
          {sessions.map((session) => {
            const isActive = activeSessionId === session.id;

            return (
              <button
                className="mm-history-item"
                data-active={isActive}
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                type="button"
              >
                <span className="truncate">{session.title}</span>
                <span>
                  {session.messageCount} msg · {formatSessionDate(session.updatedAt)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MirrorDock({
  activeSessionId,
  isLoading,
  isSessionsLoading,
  onNewChat,
  onSelectSession,
  sources,
  sessions,
}: {
  activeSessionId?: string;
  isLoading: boolean;
  isSessionsLoading: boolean;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  sources: MemorySourceSummary[];
  sessions: ChatSessionSummary[];
}) {
  const chunks = sources.reduce((total, source) => total + source.chunkCount, 0);

  return (
    <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto xl:flex">
      <PatternEnginePanel compact />

      {/* CTA */}
      <section
        className="mm-panel p-5"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <div className="mm-kicker mb-2">Today&apos;s prompt</div>
        <div
          style={{
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "var(--foreground)",
            lineHeight: 1.35,
            marginBottom: "8px",
          }}
        >
          Ask one honest question.
        </div>
        <Text
          type="secondary"
          style={{ fontSize: "0.82rem", lineHeight: "1.6", display: "block" }}
        >
          Works best for patterns, decisions, or things you keep postponing.
        </Text>
        <Link href="/memories">
          <button
            className="mm-theme-btn"
            style={{
              marginTop: "14px",
              width: "100%",
              justifyContent: "center",
              background: "var(--primary)",
              color: "#fff",
              borderColor: "var(--primary)",
              fontSize: "0.83rem",
              gap: "7px",
            }}
          >
            <PenLine size={14} />
            Add or edit memories
          </button>
        </Link>
      </section>

      <ChatHistoryList
        activeSessionId={activeSessionId}
        isLoading={isSessionsLoading}
        onNewChat={onNewChat}
        onSelectSession={onSelectSession}
        sessions={sessions}
      />

      {/* Depth stats */}
      <section
        className="mm-panel p-4"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <div
          style={{
            fontWeight: 700,
            fontSize: "0.82rem",
            color: "var(--muted)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            marginBottom: "12px",
          }}
        >
          Memory depth
        </div>
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="mm-stat-tile">
              <div className="mm-stat-value">{sources.length}</div>
              <div className="mm-stat-label">Sources</div>
            </div>
            <div className="mm-stat-tile">
              <div className="mm-stat-value">{chunks}</div>
              <div className="mm-stat-label">Chunks</div>
            </div>
          </div>
        )}
      </section>

      <section
        className="mm-panel p-4"
        style={{ borderRadius: "var(--radius-lg)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} style={{ color: "var(--primary)" }} />
          <span
            style={{
              fontWeight: 500,
              fontSize: "0.82rem",
              color: "var(--foreground)",
            }}
          >
            Modes to try
          </span>
        </div>
        <div className="mm-mode-mini-list">
          <span>Reflect for patterns</span>
          <span>Execute for next actions</span>
          <span>Recall what slipped</span>
        </div>
      </section>
    </aside>
  );
}

function MirrorView({
  activeSessionId,
  isLoading,
  isSessionsLoading,
  onChatSaved,
  onNewChat,
  onSelectSession,
  sources,
  sessions,
}: {
  activeSessionId?: string;
  isLoading: boolean;
  isSessionsLoading: boolean;
  onChatSaved: () => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  sources: MemorySourceSummary[];
  sessions: ChatSessionSummary[];
}) {
  const hasMemories = sources.length > 0;

  return (
    <section className="grid min-h-0 flex-1 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_300px]">
      <ChatPanel
        key={activeSessionId ?? "new-chat"}
        className="h-full min-h-0"
        hasMemories={hasMemories}
        onChatSaved={onChatSaved}
        onSessionChange={onSelectSession}
        sessionId={activeSessionId}
      />
      <MirrorDock
        activeSessionId={activeSessionId}
        isLoading={isLoading}
        isSessionsLoading={isSessionsLoading}
        onNewChat={onNewChat}
        onSelectSession={onSelectSession}
        sessions={sessions}
        sources={sources}
      />
    </section>
  );
}

function MemoriesView({
  isLoading,
  sources,
}: {
  isLoading: boolean;
  sources: MemorySourceSummary[];
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[420px_minmax(0,1fr)]">
      <div>
        <div className="mb-5">
          <div className="mm-kicker mb-1">Capture</div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 500,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "4px",
            }}
          >
            Give the mirror something real.
          </div>
          <Text type="secondary" style={{ fontSize: "0.85rem" }}>
            Paste the messy thought. You can refine meaning later.
          </Text>
        </div>
        <MemoryComposer />
      </div>
      <MemoryLibrary isLoading={isLoading} sources={sources} />
    </section>
  );
}

function InsightsView({
  isLoading,
  sources,
}: {
  isLoading: boolean;
  sources: MemorySourceSummary[];
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="flex flex-col gap-5">
        <div className="mb-5">
          <div className="mm-kicker mb-1">Signals</div>
          <div
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
              marginBottom: "4px",
            }}
          >
            See what the mirror can work with.
          </div>
          <Text type="secondary" style={{ fontSize: "0.85rem" }}>
            Meera turns your saved words into cards, shelf items, and weekly
            signal.
          </Text>
        </div>
        <PatternEnginePanel />
      </div>
      <div className="flex flex-col gap-5">
        <InsightsPanel sources={sources} />
        <section
          className="mm-panel p-5"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          <div className="flex items-start gap-3 mb-5">
            <div className="mm-section-icon" style={{ borderRadius: "var(--radius-sm)" }}>
              <BookOpenText size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--foreground)" }}>
                Recent material
              </div>
              <Text type="secondary" style={{ fontSize: "0.78rem" }}>
                What the mirror has available right now.
              </Text>
            </div>
          </div>
          <MemorySourceList isLoading={isLoading} sources={sources.slice(0, 4)} />
        </section>
      </div>
    </section>
  );
}

export function AppShell({ user, view }: { user: UserSummary; view: AppView }) {
  const [activeSessionId, setActiveSessionId] = useState<string>();
  const queryClient = useQueryClient();
  const isMirrorView = view === "mirror";
  const { data = [], isLoading } = useQuery({
    queryKey: ["memory-sources"],
    queryFn: listMemorySources,
  });
  const {
    data: chatSessions = [],
    isLoading: isSessionsLoading,
  } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: listChatSessions,
  });

  const refreshChatHistory = () => {
    void queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
  };

  return (
    <main
      className="app-bg px-4 py-4 text-[var(--foreground)] sm:px-6 lg:px-8"
      style={{
        height: isMirrorView ? "100dvh" : undefined,
        minHeight: "100dvh",
        overflow: isMirrorView ? "hidden" : undefined,
      }}
    >
      <div
        className="mx-auto flex max-w-7xl flex-col gap-5"
        style={{
          height: isMirrorView ? "calc(100dvh - 2rem)" : undefined,
          minHeight: isMirrorView ? 0 : "calc(100dvh - 2rem)",
        }}
      >
        <AppHeader
          view={view}
          memoryCount={data.length}
          user={user}
        />
        {view === "mirror" ? (
          <MirrorView
            activeSessionId={activeSessionId}
            isLoading={isLoading}
            isSessionsLoading={isSessionsLoading}
            onChatSaved={refreshChatHistory}
            onNewChat={() => setActiveSessionId(undefined)}
            onSelectSession={setActiveSessionId}
            sessions={chatSessions}
            sources={data}
          />
        ) : null}
        {view === "memories" ? (
          <MemoriesView isLoading={isLoading} sources={data} />
        ) : null}
        {view === "insights" ? (
          <InsightsView isLoading={isLoading} sources={data} />
        ) : null}
      </div>
    </main>
  );
}
