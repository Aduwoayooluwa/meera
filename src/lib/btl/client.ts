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

const SYSTEM_PROMPT = `You are Memory Mirror, a direct but careful reflection assistant.
Use only the user's saved memories.
Do not invent facts. If evidence is weak, say so.
Include concrete evidence: source titles, dates, or short snippets.
Give practical next actions.
Do not pretend to be a therapist or doctor.
Return valid Markdown using this shape:
1. **Pattern**
2. **Evidence**
3. **Interpretation**
4. **Next action**
5. **Confidence**`;

const MODE_PROMPTS: Record<ChatMode, string> = {
  reflect:
    "Mode: Reflect. Find emotional, thinking, and behavior patterns in the saved memories.",
  execute:
    "Mode: Execute. Turn the saved memories into concrete next actions, deadlines, and sequencing.",
  recall:
    "Mode: Recall. Help the user find something they mentioned before but may have forgotten.",
  decide:
    "Mode: Decide. Help with a decision by comparing the user's past notes, constraints, and recurring values.",
  "weekly-review":
    "Mode: Weekly Review. Summarize the week using these sections: what changed, what repeated, what was avoided, what got finished, and what deserves attention next.",
};

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
      const date = new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(item.sourceDate));

      return `[${index + 1}] ${item.sourceTitle} (${item.sourceType}, ${date})
${item.content}`;
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
      content: `Question: ${question}

Retrieved memories:
${formatContext(context)}`,
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
      content:
        "You turn uploaded images and screenshots into useful Memory Mirror source text. Extract visible text, summarize meaningful context, and preserve concrete details. Do not invent hidden facts. Return plain text only.",
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Read this uploaded memory image named "${fileName}". Return an editable memory note with any visible text and a concise description of what the image seems to capture.`,
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
