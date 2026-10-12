// Single source of truth for the product's own name, so a rebrand never
// means hunting down a string repeated across pages/emails/metadata.
export const APP_NAME = "Relay";
export const DEFAULT_ACCENT_COLOR = "#4f46e5";

// Curated font choices for /admin/branding (Super Admin only). Each `cssVar`
// is a next/font CSS variable already loaded globally in the root layout
// (see src/app/layout.tsx) — picking one just points --font-sans at it.
export const FONT_OPTIONS = [
  { key: "geist", label: "Geist (default)", cssVar: "var(--font-geist-sans)" },
  { key: "inter", label: "Inter", cssVar: "var(--font-inter)" },
  { key: "manrope", label: "Manrope", cssVar: "var(--font-manrope)" },
  { key: "space-grotesk", label: "Space Grotesk", cssVar: "var(--font-space-grotesk)" },
] as const;

export type FontKey = (typeof FONT_OPTIONS)[number]["key"];

export const DEFAULT_FONT_KEY: FontKey = "geist";

export function fontCssVar(key: string): string {
  return FONT_OPTIONS.find((f) => f.key === key)?.cssVar ?? FONT_OPTIONS[0].cssVar;
}
