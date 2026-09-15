import { NextRequest, NextResponse } from "next/server";
import { AuthenticationError, RateLimitError, APIError, OpenAIError } from "openai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { researchLinks, generateAmplifiedCopy } from "@/lib/openai";

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
    const publicLinks: string[] = JSON.parse(post.linksJson || "[]");
    const contextLinks: string[] = JSON.parse(post.contextLinksJson || "[]");

    // Agent 1 (research): crawl reference + public links and extract grounded
    // facts. Cached on the post so repeat generations (and other employees
    // amplifying the same post) don't re-crawl every time.
    let contextBrief = post.contextBrief;
    if (contextBrief === null) {
      const linksToResearch = [...new Set([...contextLinks, ...publicLinks])];
      contextBrief = await researchLinks(linksToResearch);
      await prisma.post.update({
        where: { id: post.id },
        data: { contextBrief },
      });
    }

    // Agent 2 (copywriter): write the actual repost caption or comment.
    const content = await generateAmplifiedCopy({
      writingInstructions: styleGuide?.content ?? "",
      postCaption: post.caption,
      postLinks: publicLinks,
      contextBrief,
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
    if (error instanceof AuthenticationError) {
      console.error("OpenAI auth error:", error.message);
      return NextResponse.json(
        { error: "AI copy generation isn't configured yet. Contact an admin." },
        { status: 500 },
      );
    }
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: "We're generating a lot of copy right now — try again in a moment." },
        { status: 429 },
      );
    }
    if (error instanceof APIError) {
      console.error("OpenAI API error:", error.status, error.message);
      return NextResponse.json(
        { error: "Couldn't generate copy right now. Try again." },
        { status: 502 },
      );
    }
    if (error instanceof OpenAIError) {
      console.error("OpenAI client not configured:", error.message);
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
