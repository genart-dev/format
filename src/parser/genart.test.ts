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

// ---------------------------------------------------------------------------
// Symbols field (format v1.3)
// ---------------------------------------------------------------------------

const MINIMAL_WITH_SYMBOLS = {
  genart: "1.3",
  id: "symbol-test",
  title: "Symbol Test",
  created: "2026-03-04T00:00:00.000Z",
  modified: "2026-03-04T00:00:00.000Z",
  renderer: { type: "canvas2d" },
  canvas: { width: 800, height: 600 },
  parameters: [],
  colors: [],
  state: { seed: 42, params: {}, colorPalette: [] },
  algorithm: "function sketch(ctx, state) { return {}; }",
  symbols: {
    "pine-tree": {
      id: "pine-tree",
      name: "Pine Tree",
      style: "geometric",
      paths: [
        { d: "M50 5 L80 50 L20 50 Z", fill: "#2d6a4f", role: "canopy" },
        { d: "M42 50 L58 50 L58 65 L42 65 Z", fill: "#6b4423", role: "trunk" },
      ],
      viewBox: "0 0 100 120",
    },
    "oak-ref": "oak-tree",
  },
};

describe("parseGenart — symbols field", () => {
  it("parses resolved SketchSymbolDef", () => {
    const result = parseGenart(MINIMAL_WITH_SYMBOLS);
    expect(result.symbols).toBeDefined();
    const sym = result.symbols!["pine-tree"];
    expect(typeof sym).toBe("object");
    if (typeof sym === "object") {
      expect(sym.id).toBe("pine-tree");
      expect(sym.name).toBe("Pine Tree");
      expect(sym.style).toBe("geometric");
      expect(sym.paths).toHaveLength(2);
      expect(sym.paths[0]!.d).toBe("M50 5 L80 50 L20 50 Z");
      expect(sym.paths[0]!.fill).toBe("#2d6a4f");
      expect(sym.paths[0]!.role).toBe("canopy");
      expect(sym.viewBox).toBe("0 0 100 120");
    }
  });

  it("parses string registry reference", () => {
    const result = parseGenart(MINIMAL_WITH_SYMBOLS);
    const ref = result.symbols!["oak-ref"];
    expect(ref).toBe("oak-tree");
  });

  it("round-trips symbols through serialize/parse", () => {
    const parsed = parseGenart(MINIMAL_WITH_SYMBOLS);
    const json = serializeGenart(parsed);
    const reparsed = parseGenart(JSON.parse(json));
    expect(reparsed.symbols).toEqual(parsed.symbols);
    expect(reparsed.genart).toBe("1.3");
  });

  it("omits symbols field from output when empty", () => {
    const parsed = parseGenart(loadFixture("minimal.genart"));
    const json = serializeGenart(parsed);
    expect(json).not.toContain('"symbols"');
  });

  it("rejects symbols with missing paths", () => {
    const invalid = {
      ...MINIMAL_WITH_SYMBOLS,
      symbols: {
        "bad-sym": { id: "bad", viewBox: "0 0 100 100" },
      },
    };
    expect(() => parseGenart(invalid)).toThrow(/paths/);
  });

  it("rejects symbols with missing viewBox", () => {
    const invalid = {
      ...MINIMAL_WITH_SYMBOLS,
      symbols: {
        "bad-sym": { id: "bad", paths: [{ d: "M0 0 L10 10" }] },
      },
    };
    expect(() => parseGenart(invalid)).toThrow(/viewBox/);
  });

  it("parses iconifyId and license on SketchSymbolDef", () => {
    const input = {
      ...MINIMAL_WITH_SYMBOLS,
      symbols: {
        "ph-cat": {
          paths: [{ d: "M0 0 L10 10" }],
          viewBox: "0 0 256 256",
          iconifyId: "ph:cat",
          license: "MIT (Phosphor Icons)",
        },
      },
    };
    const result = parseGenart(input);
    const sym = result.symbols!["ph-cat"];
    expect(typeof sym).toBe("object");
    if (typeof sym === "object") {
      expect(sym.iconifyId).toBe("ph:cat");
      expect(sym.license).toBe("MIT (Phosphor Icons)");
    }
  });
});

// ---------------------------------------------------------------------------
// thirdParty field (format v1.3)
// ---------------------------------------------------------------------------

