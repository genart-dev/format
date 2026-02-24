import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseGenart, serializeGenart } from "./genart.js";

const SPECS_DIR = resolve(__dirname, "../../specs");
const INVALID_DIR = resolve(SPECS_DIR, "invalid");

function loadFixture(filename: string): unknown {
  const raw = readFileSync(resolve(SPECS_DIR, filename), "utf-8");
  return JSON.parse(raw);
}

function loadInvalid(filename: string): unknown {
  const raw = readFileSync(resolve(INVALID_DIR, filename), "utf-8");
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Valid files
// ---------------------------------------------------------------------------

describe("parseGenart — valid fixtures", () => {
  it("parses minimal.genart", () => {
    const result = parseGenart(loadFixture("minimal.genart"));
    expect(result.id).toBe("minimal-example");
    expect(result.genart).toBe("1.1");
    expect(result.renderer).toEqual({ type: "p5", version: "1.x" });
    expect(result.canvas).toEqual({ width: 1200, height: 1200 });
    expect(result.parameters).toEqual([]);
    expect(result.colors).toEqual([]);
    expect(result.state.seed).toBe(42);
    expect(result.algorithm).toContain("function sketch");
  });

  it("parses full.genart with all optional fields", () => {
    const result = parseGenart(loadFixture("full.genart"));
    expect(result.id).toBe("full-example");
    expect(result.subtitle).toBe(
      "Every optional field populated for parser testing.",
    );
    expect(result.agent).toBe("claude-code");
    expect(result.model).toBe("claude-opus-4-6");
    expect(result.skills).toEqual([
      "typographic-contrast",
      "visual-elements-in-grids",
    ]);
    expect(result.renderer).toEqual({ type: "p5", version: "1.x" });
    expect(result.canvas.width).toBe(512);
    expect(result.canvas.height).toBe(512);
    expect(result.canvas.pixelDensity).toBe(2);
    expect(result.philosophy).toContain("# Full Example");
    expect(result.tabs).toHaveLength(3);
    expect(result.parameters).toHaveLength(4);
    expect(result.colors).toHaveLength(3);
    expect(result.themes).toHaveLength(3);
    expect(result.snapshots).toHaveLength(1);
    expect(result.snapshots![0]!.id).toBe("snapshot-001");
  });

  it("parses minimal.genart without agent/model fields", () => {
    const result = parseGenart(loadFixture("minimal.genart"));
    expect(result.agent).toBeUndefined();
    expect(result.model).toBeUndefined();
  });

  it("defaults renderer to p5 for v1.0 files (v1-no-renderer.genart)", () => {
    const result = parseGenart(loadFixture("v1-no-renderer.genart"));
    expect(result.genart).toBe("1.0");
    expect(result.renderer).toEqual({ type: "p5" });
    expect(result.id).toBe("legacy-no-renderer");
  });

  it("parses canvas2d-sketch.genart", () => {
    const result = parseGenart(loadFixture("canvas2d-sketch.genart"));
    expect(result.renderer.type).toBe("canvas2d");
    expect(result.parameters).toHaveLength(2);
    expect(result.colors).toHaveLength(2);
  });

  it("parses glsl-sketch.genart", () => {
    const result = parseGenart(loadFixture("glsl-sketch.genart"));
    expect(result.renderer.type).toBe("glsl");
    expect(result.algorithm).toContain("#version 300 es");
  });

  it("parses three-sketch.genart", () => {
    const result = parseGenart(loadFixture("three-sketch.genart"));
    expect(result.renderer).toEqual({ type: "three", version: "0.160.x" });
    expect(result.canvas.width).toBe(512);
    expect(result.canvas.height).toBe(512);
    expect(result.themes).toHaveLength(2);
    expect(result.snapshots).toHaveLength(1);
  });

  it("parses svg-sketch.genart", () => {
    const result = parseGenart(loadFixture("svg-sketch.genart"));
    expect(result.renderer.type).toBe("svg");
    expect(result.snapshots).toEqual([]);
  });

  it("parses no-snapshots.genart (empty snapshots array)", () => {
    const result = parseGenart(loadFixture("no-snapshots.genart"));
    expect(result.canvas.preset).toBe("square-600");
    expect(result.snapshots).toEqual([]);
  });

  it("parses components-shorthand.genart (string shorthand)", () => {
    const result = parseGenart(loadFixture("components-shorthand.genart"));
    expect(result.genart).toBe("1.2");
    expect(result.components).toEqual({
      prng: "^1.0.0",
      math: "^1.0.0",
    });
    expect(result.algorithm).toContain("mulberry32");
  });

  it("parses components-resolved.genart (full resolved form)", () => {
    const result = parseGenart(loadFixture("components-resolved.genart"));
    expect(result.genart).toBe("1.2");
    expect(result.components).toBeDefined();
    const prng = result.components!["prng"];
    expect(typeof prng).toBe("object");
    expect((prng as { version: string }).version).toBe("1.0.0");
    expect((prng as { code: string }).code).toContain("mulberry32");
    expect((prng as { exports: string[] }).exports).toEqual(["mulberry32", "sfc32"]);
    const noise = result.components!["noise-2d"];
    expect(typeof noise).toBe("object");
    expect((noise as { exports: string[] }).exports).toEqual(["perlin2D", "simplex2D", "fbm2D"]);
  });

  it("parses components-inline.genart (code-only, no version)", () => {
    const result = parseGenart(loadFixture("components-inline.genart"));
    expect(result.genart).toBe("1.2");
    const myRng = result.components!["my-rng"];
    expect(typeof myRng).toBe("object");
    expect((myRng as { version?: string }).version).toBeUndefined();
    expect((myRng as { code: string }).code).toContain("xorshift32");
    expect((myRng as { exports: string[] }).exports).toEqual(["xorshift32"]);
  });

  it("parses components-mixed.genart (mix of shorthand and object forms)", () => {
    const result = parseGenart(loadFixture("components-mixed.genart"));
    expect(result.genart).toBe("1.2");
    expect(result.components!["prng"]).toBe("^1.0.0");
    const math = result.components!["math"];
    expect(typeof math).toBe("object");
    expect((math as { version: string }).version).toBe("1.0.0");
    expect((math as { code: string }).code).toContain("lerp");
    const helper = result.components!["my-helper"];
    expect(typeof helper).toBe("object");
    expect((helper as { version?: string }).version).toBeUndefined();
    expect((helper as { code: string }).code).toContain("myHelper");
  });

  it("parses files without components (backward compatible)", () => {
    const result = parseGenart(loadFixture("minimal.genart"));
    expect(result.components).toBeUndefined();
  });

  it("parses layers-basic.genart (text + grain layers)", () => {
    const result = parseGenart(loadFixture("layers-basic.genart"));
    expect(result.genart).toBe("1.2");
    expect(result.layers).toHaveLength(2);
    expect(result.layers![0]!.type).toBe("typography:text");
    expect(result.layers![0]!.name).toBe("Title Text");
    expect(result.layers![0]!.blendMode).toBe("normal");
    expect(result.layers![1]!.type).toBe("filter:grain");
    expect(result.layers![1]!.opacity).toBe(0.5);
    expect(result.layers![1]!.blendMode).toBe("overlay");
  });

  it("parses layers-with-components.genart (layers + components coexist)", () => {
    const result = parseGenart(loadFixture("layers-with-components.genart"));
    expect(result.genart).toBe("1.2");
    expect(result.components).toEqual({ prng: "^1.0.0" });
    expect(result.layers).toHaveLength(1);
    expect(result.layers![0]!.type).toBe("shape:rect");
    expect(result.layers![0]!.blendMode).toBe("multiply");
  });

  it("parses layers-group.genart (group with nested children)", () => {
    const result = parseGenart(loadFixture("layers-group.genart"));
    expect(result.layers).toHaveLength(1);
    const group = result.layers![0]!;
    expect(group.type).toBe("group");
    expect(group.children).toHaveLength(2);
    expect(group.children![0]!.type).toBe("typography:text");
    expect(group.children![1]!.type).toBe("shape:line");
    expect(group.children![1]!.locked).toBe(true);
  });

  it("parses files without layers (backward compatible)", () => {
    const result = parseGenart(loadFixture("minimal.genart"));
    expect(result.layers).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Invalid files
// ---------------------------------------------------------------------------

describe("parseGenart — invalid fixtures", () => {
  it("rejects missing-id.genart", () => {
    expect(() => parseGenart(loadInvalid("missing-id.genart"))).toThrow(
      'Missing required field "id"',
    );
  });

  it("rejects missing-algorithm.genart", () => {
    expect(() =>
      parseGenart(loadInvalid("missing-algorithm.genart")),
    ).toThrow('Missing required field "algorithm"');
  });

  it("rejects invalid-renderer-type.genart", () => {
    expect(() =>
      parseGenart(loadInvalid("invalid-renderer-type.genart")),
    ).toThrow(/Unknown renderer type "unity"/);
  });

  it("rejects invalid-canvas-preset.genart", () => {
    expect(() =>
      parseGenart(loadInvalid("invalid-canvas-preset.genart")),
    ).toThrow(/Unknown canvas preset "giant-9999"/);
  });

  it("rejects duplicate-param-keys.genart", () => {
    expect(() =>
      parseGenart(loadInvalid("duplicate-param-keys.genart")),
    ).toThrow(/Duplicate parameter key "margin"/);
  });

  it("rejects param-default-out-of-range.genart", () => {
    expect(() =>
      parseGenart(loadInvalid("param-default-out-of-range.genart")),
    ).toThrow(/default value 999 is outside range \[10, 100\]/);
  });

  it("rejects component with neither version nor code", () => {
    expect(() =>
      parseGenart(loadInvalid("invalid-component-no-version-no-code.genart")),
    ).toThrow(/must have at least "version" or "code"/);
  });

  it("rejects layer missing type field", () => {
    expect(() =>
      parseGenart(loadInvalid("invalid-layer-missing-type.genart")),
    ).toThrow(/"layers\[0\]\.type" must be a string/);
  });

  it("rejects layer with invalid blend mode", () => {
    expect(() =>
      parseGenart(loadInvalid("invalid-layer-bad-blend.genart")),
    ).toThrow(/must be a valid blend mode, got "bogus"/);
  });
});

// ---------------------------------------------------------------------------
// Round-trip serialization
// ---------------------------------------------------------------------------

describe("serializeGenart — round-trip", () => {
  const fixtures = [
    "minimal.genart",
    "full.genart",
    "canvas2d-sketch.genart",
    "glsl-sketch.genart",
    "three-sketch.genart",
    "svg-sketch.genart",
    "no-snapshots.genart",
    "components-shorthand.genart",
    "components-resolved.genart",
    "components-inline.genart",
    "components-mixed.genart",
    "layers-basic.genart",
    "layers-with-components.genart",
    "layers-group.genart",
  ];

  for (const file of fixtures) {
    it(`round-trips ${file}`, () => {
      const original = loadFixture(file);
      const parsed = parseGenart(original);
      const serialized = serializeGenart(parsed);
      const reparsed = parseGenart(JSON.parse(serialized));
      // Compare the parsed objects — structurally equivalent
      expect(reparsed).toEqual(parsed);
    });
  }

  it("round-trips snapshot thumbnailDataUrl", () => {
    const parsed = parseGenart(loadFixture("full.genart"));
    // Inject a thumbnailDataUrl into the first snapshot
    const withThumb: typeof parsed = {
      ...parsed,
      snapshots: parsed.snapshots!.map((s, i) =>
        i === 0 ? { ...s, thumbnailDataUrl: "data:image/jpeg;base64,/9j/AAAA" } : s,
      ),
    };
    const serialized = serializeGenart(withThumb);
    const reparsed = parseGenart(JSON.parse(serialized));
    expect(reparsed.snapshots![0]!.thumbnailDataUrl).toBe("data:image/jpeg;base64,/9j/AAAA");
  });

  it("omits thumbnailDataUrl when not present in snapshot", () => {
    const parsed = parseGenart(loadFixture("full.genart"));
    expect(parsed.snapshots![0]!.thumbnailDataUrl).toBeUndefined();
  });

  it("round-trips v1-no-renderer.genart (with added default renderer)", () => {
    const original = loadFixture("v1-no-renderer.genart");
    const parsed = parseGenart(original);
    expect(parsed.renderer).toEqual({ type: "p5" });
    const serialized = serializeGenart(parsed);
    const reparsed = parseGenart(JSON.parse(serialized));
    expect(reparsed).toEqual(parsed);
  });
});
