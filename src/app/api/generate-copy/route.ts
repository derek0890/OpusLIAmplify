import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateAmplifiedCopy } from "@/lib/claude";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const postId = body?.postId;
  const type = body?.type;

  if (typeof postId !== "string" || (type !== "REPOST" && type !== "COMMENT")) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post || post.status !== "PUBLISHED") {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const styleGuide = await prisma.styleGuide.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const recent = await prisma.amplifiedCopy.findMany({
    where: { postId, type },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { content: true },
  });

  try {
    const content = await generateAmplifiedCopy({
      styleGuide: styleGuide?.content ?? "",
      postCaption: post.caption,
      postLinks: JSON.parse(post.linksJson || "[]"),
      type,
      recentExamples: recent.map((r) => r.content),
    });

    const saved = await prisma.amplifiedCopy.create({
      data: {
        postId,
        userId: session.user.id,
        type,
        content,
      },
    });

    return NextResponse.json({ id: saved.id, content: saved.content });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("Anthropic auth error:", error.message);
      return NextResponse.json(
        { error: "AI copy generation isn't configured yet. Contact an admin." },
        { status: 500 },
      );
    }
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "We're generating a lot of copy right now — try again in a moment." },
        { status: 429 },
      );
    }
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", error.status, error.message);
      return NextResponse.json(
        { error: "Couldn't generate copy right now. Try again." },
        { status: 502 },
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("Could not resolve authentication method")
    ) {
      console.error("Anthropic client not configured:", error.message);
      return NextResponse.json(
        { error: "AI copy generation isn't configured yet. Contact an admin." },
        { status: 500 },
      );
    }
    console.error("generate-copy error:", error);
    return NextResponse.json(
      { error: "Something went wrong generating your copy." },
      { status: 500 },
    );
  }
}
