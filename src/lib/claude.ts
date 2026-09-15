import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const MODEL = "claude-opus-5";

type CopyType = "REPOST" | "COMMENT";

export async function generateAmplifiedCopy({
  styleGuide,
  postCaption,
  postLinks,
  type,
  recentExamples,
}: {
  styleGuide: string;
  postCaption: string;
  postLinks: string[];
  type: CopyType;
  recentExamples: string[];
}): Promise<string> {
  const system = [
    {
      type: "text" as const,
      text: [
        "You write LinkedIn copy for employees at Opus Technologies who are amplifying",
        "a company post by reposting it or commenting on it. Follow the voice guide below exactly.",
        "Output ONLY the finished copy text — no preamble, no quotation marks, no markdown, no labels.",
        "",
        "# Voice guide",
        styleGuide,
      ].join("\n"),
      cache_control: { type: "ephemeral" as const },
    },
  ];

  const kindInstructions =
    type === "REPOST"
      ? "Write a REPOST caption: the text an employee adds above the shared post when they reshare it on their own LinkedIn profile."
      : "Write a COMMENT: a reply the employee posts directly on the original company post.";

  const linksBlock =
    postLinks.length > 0
      ? `Links included in the post (mention naturally if relevant, don't force it):\n${postLinks.join("\n")}`
      : "No links included in this post.";

  const avoidBlock =
    recentExamples.length > 0
      ? [
          "",
          "Copy already generated for this post (by this or other employees) — your new copy must be clearly",
          "different in opening line, structure, and wording from every one of these:",
          ...recentExamples.map((ex, i) => `${i + 1}. ${ex}`),
        ].join("\n")
      : "";

  const user = [
    kindInstructions,
    "",
    `Original post caption:\n"""\n${postCaption}\n"""`,
    "",
    linksBlock,
    avoidBlock,
    "",
    `Variation seed (ignore the value itself, just use it to ensure this generation is fresh): ${crypto.randomUUID()}`,
  ]
    .filter(Boolean)
    .join("\n");

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    system,
    output_config: { effort: "low" },
    messages: [{ role: "user", content: user }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude did not return text content.");
  }

  return textBlock.text.trim();
}
