import * as cheerio from "cheerio";

const FETCH_TIMEOUT_MS = 8000;
const MAX_CHARS_PER_PAGE = 6000;

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^::1$/,
  /^\[::1\]$/,
];

function isBlockedUrl(url: URL): boolean {
  if (url.protocol !== "http:" && url.protocol !== "https:") return true;
  return BLOCKED_HOSTNAME_PATTERNS.some((re) => re.test(url.hostname));
}

/**
 * Fetches a URL server-side and extracts readable text (title + meta
 * description + body copy) for grounding AI-generated copy. Best-effort:
 * failures return null rather than throwing, so one bad link doesn't sink
 * the whole generation request.
 */
export async function fetchPageText(rawUrl: string): Promise<string | null> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (isBlockedUrl(url)) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(url.toString(), {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "OpusAmplifyBot/1.0 (+internal employee advocacy tool)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("html")) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    $("script, style, nav, footer, noscript, svg, iframe").remove();

    const title = $("title").first().text().trim();
    const metaDescription = $('meta[name="description"]').attr("content") ?? "";
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    const combined = [title, metaDescription, bodyText]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, MAX_CHARS_PER_PAGE);

    return combined || null;
  } catch {
    return null;
  }
}
