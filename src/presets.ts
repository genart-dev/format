import type { CanvasPreset } from "./types.js";

/** All built-in canvas dimension presets. */
export const CANVAS_PRESETS: readonly CanvasPreset[] = [
  // Square
  { id: "square-600", label: "Square 600", category: "square", width: 600, height: 600 },
  { id: "square-1200", label: "Square 1200", category: "square", width: 1200, height: 1200 },
  { id: "square-2400", label: "Square 2400", category: "square", width: 2400, height: 2400 },
  { id: "square-4096", label: "Square 4096", category: "square", width: 4096, height: 4096 },

  // Landscape
  { id: "hd-1920x1080", label: "HD 1920\u00D71080", category: "landscape", width: 1920, height: 1080 },
  { id: "2k-2560x1440", label: "2K 2560\u00D71440", category: "landscape", width: 2560, height: 1440 },
  { id: "ultrawide-2560x1080", label: "Ultrawide 21:9", category: "landscape", width: 2560, height: 1080 },
  { id: "4k-3840x2160", label: "4K UHD", category: "landscape", width: 3840, height: 2160 },

  // Portrait
  { id: "phone-390x844", label: "Phone 390\u00D7844", category: "portrait", width: 390, height: 844 },
  { id: "tablet-768x1024", label: "Tablet 768\u00D71024", category: "portrait", width: 768, height: 1024 },
  { id: "poster-2400x3600", label: "Poster 2:3", category: "portrait", width: 2400, height: 3600 },

  // Print (300 DPI reference)
  { id: "a4-2480x3508", label: "A4 (300 DPI)", category: "print", width: 2480, height: 3508 },
  { id: "a3-3508x4961", label: "A3 (300 DPI)", category: "print", width: 3508, height: 4961 },
  { id: "us-letter-2550x3300", label: "US Letter (300 DPI)", category: "print", width: 2550, height: 3300 },

  // Social
  { id: "instagram-1080x1080", label: "Instagram", category: "social", width: 1080, height: 1080 },
  { id: "twitter-1200x675", label: "Twitter/X", category: "social", width: 1200, height: 675 },
  { id: "og-1200x630", label: "Open Graph", category: "social", width: 1200, height: 630 },
] as const;

/** Lookup table keyed by preset id. */
const presetMap = new Map<string, CanvasPreset>(
  CANVAS_PRESETS.map((p) => [p.id, p]),
);

/**
 * Resolve a named preset to its width and height.
 * @throws Error if the preset name is not recognized.
 */
export function resolvePreset(preset: string): { width: number; height: number } {
  const entry = presetMap.get(preset);
  if (!entry) {
    const known = CANVAS_PRESETS.map((p) => p.id).join(", ");
    throw new Error(
      `Unknown canvas preset "${preset}". Valid presets: ${known}`,
    );
  }
  return { width: entry.width, height: entry.height };
}
