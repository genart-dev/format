import { describe, it, expect } from "vitest";
import {
  LIBRARY_PRESETS,
  resolveLibrary,
  resolveLibraries,
  listLibraryPresets,
} from "./library-presets.js";
import type { LibraryDependency } from "./types.js";

describe("LIBRARY_PRESETS", () => {
  it("contains p5.brush", () => {
    expect(LIBRARY_PRESETS["p5.brush"]).toBeDefined();
  });

  it("p5.brush has required fields", () => {
    const lib = LIBRARY_PRESETS["p5.brush"]!;
    expect(lib.name).toBe("p5.brush");
    expect(lib.version).toMatch(/^\d+\.\d+/);
    expect(lib.cdnUrl).toMatch(/^https:\/\//);
    expect(lib.globalName).toBe("brush");
    expect(lib.renderers).toContain("p5");
    expect(lib.license).toBe("MIT");
    expect(lib.copyright).toMatch(/copyright/i);
    expect(lib.url).toMatch(/^https:\/\//);
  });

  it("p5.brush requires p5.js 2.x", () => {
    expect(LIBRARY_PRESETS["p5.brush"]!.rendererVersionRequirement).toBe("2.x");
  });

  it("all presets have unique names matching their keys", () => {
    for (const [key, lib] of Object.entries(LIBRARY_PRESETS)) {
      expect(lib.name).toBe(key);
    }
  });

  it("all cdnUrls are https", () => {
    for (const lib of Object.values(LIBRARY_PRESETS)) {
      expect(lib.cdnUrl).toMatch(/^https:\/\//);
    }
  });
});

describe("resolveLibrary", () => {
  it("resolves a known preset name", () => {
    const lib = resolveLibrary("p5.brush");
    expect(lib.name).toBe("p5.brush");
    expect(lib.globalName).toBe("brush");
  });

  it("passes through an existing LibraryDependency unchanged", () => {
    const custom: LibraryDependency = {
      name: "my-lib",
      version: "1.0.0",
      cdnUrl: "https://example.com/my-lib.js",
      globalName: "myLib",
      renderers: ["p5"],
      license: "MIT",
      copyright: "Copyright 2024",
      url: "https://example.com",
    };
    expect(resolveLibrary(custom)).toBe(custom);
  });

  it("throws for unknown preset name", () => {
    expect(() => resolveLibrary("not-a-library")).toThrow(
      /Unknown library preset "not-a-library"/
    );
  });

  it("error message lists known presets", () => {
    expect(() => resolveLibrary("unknown")).toThrow(/p5\.brush/);
  });
});

describe("resolveLibraries", () => {
  it("resolves a mixed array of names and objects", () => {
    const custom: LibraryDependency = {
      name: "custom",
      version: "0.1.0",
      cdnUrl: "https://example.com/custom.js",
      globalName: "custom",
      renderers: ["canvas2d"],
      license: "MIT",
      copyright: "Copyright 2024",
      url: "https://example.com",
    };
    const result = resolveLibraries(["p5.brush", custom]);
    expect(result).toHaveLength(2);
    expect(result[0]!.name).toBe("p5.brush");
    expect(result[1]).toBe(custom);
  });

  it("returns empty array for empty input", () => {
    expect(resolveLibraries([])).toEqual([]);
  });
});

describe("listLibraryPresets", () => {
  it("returns an array of preset names", () => {
    const names = listLibraryPresets();
    expect(names).toContain("p5.brush");
    expect(Array.isArray(names)).toBe(true);
  });

  it("matches keys in LIBRARY_PRESETS", () => {
    expect(new Set(listLibraryPresets())).toEqual(
      new Set(Object.keys(LIBRARY_PRESETS))
    );
  });
});
