import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseWorkspace, serializeWorkspace } from "./workspace.js";

const SPECS_DIR = resolve(__dirname, "../../specs");

function loadFixture(filename: string): unknown {
  const raw = readFileSync(resolve(SPECS_DIR, filename), "utf-8");
  return JSON.parse(raw);
}

// ---------------------------------------------------------------------------
// Valid workspace files
// ---------------------------------------------------------------------------

describe("parseWorkspace — valid fixtures", () => {
  it("parses minimal-workspace.genart-workspace", () => {
    const result = parseWorkspace(
      loadFixture("minimal-workspace.genart-workspace"),
    );
    expect(result["genart-workspace"]).toBe("1.0");
    expect(result.id).toBe("minimal-ws");
    expect(result.viewport).toEqual({ x: 0, y: 0, zoom: 1.0 });
    expect(result.sketches).toHaveLength(1);
    expect(result.sketches[0]!.file).toBe("minimal.genart");
    expect(result.sketches[0]!.position).toEqual({ x: 0, y: 0 });
    expect(result.groups).toBeUndefined();
  });

  it("parses full-workspace.genart-workspace", () => {
    const result = parseWorkspace(
      loadFixture("full-workspace.genart-workspace"),
    );
    expect(result.id).toBe("full-ws");
    expect(result.viewport.zoom).toBe(0.5);
    expect(result.sketches).toHaveLength(6);

    // Check sketch metadata
    expect(result.sketches[0]!.label).toBe("Grid Noise");
    expect(result.sketches[0]!.file).toBe("full.genart");

    // Check groups
    expect(result.groups).toHaveLength(1);
    expect(result.groups![0]!.id).toBe("renderer-tests");
    expect(result.groups![0]!.sketchFiles).toEqual([
      "canvas2d-sketch.genart",
      "glsl-sketch.genart",
      "three-sketch.genart",
      "svg-sketch.genart",
    ]);
    expect(result.groups![0]!.color).toBe("#0074D9");
  });
});

// ---------------------------------------------------------------------------
// Invalid workspace inputs
// ---------------------------------------------------------------------------

describe("parseWorkspace — invalid inputs", () => {
  it("rejects missing genart-workspace field", () => {
    expect(() => parseWorkspace({ id: "x" })).toThrow(
      'Missing required field "genart-workspace"',
    );
  });

  it("rejects missing viewport", () => {
    expect(() =>
      parseWorkspace({
        "genart-workspace": "1.0",
        id: "x",
        title: "X",
        created: "2026-01-01T00:00:00Z",
        modified: "2026-01-01T00:00:00Z",
        sketches: [],
      }),
    ).toThrow('Missing required field "viewport"');
  });

  it("rejects non-object input", () => {
    expect(() => parseWorkspace("not an object")).toThrow(
      '"root" must be an object',
    );
  });
});

// ---------------------------------------------------------------------------
// Round-trip serialization
// ---------------------------------------------------------------------------

describe("serializeWorkspace — round-trip", () => {
  const fixtures = [
    "minimal-workspace.genart-workspace",
    "full-workspace.genart-workspace",
  ];

  for (const file of fixtures) {
    it(`round-trips ${file}`, () => {
      const original = loadFixture(file);
      const parsed = parseWorkspace(original);
      const serialized = serializeWorkspace(parsed);
      const reparsed = parseWorkspace(JSON.parse(serialized));
      expect(reparsed).toEqual(parsed);
    });
  }
});
