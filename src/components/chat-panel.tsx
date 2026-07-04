"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Alert, Button, Input, Segmented, Skeleton, Typography } from "antd";
import type { AxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, SendHorizontal, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { EvidenceList } from "@/components/evidence-list";
import { QuickPrompts } from "@/components/quick-prompts";
import { getChatSessionMessages } from "@/app/actions/chat-actions";
import { apiClient } from "@/lib/api-client";
import type { ChatMessageView, ChatMode, EvidenceItem } from "@/lib/types";

const { Text } = Typography;

type ChatResponse = {
  sessionId: string;
  answer: string;
  evidence: EvidenceItem[];
};

type ChatError = {
  error?: string;
};

const shortQuestionMessage =
  "Ask a little more so Meera has something to reflect on.";

const modeDescriptions: Record<ChatMode, string> = {
  reflect: "Find patterns in how you think, feel, and repeat.",
  execute: "Turn the memory pile into a practical next move.",
  recall: "Surface something you mentioned and may have lost track of.",
  decide: "Use your past notes to reason through a choice.",
  "weekly-review": "Summarize what changed, repeated, and needs attention.",
};

const modeOptions: Array<{ label: string; value: ChatMode }> = [
  { label: "Reflect", value: "reflect" },
  { label: "Execute", value: "execute" },
  { label: "Recall", value: "recall" },
  { label: "Decide", value: "decide" },
  { label: "Weekly", value: "weekly-review" },
];

function ThinkingDots() {
  return (
    <div className="mm-assistant-bubble inline-flex items-center gap-1 px-4 py-3">
      <span
        style={{ fontSize: "0.78rem", color: "var(--muted)", marginRight: "6px" }}
      >
        Looking across your memories
      </span>
      <span className="mm-thinking">
        <span className="mm-thinking-dot" />
        <span className="mm-thinking-dot" />
        <span className="mm-thinking-dot" />
      </span>
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="mm-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}

function cleanErrorMessage(value?: string | null) {
  if (!value) {
    return null;
  }

  if (
    value.includes("too_small") ||
    value.includes("expected string to have >=3")
  ) {
    return shortQuestionMessage;
  }

  return value;
}

export function ChatPanel({
  className = "",
  hasMemories,
  onChatSaved,
  onSessionChange,
  sessionId,
}: {
  className?: string;
  hasMemories: boolean;
  onChatSaved: () => void;
  onSessionChange: (id: string) => void;
  sessionId?: string;
}) {
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<ChatMode>("reflect");
  const [inputHint, setInputHint] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<
    ChatMessageView[]
  >([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    data: savedMessages = [],
    isLoading: isLoadingSession,
  } = useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: () => getChatSessionMessages({ id: sessionId ?? "" }),
    enabled: Boolean(sessionId),
  });
  const messages = sessionId
    ? [...savedMessages, ...optimisticMessages]
    : optimisticMessages;

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiClient.post<ChatResponse>("/api/chat", {
        message,
        sessionId,
        mode,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setOptimisticMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
          evidence: data.evidence,
        },
      ]);
      onSessionChange(data.sessionId);
      onChatSaved();
    },
  });
  const trimmedDraft = draft.trim();
  const canSubmit =
    hasMemories &&
    !isLoadingSession &&
    !chatMutation.isPending &&
    trimmedDraft.length >= 3;

  // Auto-scroll on new messages
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const scrollNode = scrollRef.current;

      if (scrollNode) {
        scrollNode.scrollTo({
          top: scrollNode.scrollHeight,
          behavior: "smooth",
        });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [messages.length, chatMutation.isPending, isLoadingSession]);

  const errorMessage = useMemo(() => {
    const error = chatMutation.error as AxiosError<ChatError> | null;

    return cleanErrorMessage(
      error?.response?.data?.error ??
        error?.message ??
        (chatMutation.isError ? "Chat failed." : null),
    );
  }, [chatMutation.error, chatMutation.isError]);

  const submit = (value: string) => {
    const message = value.trim();

    if (chatMutation.isPending) {
      return;
    }

    if (message.length < 3) {
      setInputHint(shortQuestionMessage);
      return;
    }

    setInputHint(null);
    chatMutation.reset();
    setDraft("");
    setOptimisticMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
      },
    ]);
    chatMutation.mutate(message);
  };

  return (
    <section
      className={`mm-panel flex min-h-0 flex-1 flex-col overflow-hidden ${className}`}
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      {/* Header */}
      <div
        className="shrink-0 p-4 pb-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="mm-section-icon" style={{ borderRadius: "var(--radius-sm)" }}>
            <MessageCircle size={16} />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "0.95rem",
                color: "var(--foreground)",
                lineHeight: 1.2,
              }}
            >
              Ask your mirror
            </div>
            <div style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
              Every answer points back to your saved words.
            </div>
          </div>
        </div>
        {hasMemories ? (
          <div className="flex flex-col gap-3">
            <div className="mm-mode-row">
              <Segmented
                block
                disabled={chatMutation.isPending || isLoadingSession}
                onChange={(value) => setMode(value as ChatMode)}
                options={modeOptions}
                value={mode}
              />
              <p>{modeDescriptions[mode]}</p>
            </div>
            <QuickPrompts
              onSelect={submit}
              disabled={chatMutation.isPending || isLoadingSession}
            />
          </div>
        ) : null}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="mm-chat-scroll min-h-0 flex-1 overflow-y-auto p-4"
      >
        {!hasMemories ? (
          <div className="mx-auto flex h-full min-h-[280px] max-w-md flex-col items-center justify-center text-center gap-3">
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "var(--radius)",
                background: "var(--surface-soft)",
                border: "1px solid var(--border-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted-light)",
              }}
            >
              <MessageCircle size={22} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 700,
                  color: "var(--foreground)",
                  fontSize: "0.95rem",
                  marginBottom: "4px",
                }}
              >
                Nothing to reflect yet.
              </div>
              <Text type="secondary" style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
                Add a memory first — then come back with a question you&apos;ve
                been carrying.
              </Text>
            </div>
          </div>
        ) : isLoadingSession ? (
          <div className="mx-auto flex h-full min-h-[280px] w-full max-w-xl flex-col justify-center">
            <Skeleton active paragraph={{ rows: 5 }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="mx-auto flex h-full min-h-[280px] max-w-lg flex-col items-center justify-center text-center gap-4">
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "var(--radius)",
                background: "var(--primary-soft)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <div
                style={{
                  fontWeight: 800,
                  color: "var(--foreground)",
                  fontSize: "1.05rem",
                  letterSpacing: "-0.01em",
                  marginBottom: "6px",
                }}
              >
                What should we look at first?
              </div>
              <Text type="secondary" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>
                Try &quot;What am I avoiding?&quot; or &quot;What should I do
                this weekend?&quot;
              </Text>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 w-full">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className={
                    message.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >
                  <div
                    className={
                      message.role === "user"
                        ? "mm-user-bubble px-4 py-3 max-w-[82%]"
                        : "mm-assistant-bubble px-4 py-3 max-w-[88%]"
                    }
                  >
                    {message.role === "assistant" ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <div
                        style={{
                          whiteSpace: "pre-wrap",
                          fontSize: "0.88rem",
                          lineHeight: "1.65",
                        }}
                      >
                        {message.content}
                      </div>
                    )}
                    {message.role === "assistant" ? (
                      <div className="mt-4">
                        <EvidenceList evidence={message.evidence} />
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Thinking indicator */}
        {chatMutation.isPending ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start mt-4"
          >
            <ThinkingDots />
          </motion.div>
        ) : null}

        {/* Error */}
        {errorMessage ? (
          <Alert
            className="mt-4"
            message={errorMessage}
            showIcon
            type="warning"
            style={{ borderRadius: "var(--radius-sm)", fontSize: "0.83rem" }}
          />
        ) : null}
      </div>

      {/* Input bar */}
      <div
        className="shrink-0 p-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex gap-2">
          <Input
            aria-label="Ask Memory Mirror"
            disabled={!hasMemories || isLoadingSession}
            onChange={(event) => {
              const nextValue = event.target.value;

              setDraft(nextValue);

              if (nextValue.trim().length >= 3) {
                setInputHint(null);
              }

              if (chatMutation.isError) {
                chatMutation.reset();
              }
            }}
            onPressEnter={() => submit(draft)}
            placeholder="Ask what feels stuck, unclear, or ready to finish…"
            value={draft}
            style={{ borderRadius: "var(--radius-sm)", flex: 1 }}
          />
          <Button
            disabled={!canSubmit}
            icon={<SendHorizontal size={15} />}
            loading={chatMutation.isPending}
            onClick={() => submit(draft)}
            type="primary"
            style={{ borderRadius: "var(--radius-sm)", minWidth: "42px" }}
          />
        </div>
        {inputHint ? <div className="mm-input-hint">{inputHint}</div> : null}
      </div>
    </section>
  );
}
