import { describe, it, expect } from "vitest";
import { CANVAS_PRESETS, resolvePreset } from "./presets.js";

describe("CANVAS_PRESETS", () => {
  it("contains all expected categories", () => {
    const categories = new Set(CANVAS_PRESETS.map((p) => p.category));
    expect(categories).toEqual(
      new Set(["square", "landscape", "portrait", "print", "social"]),
    );
  });

  it("has unique ids", () => {
    const ids = CANVAS_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has positive dimensions for all presets", () => {
    for (const p of CANVAS_PRESETS) {
      expect(p.width).toBeGreaterThan(0);
      expect(p.height).toBeGreaterThan(0);
    }
  });
});

describe("resolvePreset", () => {
  it("resolves square-1200", () => {
    expect(resolvePreset("square-1200")).toEqual({
      width: 1200,
      height: 1200,
    });
  });

  it("resolves hd-1920x1080", () => {
    expect(resolvePreset("hd-1920x1080")).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it("resolves square-600", () => {
    expect(resolvePreset("square-600")).toEqual({ width: 600, height: 600 });
  });

  it("throws on unknown preset with descriptive error", () => {
    expect(() => resolvePreset("giant-9999")).toThrow(
      /Unknown canvas preset "giant-9999"/,
    );
    expect(() => resolvePreset("giant-9999")).toThrow(/Valid presets:/);
  });
});
