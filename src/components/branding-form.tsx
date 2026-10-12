"use client";

import { useState } from "react";
import { updateBrandingAccent } from "@/lib/actions/branding";
import { contrastForeground, isValidHexColor } from "@/lib/color";

const PRESETS = [
  { label: "Indigo", value: "#4f46e5" },
  { label: "Blue", value: "#2563eb" },
  { label: "Emerald", value: "#059669" },
  { label: "Rose", value: "#e11d48" },
  { label: "Amber", value: "#d97706" },
  { label: "Graphite", value: "#111827" },
];

export function BrandingForm({ initialColor }: { initialColor: string }) {
  const [color, setColor] = useState(initialColor);
  const [error, setError] = useState<string | null>(null);

  const valid = isValidHexColor(color);
  const previewForeground = valid ? contrastForeground(color) : "#ffffff";

  function handleSubmit(formData: FormData) {
    if (!isValidHexColor(color)) {
      setError("Enter a color as a 6-digit hex code, e.g. #4f46e5.");
      return;
    }
    setError(null);
    return updateBrandingAccent(formData);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Accent color
        </label>
        <p className="mb-3 text-sm text-slate-500">
          Used for primary buttons, links, active states, and badges across
          the whole app. Pick one color — readable text and hover/soft
          shades are generated from it automatically.
        </p>

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={valid ? color : "#4f46e5"}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-md border border-slate-300 p-1"
            aria-label="Accent color picker"
          />
          <input
            type="text"
            name="accentColor"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#4f46e5"
            spellCheck={false}
            className="w-32 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-accent-strong focus:ring-1 focus:ring-accent-strong"
          />
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setColor(preset.value)}
              className="flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <span
                className="h-3 w-3 rounded-full border border-black/10"
                style={{ backgroundColor: preset.value }}
              />
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl border border-slate-200 bg-slate-50 p-5"
        style={valid ? ({ "--accent": color } as React.CSSProperties) : undefined}
      >
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
          Live preview
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: valid ? color : "#4f46e5", color: previewForeground }}
          >
            Primary button
          </button>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent-strong">
            Active badge
          </span>
          <a className="text-sm font-medium text-accent-strong hover:underline">
            A link
          </a>
        </div>
      </div>

      <button
        type="submit"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent-hover"
      >
        Save accent color
      </button>
    </form>
  );
}
