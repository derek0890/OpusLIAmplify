import { getStyleGuide, updateStyleGuide } from "@/lib/actions/style-guide";

export default async function StyleGuidePage() {
  const content = await getStyleGuide();

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-slate-900">
        AI Style Guide
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        This Markdown guide steers the tone and structure of every
        AI-generated repost and comment. Edit it to match your brand voice —
        changes apply to every new copy generated after you save.
      </p>

      <form action={updateStyleGuide} className="mt-6">
        <textarea
          name="content"
          required
          rows={28}
          defaultValue={content}
          className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 font-mono text-sm leading-relaxed outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Save style guide
        </button>
      </form>
    </div>
  );
}
