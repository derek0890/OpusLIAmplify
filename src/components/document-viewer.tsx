"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Polyfill for browsers whose V8/JSC build predates the TC39
// Map.prototype.getOrInsertComputed proposal, which pdfjs-dist 6.x calls
// unconditionally. No-op once a browser supports it natively.
if (typeof Map !== "undefined" && !("getOrInsertComputed" in Map.prototype)) {
  Object.defineProperty(Map.prototype, "getOrInsertComputed", {
    value(key: unknown, callbackfn: (key: unknown) => unknown) {
      if (!this.has(key)) {
        this.set(key, callbackfn(key));
      }
      return this.get(key);
    },
    writable: true,
    configurable: true,
  });
}

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export default function DocumentViewer({ url, name }: { url: string; name: string }) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState(false);

  function go(delta: number) {
    setPageNumber((p) => {
      const max = numPages ?? p;
      return Math.min(Math.max(1, p + delta), max);
    });
  }

  return (
    <div className="border-y border-slate-200 bg-slate-50">
      <div className="relative flex justify-center bg-slate-200 py-2">
        {error ? (
          <div className="flex h-72 w-full items-center justify-center text-sm text-slate-500">
            Couldn&apos;t preview this document.
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            onLoadError={() => setError(true)}
            loading={
              <div className="flex h-72 items-center justify-center text-sm text-slate-500">
                Loading document…
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={520}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        )}

        {numPages && numPages > 1 && !error && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={pageNumber <= 1}
              aria-label="Previous page"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white disabled:opacity-30"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={pageNumber >= numPages}
              aria-label="Next page"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white disabled:opacity-30"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2">
        <span className="text-base">📄</span>
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{name}</span>
        {numPages && (
          <span className="flex-shrink-0 text-xs text-slate-400">
            {pageNumber} / {numPages}
          </span>
        )}
      </div>
    </div>
  );
}