const MINIMAL_WITH_THIRD_PARTY = {
  genart: "1.3",
  id: "tp-test",
  title: "Third Party Test",
  created: "2026-03-04T00:00:00.000Z",
  modified: "2026-03-04T00:00:00.000Z",
  renderer: { type: "canvas2d" },
  canvas: { width: 800, height: 600 },
  parameters: [],
  colors: [],
  state: { seed: 1, params: {}, colorPalette: [] },
  algorithm: "",
  thirdParty: [
    {
      name: "Phosphor Icons",
      license: "MIT",
      copyright: "Copyright (c) 2023 Phosphor Icons",
      url: "https://github.com/phosphor-icons/core",
    },
  ],
};

describe("parseGenart — thirdParty field", () => {
  it("parses thirdParty notices", () => {
    const result = parseGenart(MINIMAL_WITH_THIRD_PARTY);
    expect(result.thirdParty).toHaveLength(1);
    const notice = result.thirdParty![0]!;
    expect(notice.name).toBe("Phosphor Icons");
    expect(notice.license).toBe("MIT");
    expect(notice.copyright).toBe("Copyright (c) 2023 Phosphor Icons");
    expect(notice.url).toBe("https://github.com/phosphor-icons/core");
  });

  it("round-trips thirdParty through serialize/parse", () => {
    const parsed = parseGenart(MINIMAL_WITH_THIRD_PARTY);
    const reparsed = parseGenart(JSON.parse(serializeGenart(parsed)));
    expect(reparsed.thirdParty).toEqual(parsed.thirdParty);
  });

  it("omits thirdParty from output when absent", () => {
    const parsed = parseGenart(loadFixture("minimal.genart"));
    expect(serializeGenart(parsed)).not.toContain('"thirdParty"');
  });

  it("rejects thirdParty entry missing required fields", () => {
    const invalid = {
      ...MINIMAL_WITH_THIRD_PARTY,
      thirdParty: [{ name: "Foo", license: "MIT" }], // missing copyright and url
    };
    expect(() => parseGenart(invalid)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// dataChannels field (ADR 062)
// ---------------------------------------------------------------------------

const MINIMAL_WITH_DATA_CHANNELS = {
  genart: "1.3",
  id: "dc-test",
  title: "Data Channels Test",
  created: "2026-03-06T00:00:00.000Z",
  modified: "2026-03-06T00:00:00.000Z",
  renderer: { type: "canvas2d" },
  canvas: { width: 800, height: 600 },
  parameters: [],
  colors: [],
  state: { seed: 1, params: {}, colorPalette: [] },
  algorithm: "",
  dataChannels: [
    { name: "flowField", type: "vector", cols: 40, rows: 40 },
    { name: "valueMap", type: "scalar", cols: 200, rows: 200 },
  ],
};

describe("parseGenart — dataChannels field", () => {
  it("parses dataChannels", () => {
    const result = parseGenart(MINIMAL_WITH_DATA_CHANNELS);
    expect(result.dataChannels).toHaveLength(2);
    const flow = result.dataChannels![0]!;
    expect(flow.name).toBe("flowField");
    expect(flow.type).toBe("vector");
    expect(flow.cols).toBe(40);
    expect(flow.rows).toBe(40);
    const value = result.dataChannels![1]!;
    expect(value.name).toBe("valueMap");
    expect(value.type).toBe("scalar");
    expect(value.cols).toBe(200);
    expect(value.rows).toBe(200);
  });

  it("parses without dataChannels (backward compat)", () => {
    const result = parseGenart(loadFixture("minimal.genart"));
    expect(result.dataChannels).toBeUndefined();
  });

  it("round-trips dataChannels through serialize/parse", () => {
    const parsed = parseGenart(MINIMAL_WITH_DATA_CHANNELS);
    const reparsed = parseGenart(JSON.parse(serializeGenart(parsed)));
    expect(reparsed.dataChannels).toEqual(parsed.dataChannels);
  });

  it("omits dataChannels from output when absent", () => {
    const parsed = parseGenart(loadFixture("minimal.genart"));
    expect(serializeGenart(parsed)).not.toContain('"dataChannels"');
  });

  it("rejects invalid channel type", () => {
    const invalid = {
      ...MINIMAL_WITH_DATA_CHANNELS,
      dataChannels: [{ name: "flow", type: "invalid", cols: 10, rows: 10 }],
    };
    expect(() => parseGenart(invalid)).toThrow(/must be "vector" or "scalar"/);
  });

  it("rejects channel missing required fields", () => {
    const invalid = {
      ...MINIMAL_WITH_DATA_CHANNELS,
      dataChannels: [{ name: "flow", type: "vector" }], // missing cols and rows
    };
    expect(() => parseGenart(invalid)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Data sources (ADR 066)
// ---------------------------------------------------------------------------

const MINIMAL_BASE = {
  genart: "1.3",
  id: "data-test",
  title: "Data Sources Test",
  created: "2026-03-08T00:00:00.000Z",
  modified: "2026-03-08T00:00:00.000Z",
  renderer: { type: "canvas2d" },
  canvas: { width: 800, height: 600 },
  parameters: [],
  colors: [],
  state: { seed: 1, params: {}, colorPalette: [] },
  algorithm: "",
};

describe("parseGenart — data sources (ADR 066)", () => {
  it("parses component data source", () => {
    const input = {
      ...MINIMAL_BASE,
      data: {
        scene: {
          type: "flow-field",
          source: "component",
          component: "curl-flow-field",
          config: { gridSize: 200, turbulence: 0.6 },
        },
      },
    };
    const result = parseGenart(input);
    expect(result.data).toBeDefined();
    const scene = result.data!["scene"]!;
    expect(scene.type).toBe("flow-field");
    expect(scene.source).toBe("component");
    expect(scene.component).toBe("curl-flow-field");
    expect(scene.config).toEqual({ gridSize: 200, turbulence: 0.6 });
  });

  it("parses file data source", () => {
    const input = {
      ...MINIMAL_BASE,
      data: {
        heightmap: {
          type: "custom",
          source: "file",
          path: "./shared/terrain.genart-data",
        },
      },
    };
    const result = parseGenart(input);
    const hm = result.data!["heightmap"]!;
    expect(hm.type).toBe("custom");
    expect(hm.source).toBe("file");
    expect(hm.path).toBe("./shared/terrain.genart-data");
  });

  it("parses inline data source", () => {
    const input = {
      ...MINIMAL_BASE,
      data: {
        palette: {
          type: "palette-map",
          source: "inline",
          value: { regions: [{ y: [0, 0.5], colors: ["#f00", "#0f0"] }] },
        },
      },
    };
    const result = parseGenart(input);
    const pal = result.data!["palette"]!;
    expect(pal.type).toBe("palette-map");
    expect(pal.source).toBe("inline");
    expect(pal.value).toEqual({ regions: [{ y: [0, 0.5], colors: ["#f00", "#0f0"] }] });
  });

  it("round-trips data sources through serialize/parse", () => {
    const input = {
      ...MINIMAL_BASE,
      data: {
        scene: {
          type: "flow-field" as const,
          source: "component" as const,
          component: "curl-flow-field",
          config: { gridSize: 200 },
        },
        palette: {
          type: "palette-map" as const,
          source: "inline" as const,
          value: [1, 2, 3],
        },
      },
    };
    const parsed = parseGenart(input);
    const serialized = serializeGenart(parsed);
    const reparsed = parseGenart(JSON.parse(serialized));
    expect(reparsed.data).toEqual(parsed.data);
  });

  it("omits data field when absent", () => {
    const result = parseGenart(MINIMAL_BASE);
    expect(result.data).toBeUndefined();
    const serialized = serializeGenart(result);
    expect(serialized).not.toContain('"data"');
  });

  it("rejects invalid data source type", () => {
    const input = {
      ...MINIMAL_BASE,
      data: { x: { type: "invalid", source: "inline" } },
    };
    expect(() => parseGenart(input)).toThrow(/must be one of/);
  });

  it("rejects invalid data source origin", () => {
    const input = {
      ...MINIMAL_BASE,
      data: { x: { type: "custom", source: "magic" } },
    };
    expect(() => parseGenart(input)).toThrow(/must be one of/);
  });

  it("rejects component source without component field", () => {
    const input = {
      ...MINIMAL_BASE,
      data: { x: { type: "flow-field", source: "component" } },
    };
    expect(() => parseGenart(input)).toThrow(/must have a "component" field/);
  });

  it("rejects file source without path field", () => {
    const input = {
      ...MINIMAL_BASE,
      data: { x: { type: "custom", source: "file" } },
    };
    expect(() => parseGenart(input)).toThrow(/must have a "path" field/);
  });

  it("rejects empty data key", () => {
    const input = {
      ...MINIMAL_BASE,
      data: { "": { type: "custom", source: "inline", value: 1 } },
    };
    expect(() => parseGenart(input)).toThrow(/key must not be empty/);
  });
});
