import OpenAI from "openai";
import { fetchPageText } from "@/lib/link-crawler";

// Constructed lazily (not at module load) so a missing OPENAI_API_KEY
// surfaces as a catchable error inside the request handler instead of
// crashing module evaluation.
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI();
  return _client;
}

// Cheap, high-throughput model for the mechanical work of reading crawled
// pages and pulling out grounded facts.
const RESEARCH_MODEL = process.env.OPENAI_RESEARCH_MODEL ?? "gpt-5.4-nano";
// Flagship model for the actual copywriting, since it has to follow a long,
// nuanced style guide (single takeaway, sentence-to-sentence causality,
// exact word-count targets, banned phrases, etc.) reliably.
const COPY_MODEL = process.env.OPENAI_COPY_MODEL ?? "gpt-5.5";

type CopyType = "REPOST" | "COMMENT";

/**
 * Agent 1 — Research agent. Crawls each reference link server-side and asks
 * a cheap model to extract only the facts/claims actually present in the
 * source, so the copywriting agent has grounded material instead of having
 * to guess or invent details.
 */
export async function researchLinks(links: string[]): Promise<string> {
  if (links.length === 0) return "";

  const pages = await Promise.all(
    links.map(async (link) => {
      const text = await fetchPageText(link);
      return { link, text };
    }),
  );

  const usable = pages.filter((p): p is { link: string; text: string } => !!p.text);
  if (usable.length === 0) return "";

  const sourcesBlock = usable
    .map((p, i) => `Source ${i + 1} (${p.link}):\n"""\n${p.text}\n"""`)
    .join("\n\n");

  const response = await getClient().responses.create({
    model: RESEARCH_MODEL,
    reasoning: { effort: "low" },
    instructions: [
      "You extract grounded facts from source web pages so another writer can accurately reference them.",
      "Read the source material and list ONLY facts, claims, numbers, names, and context that are",
      "explicitly present in the text. Do not infer, summarize opinions as facts, or add anything not stated.",
      "Output a short bulleted list (max ~8 bullets total across all sources). If a source's content looks",
      "like boilerplate/navigation with no real substance, skip it silently. If nothing usable is found",
      "across all sources, output exactly: NONE",
    ].join(" "),
    input: sourcesBlock,
    // Reasoning tokens count against this budget and vary run to run, so
    // leave generous headroom beyond the short bullet list we actually want.
    max_output_tokens: 1500,
  });

  const text = response.output_text?.trim() ?? "";
  return text === "NONE" ? "" : text;
}

/**
 * Agent 2 — Copywriter agent. Writes the actual repost caption or comment,
 * following the full writing-instructions style guide, grounded in the
 * post's own caption plus whatever the research agent pulled from linked
 * sources, and explicitly steered away from repeating past generations.
 */
export async function generateAmplifiedCopy({
  writingInstructions,
  postCaption,
  postLinks,
  contextBrief,
  type,
  recentExamples,
}: {
  writingInstructions: string;
  postCaption: string;
  postLinks: string[];
  contextBrief: string;
  type: CopyType;
  recentExamples: string[];
}): Promise<string> {
  const instructions = [
    "You write LinkedIn repost captions and comments for employees at Opus Technologies who are amplifying",
    "a company post. Follow the writing-instructions document below exactly — every rule, length target,",
    "and item in the 'what to avoid' list. Output ONLY the finished copy text: no preamble, no quotation",
    "marks, no markdown, no labels, no word count notes.",
    "",
    "# Writing instructions",
    writingInstructions,
  ].join("\n");

  const kindInstruction =
    type === "REPOST"
      ? "Write a REPOST caption (target ~80 words per the length rules above): the text an employee adds above the shared post when they reshare it on their own LinkedIn profile."
      : "Write a COMMENT (target ~45 words per the length rules above): a reply the employee posts directly on the original company post. Do not repeat the original post.";

  const linksBlock =
    postLinks.length > 0
      ? `Links included in the original post:\n${postLinks.join("\n")}`
      : "";

  const contextBlock = contextBrief
    ? `Additional grounded facts pulled from the post's linked sources (use only what's relevant, don't force all of it in):\n${contextBrief}`
    : "";

  const avoidBlock =
    recentExamples.length > 0
      ? [
          "Copy already generated for this post (by this or other employees) — your new copy must open",
          "differently and use a different structure and wording than every one of these:",
          ...recentExamples.map((ex, i) => `${i + 1}. ${ex}`),
        ].join("\n")
      : "";

  const userInput = [
    kindInstruction,
    "",
    `Original post caption (source of truth — do not add facts beyond this and the grounded facts below):\n"""\n${postCaption}\n"""`,
    linksBlock,
    contextBlock,
    avoidBlock,
    "",
    `Variation seed (ignore the value itself, just ensure this generation is fresh): ${crypto.randomUUID()}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await getClient().responses.create({
    model: COPY_MODEL,
    // "low" is enough for gpt-5.5 to reliably follow the style guide on a
    // short social-copy task, and keeps reasoning-token spend (which counts
    // against max_output_tokens and varies run to run) well clear of the cap.
    reasoning: { effort: "low" },
    instructions,
    input: userInput,
    // Generous headroom over the ~80/~45-word target: reasoning tokens are
    // invisible but billed against this same budget, and running out mid-
    // reasoning returns an empty response instead of an error.
    max_output_tokens: 2000,
  });

  const text = response.output_text?.trim();
  if (!text) {
    const incompleteReason = response.incomplete_details?.reason;
    throw new Error(
      incompleteReason
        ? `OpenAI response was incomplete (${incompleteReason}).`
        : "OpenAI did not return text content.",
    );
  }

  return text;
}
