"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  App,
  Button,
  Form,
  Input,
  Select,
  Typography,
  Upload,
} from "antd";
import { isAxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileText, Plus, Sparkles, UploadCloud } from "lucide-react";
import { useState } from "react";

import {
  addMemorySource,
  loadDemoMemories,
} from "@/app/actions/memory-actions";
import { apiClient } from "@/lib/api-client";
import { memoryTypes, type MemorySourceInput } from "@/lib/validators";

const { TextArea } = Input;
const { Text } = Typography;

const typeConfig: Record<
  (typeof memoryTypes)[number],
  { label: string }
> = {
  note: { label: "Note" },
  chat: { label: "Chat" },
  pdf: { label: "PDF text" },
  link: { label: "Link note" },
  "voice-transcript": { label: "Voice memo" },
};

type ExtractMemoryResponse = {
  contentText: string;
  title: string;
  type: (typeof memoryTypes)[number];
};

export function MemoryComposer() {
  const [form] = Form.useForm<MemorySourceInput>();
  const [patternPulse, setPatternPulse] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  const refreshSources = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["memory-sources"] }),
      queryClient.invalidateQueries({ queryKey: ["pattern-engine"] }),
    ]);
  };

  const showPatternPulse = (count: number) => {
    setPatternPulse(count);
    window.setTimeout(() => setPatternPulse(null), 3600);
  };

  const titleFromContent = (contentText: string) => {
    const firstLine =
      contentText
        .split(/[\n.!?]/)
        .map((part) => part.trim())
        .find(Boolean) ?? "Untitled memory";

    return firstLine.slice(0, 72);
  };

  const addMutation = useMutation({
    mutationFn: addMemorySource,
    onSuccess: async (data) => {
      form.resetFields();
      showPatternPulse(data.patternHints);
      await refreshSources();
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : "Save failed.");
    },
  });

  const demoMutation = useMutation({
    mutationFn: loadDemoMemories,
    onSuccess: async (data) => {
      showPatternPulse(data.patternHints);
      await refreshSources();
      message.success("Demo memories loaded.");
    },
    onError: (error) => {
      message.error(
        error instanceof Error ? error.message : "Demo load failed."
      );
    },
  });

  const extractUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);

      const response = await apiClient.post<ExtractMemoryResponse>(
        "/api/extract-memory",
        body,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      return response.data;
    },
    onSuccess: (data) => {
      form.setFieldsValue({
        contentText: data.contentText,
        title: form.getFieldValue("title") || data.title,
        type: data.type,
      });
      message.success("Upload read into the composer.");
    },
    onError: (error) => {
      const responseMessage = isAxiosError<{ error?: string }>(error)
        ? error.response?.data?.error
        : null;

      message.error(
        responseMessage ||
          (error instanceof Error ? error.message : "Upload could not be read."),
      );
    },
  });

  return (
    <div
      className="mm-panel p-5"
      style={{ borderRadius: "var(--radius-lg)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="mm-section-icon"
          style={{ borderRadius: "var(--radius-sm)" }}
        >
          <FileText size={16} />
        </div>
        <div>
          <div
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--foreground)",
            }}
          >
            Add a memory
          </div>
          <Text type="secondary" style={{ fontSize: "0.78rem" }}>
            Messy is fine. Meera works better with raw thoughts.
          </Text>
        </div>
      </div>

      {/* Demo loader */}
      <button
        className="mm-chip"
        style={{
          width: "100%",
          justifyContent: "center",
          marginBottom: "20px",
          padding: "9px 14px",
          borderRadius: "var(--radius-sm)",
          gap: "7px",
        }}
        disabled={demoMutation.isPending}
        onClick={() => demoMutation.mutate()}
      >
        <Sparkles size={14} />
        {demoMutation.isPending ? "Loading demo…" : "Load demo memories"}
      </button>

      {/* Divider */}
      <div
        style={{
          borderTop: "1px solid var(--border-soft)",
          marginBottom: "18px",
          position: "relative",
          textAlign: "center",
        }}
      >
        <span
          style={{
            background: "var(--surface)",
            color: "var(--muted)",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "0 10px",
            position: "relative",
            top: "-10px",
          }}
        >
          or add your own
        </span>
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ type: "note" }}
        onFinish={(values) => {
          const contentText = values.contentText.trim();

          addMutation.mutate({
            ...values,
            title: values.title?.trim() || titleFromContent(contentText),
            contentText,
          });
        }}
      >
        <Form.Item
          label="Drop a note, paste a chat, or write what happened today"
          name="contentText"
          rules={[{ required: true, min: 20, max: 30000 }]}
        >
          <TextArea
            className="mm-memory-textarea"
            rows={11}
            placeholder="Paste the thing you keep thinking about..."
          />
        </Form.Item>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
          <Form.Item
            label="Name it"
            name="title"
            rules={[{ min: 2, max: 120 }]}
          >
            <Input placeholder="Optional - Meera can name it" />
          </Form.Item>

          <Form.Item
            label="Kind"
            name="type"
            rules={[{ required: true }]}
          >
            <Select
              options={memoryTypes.map((type) => ({
                value: type,
                label: typeConfig[type].label,
              }))}
            />
          </Form.Item>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Upload
            accept=".txt,.md,image/png,image/jpeg,image/webp,image/gif,text/plain,text/markdown"
            beforeUpload={(file) => {
              extractUploadMutation.mutate(file);
              return false;
            }}
            fileList={[]}
            maxCount={1}
          >
            <button
              type="button"
              className="mm-chip"
              style={{
                padding: "7px 12px",
                borderRadius: "var(--radius-sm)",
                gap: "6px",
              }}
              disabled={extractUploadMutation.isPending}
            >
              <UploadCloud size={14} />
              {extractUploadMutation.isPending
                ? "Reading upload..."
                : "Upload image or file"}
            </button>
          </Upload>

          <AnimatePresence>
            {patternPulse ? (
              <motion.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="mm-memory-saved-pulse"
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <CheckCircle2 size={14} />
                Meera found {patternPulse} possible{" "}
                {patternPulse === 1 ? "pattern" : "patterns"} in this memory.
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <Button
          block
          className="mt-4!"
          htmlType="submit"
          icon={<Plus size={15} />}
          loading={addMutation.isPending}
          type="primary"
          style={{ borderRadius: "var(--radius-sm)", fontWeight: 700 }}
        >
          Save memory
        </Button>
      </Form>
    </div>
  );
}
