import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generateMemoryReflection } from "@/lib/btl/client";
import { retrieveContext } from "@/lib/memory/retrieve-context";
import { prisma } from "@/lib/prisma";
import { chatRequestSchema } from "@/lib/validators";
import { getWorkspace } from "@/lib/workspace/get-workspace";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = chatRequestSchema.parse(body);
    const workspace = await getWorkspace();

    const session = parsed.sessionId
      ? await prisma.chatSession.findFirst({
          where: {
            id: parsed.sessionId,
            workspaceId: workspace.id,
          },
        })
      : null;

    const activeSession =
      session ??
      (await prisma.chatSession.create({
        data: {
          workspaceId: workspace.id,
          title: parsed.message.slice(0, 80),
        },
      }));

    const context = await retrieveContext(workspace.id, parsed.message);

    await prisma.chatMessage.create({
      data: {
        sessionId: activeSession.id,
        role: "user",
        content: parsed.message,
      },
    });

    const answer = await generateMemoryReflection({
      question: parsed.message,
      context,
      mode: parsed.mode,
    });

    await prisma.chatMessage.create({
      data: {
        sessionId: activeSession.id,
        role: "assistant",
        content: answer,
        contextJson: context,
      },
    });

    await prisma.reflection.create({
      data: {
        workspaceId: workspace.id,
        questionType: parsed.mode,
        question: parsed.message,
        answer,
        evidenceJson: context,
      },
    });

    await prisma.chatSession.update({
      where: {
        id: activeSession.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    const evidence = context.map((item) => ({
      chunkId: item.chunkId,
      sourceId: item.sourceId,
      sourceTitle: item.sourceTitle,
      sourceType: item.sourceType,
      sourceDate: item.sourceDate,
      snippet: item.snippet,
      score: item.score,
    }));

    return NextResponse.json({
      sessionId: activeSession.id,
      answer,
      evidence,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error:
            error.issues[0]?.message ??
            "Ask a little more so Meera has something to reflect on.",
        },
        {
          status: 400,
        },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Memory Mirror could not answer right now.";
    const status = message.includes("sign in")
      ? 401
      : message.includes("BTL Runtime")
      ? 503
      : 400;

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
      },
    );
  }
}
