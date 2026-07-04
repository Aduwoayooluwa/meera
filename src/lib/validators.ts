import { z } from "zod";

export const memoryTypes = [
  "note",
  "chat",
  "pdf",
  "link",
  "voice-transcript",
] as const;

export const chatModes = [
  "reflect",
  "execute",
  "recall",
  "decide",
  "weekly-review",
] as const;

export const insightFeedbackValues = [
  "true",
  "not_true",
  "surprising",
] as const;

export const memorySourceInputSchema = z.object({
  title: z.string().trim().min(2, "Add a clearer title.").max(120),
  type: z.enum(memoryTypes),
  contentText: z
    .string()
    .trim()
    .min(20, "Add at least a few sentences of memory.")
    .max(30000, "Keep each memory under 30,000 characters for the MVP."),
});

export const memoryIdSchema = z.object({
  id: z.string().min(1),
});

export const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(3, "Ask a little more so Meera has something to reflect on.")
    .max(1200, "Keep each question under 1,200 characters."),
  sessionId: z.string().optional(),
  mode: z.enum(chatModes).default("reflect"),
});

export const authInputSchema = z.object({
  email: z.email("Enter a valid email.").trim().toLowerCase(),
  password: z.string().min(8, "Use at least 8 characters.").max(120),
});

export const signupInputSchema = authInputSchema.extend({
  name: z
    .string()
    .trim()
    .min(2, "Add your name.")
    .max(80, "Keep your name under 80 characters."),
});

export const chatSessionIdSchema = z.object({
  id: z.string().min(1),
});

export const insightReactionInputSchema = z.object({
  key: z.string().trim().min(1).max(160),
  pinned: z.boolean().optional(),
  feedback: z.enum(insightFeedbackValues).nullable().optional(),
});

export type MemorySourceInput = z.infer<typeof memorySourceInputSchema>;
export type MemoryType = (typeof memoryTypes)[number];
export type ChatModeInput = (typeof chatModes)[number];
export type InsightReactionInput = z.infer<typeof insightReactionInputSchema>;
export type AuthInput = z.infer<typeof authInputSchema>;
export type SignupInput = z.infer<typeof signupInputSchema>;
