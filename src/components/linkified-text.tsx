import { Fragment } from "react";

const URL_REGEX = /(https?:\/\/[^\s<>"')\]}]+)/g;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}]+$/;

function splitTrailingPunctuation(url: string): [string, string] {
  const match = url.match(TRAILING_PUNCTUATION);
  if (!match) return [url, ""];
  return [url.slice(0, -match[0].length), match[0]];
}

/**
 * Renders text with any bare URLs turned into clickable links, matching
 * LinkedIn's own behavior for URLs typed directly into a post. Preserves
 * line breaks via the caller's `white-space: pre-wrap`.
 */
export function LinkifiedText({ text }: { text: string }) {
  const parts = text.split(URL_REGEX);

  return (
    <>
      {parts.map((part, i) => {
        const isUrl = /^https?:\/\//.test(part);
        if (!isUrl) return <Fragment key={i}>{part}</Fragment>;

        const [href, trailing] = splitTrailingPunctuation(part);
        return (
          <Fragment key={i}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {href}
            </a>
            {trailing}
          </Fragment>
        );
      })}
    </>
  );
}
