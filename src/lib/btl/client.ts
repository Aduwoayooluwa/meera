import axios from "axios";

import type { RetrievedMemory } from "@/lib/memory/retrieve-context";
import type { ChatMode } from "@/lib/types";

type BtlMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | {
            type: "text";
            text: string;
          }
        | {
            type: "image_url";
            image_url: {
              url: string;
              detail?: "auto" | "low" | "high";
            };
          }
      >;
};

type BtlChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const SYSTEM_PROMPT = `You are Meera, a direct but careful memory reflection assistant.

Your job is to help the user see patterns, open loops, avoided decisions, repeated ideas, and practical next actions from their saved memories.

Grounding rules:
- Use only the user's saved memories and the current conversation.
- Do not invent events, dates, people, motives, or facts.
- If the evidence is weak, incomplete, or missing, say that clearly.
- Prefer specific evidence over general advice.
- Quote short snippets only when useful.
- Mention source titles, dates, or memory types when available.
- If sources disagree, acknowledge the tension instead of forcing a clean answer.

Tone:
- Be direct, calm, and useful.
- Do not sound mystical, clinical, or overly motivational.
- Do not pretend to be a therapist, doctor, lawyer, or financial adviser.
- Do not diagnose the user.
- Be honest when the pattern is uncertain.

Return valid Markdown using this shape:
1. **Pattern**
2. **Evidence**
3. **Interpretation**
4. **Next action**
5. **Confidence**

For Confidence, use one of: High, Medium, Low.
Confidence should reflect evidence strength, not how confident you sound.`;

const MODE_PROMPTS: Record<ChatMode, string> = {
  reflect:
    "Mode: Reflect. Identify emotional, thinking, and behavior patterns in the saved memories. Focus on what repeats across time, not one-off moments.",

  execute:
    "Mode: Execute. Turn the saved memories into concrete next actions, deadlines, and sequencing. Prefer small next steps the user can complete within 24-72 hours.",

  recall:
    "Mode: Recall. Help the user find something they mentioned before but may have forgotten. Prioritize exact references, source titles, and short snippets.",

  decide:
    "Mode: Decide. Help with a decision by comparing the user's past notes, constraints, tradeoffs, and recurring values. Do not decide for the user; recommend a next move with reasons.",

  "weekly-review":
    "Mode: Weekly Review. Summarize the week using these sections: what changed, what repeated, what was avoided, what got finished, and what deserves attention next. Keep it concise and evidence-based.",
};

const IMAGE_EXTRACTION_PROMPT = `Extract the readable text from this image as accurately as possible.

Rules:
- Do not summarize the image.
- Do not describe the UI, background, colors, emojis, or layout unless needed to preserve meaning.
- Preserve message order from top to bottom.
- If this is a chat screenshot, format it as a conversation.
- Include speaker names if visible.
- If speaker names are not visible, use "Person 1" and "Person 2".
- Include timestamps if visible.
- If a word is unclear, write [unclear].
- Do not invent missing text.
- Return only the extracted text.`;

function env() {
  const apiKey = process.env.BTL_API_KEY;
  const baseURL = process.env.BTL_BASE_URL;
  const model = process.env.BTL_MODEL;

  if (!apiKey || !baseURL || !model) {
    throw new Error(
      "BTL Runtime is not configured. Set BTL_API_KEY, BTL_BASE_URL, and BTL_MODEL.",
    );
  }

  return {
    apiKey,
    baseURL: baseURL.replace(/\/$/, ""),
    completionsPath: baseURL.replace(/\/$/, "").endsWith("/v1")
      ? "/chat/completions"
      : "/v1/chat/completions",
    model,
  };
}

function createBtlClient(config: ReturnType<typeof env>) {
  return axios.create({
    baseURL: config.baseURL,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    timeout: 45_000,
  });
}

function formatContext(context: RetrievedMemory[]) {
  if (context.length === 0) {
    return "No memory evidence was retrieved for this question.";
  }

  return context
    .map((item, index) => {
      const date = new Date(item.sourceDate).toISOString().slice(0, 10);

      return `[${index + 1}]
Title: ${item.sourceTitle}
Type: ${item.sourceType}
Date: ${date}
Snippet: ${item.snippet}`;
    })
    .join("\n\n");
}

export async function generateMemoryReflection({
  question,
  context,
  mode,
}: {
  question: string;
  context: RetrievedMemory[];
  mode: ChatMode;
}) {
  const config = env();
  const client = createBtlClient(config);

  const messages: BtlMessage[] = [
    {
      role: "system",
      content: `${SYSTEM_PROMPT}

${MODE_PROMPTS[mode]}`,
    },
    {
      role: "user",
      content: `Saved memories:
${formatContext(context)}

User question:
${question}`,
    },
  ];

  const response = await client.post<BtlChatResponse>(config.completionsPath, {
    model: config.model,
    messages,
    temperature: 0.35,
  });

  const answer = response.data.choices?.[0]?.message?.content?.trim();

  if (!answer) {
    throw new Error("BTL Runtime returned an empty response.");
  }

  return answer;
}

export async function extractMemoryFromImage({
  base64,
  fileName,
  mimeType,
}: {
  base64: string;
  fileName: string;
  mimeType: string;
}) {
  const config = env();
  const client = createBtlClient(config);
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const messages: BtlMessage[] = [
    {
      role: "system",
      content: IMAGE_EXTRACTION_PROMPT,
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Extract the readable text from this uploaded image named "${fileName}".`,
        },
        {
          type: "image_url",
          image_url: {
            url: dataUrl,
            detail: "high",
          },
        },
      ],
    },
  ];

  const response = await client.post<BtlChatResponse>(config.completionsPath, {
    model: config.model,
    messages,
    temperature: 0.2,
  });

  const text = response.data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("BTL Runtime could not read text from this image.");
  }

  return text;
}
