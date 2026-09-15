"use client";

import { useState } from "react";
import Image from "next/image";
import type { MediaItem } from "@/lib/media";

export function MediaCarousel({ images }: { images: MediaItem[] }) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  function go(delta: number) {
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div className="relative bg-slate-100">
      <div className="relative aspect-square w-full sm:aspect-[4/3]">
        <Image
          src={images[index].url}
          alt={images[index].name || `Slide ${index + 1}`}
          fill
          className="object-contain"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next image"
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white"
          >
            ›
          </button>

          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {index + 1}/{images.length}
          </span>

          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === index ? "bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
