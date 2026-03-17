import type { LibraryDependency } from "./types.js";

// ---------------------------------------------------------------------------
// Curated library preset registry (ADR 086)
// ---------------------------------------------------------------------------

/**
 * Curated registry of external libraries compatible with genart renderers.
 *
 * Each entry is fully resolved — it provides the CDN URL, global name, license
 * info, and any renderer runtime version override needed. Consumers call
 * `resolveLibrary("p5.brush")` to get the canonical `LibraryDependency`.
 */
export const LIBRARY_PRESETS: Record<string, LibraryDependency> = {
  "p5.brush": {
    name: "p5.brush",
    version: "2.0.3-beta",
    cdnUrl: "https://cdn.jsdelivr.net/npm/p5.brush@2.0.3-beta/dist/p5.brush.js",
    globalName: "brush",
    renderers: ["p5"],
    license: "MIT",
    copyright: "Copyright (c) 2024 Alejandro Campos Uribe",
    url: "https://github.com/acamposuribe/p5.brush",
    /**
     * p5.brush v2 requires p5.js 2.x (WEBGL mode, auto-init API).
     * Setting this causes the p5 adapter to load p5.js 2.0.3 instead of the
     * default 1.11.3, and switches the algorithm template to WEBGL mode.
     */
    rendererVersionRequirement: "2.x",
  },
} as const;

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

/**
 * Resolve a library name or pass-through an existing `LibraryDependency`.
 *
 * - String input: looks up in `LIBRARY_PRESETS`, throws if unknown.
 * - Object input: returned unchanged (allows custom / inline deps).
 *
 * @param nameOrDep - Preset name (e.g. "p5.brush") or a full dependency object.
 * @throws {Error} If `nameOrDep` is a string not found in `LIBRARY_PRESETS`.
 */
export function resolveLibrary(nameOrDep: string | LibraryDependency): LibraryDependency {
  if (typeof nameOrDep === "string") {
    const preset = LIBRARY_PRESETS[nameOrDep];
    if (!preset) {
      const known = Object.keys(LIBRARY_PRESETS).join(", ");
      throw new Error(
        `Unknown library preset "${nameOrDep}". Known presets: ${known}`
      );
    }
    return preset;
  }
  return nameOrDep;
}

/**
 * Resolve an array of library names or dependency objects.
 * Convenience wrapper around `resolveLibrary` for batch resolution.
 */
export function resolveLibraries(
  deps: readonly (string | LibraryDependency)[]
): LibraryDependency[] {
  return deps.map(resolveLibrary);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the names of all curated library presets.
 */
export function listLibraryPresets(): string[] {
  return Object.keys(LIBRARY_PRESETS);
}
