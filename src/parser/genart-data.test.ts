import { describe, it, expect } from "vitest";
import { parseGenartData, serializeGenartData } from "./genart-data.js";

// ---------------------------------------------------------------------------
// Valid cases
// ---------------------------------------------------------------------------

describe("parseGenartData — valid", () => {
  it("parses a simple value-based data file", () => {
    const result = parseGenartData({
      "genart-data": "1.0",
      type: "config",
      description: "Flow field settings",
      value: {
        gridSize: 200,
        waveScale: 4,
        turbulence: 0.6,
      },
    });
    expect(result["genart-data"]).toBe("1.0");
    expect(result.type).toBe("config");
    expect(result.description).toBe("Flow field settings");
    expect(result.value).toEqual({ gridSize: 200, waveScale: 4, turbulence: 0.6 });
    expect(result.channels).toBeUndefined();
  });

  it("parses a grid-based data file with channels", () => {
    const result = parseGenartData({
      "genart-data": "1.0",
      type: "flow-field",
      cols: 100,
      rows: 100,
      channels: {
        flowField: { type: "vector", data: "AAAA" },
        valueMap: { type: "scalar", data: "BBBB" },
      },
    });
    expect(result.cols).toBe(100);
    expect(result.rows).toBe(100);
    expect(result.channels!["flowField"]).toEqual({ type: "vector", data: "AAAA" });
    expect(result.channels!["valueMap"]).toEqual({ type: "scalar", data: "BBBB" });
  });

  it("parses a data file with json channel type", () => {
    const result = parseGenartData({
      "genart-data": "1.0",
      type: "palette",
      cols: 10,
      rows: 1,
      channels: {
        colors: { type: "json", data: [["#ff0000", "#00ff00"], ["#0000ff"]] },
      },
    });
    expect(result.channels!["colors"].type).toBe("json");
    expect(result.channels!["colors"].data).toEqual([["#ff0000", "#00ff00"], ["#0000ff"]]);
  });

  it("allows both channels and value", () => {
    const result = parseGenartData({
      "genart-data": "1.0",
      type: "hybrid",
      cols: 50,
      rows: 50,
      channels: { data: { type: "scalar", data: "AAAA" } },
      value: { meta: "extra info" },
    });
    expect(result.channels).toBeDefined();
    expect(result.value).toEqual({ meta: "extra info" });
  });
});

// ---------------------------------------------------------------------------
// Invalid cases
// ---------------------------------------------------------------------------

describe("parseGenartData — invalid", () => {
  it("rejects non-object input", () => {
    expect(() => parseGenartData("string")).toThrow("must be a JSON object");
    expect(() => parseGenartData(null)).toThrow("must be a JSON object");
    expect(() => parseGenartData([])).toThrow("must be a JSON object");
  });

  it("rejects missing genart-data version", () => {
    expect(() => parseGenartData({ type: "test", value: {} })).toThrow('"genart-data" version');
  });

  it("rejects missing type", () => {
    expect(() => parseGenartData({ "genart-data": "1.0", value: {} })).toThrow('"type" string');
  });

  it("rejects missing both channels and value", () => {
    expect(() => parseGenartData({ "genart-data": "1.0", type: "test" })).toThrow(
      'either "channels" or "value"',
    );
  });

  it("rejects cols without rows", () => {
    expect(() =>
      parseGenartData({ "genart-data": "1.0", type: "test", cols: 10, channels: {} }),
    ).toThrow('"rows"');
  });

  it("rejects invalid channel type", () => {
    expect(() =>
      parseGenartData({
        "genart-data": "1.0",
        type: "test",
        cols: 10,
        rows: 10,
        channels: { bad: { type: "invalid", data: "x" } },
      }),
    ).toThrow("must be one of");
  });

  it("rejects scalar channel with non-string data", () => {
    expect(() =>
      parseGenartData({
        "genart-data": "1.0",
        type: "test",
        cols: 10,
        rows: 10,
        channels: { f: { type: "scalar", data: [1, 2, 3] } },
      }),
    ).toThrow("base64 string");
  });

  it("rejects non-string description", () => {
    expect(() =>
      parseGenartData({ "genart-data": "1.0", type: "test", description: 42, value: {} }),
    ).toThrow('"description" must be a string');
  });
});

// ---------------------------------------------------------------------------
// Serialization round-trip
// ---------------------------------------------------------------------------

describe("serializeGenartData", () => {
  it("round-trips a value-based data file", () => {
    const original = {
      "genart-data": "1.0" as const,
      type: "config",
      value: { gridSize: 200, layers: [1, 2, 3] },
    };
    const json = serializeGenartData(original);
    const parsed = parseGenartData(JSON.parse(json));
    expect(parsed.type).toBe("config");
    expect(parsed.value).toEqual(original.value);
  });

  it("round-trips a grid-based data file", () => {
    const original = {
      "genart-data": "1.0" as const,
      type: "flow-field",
      cols: 50,
      rows: 50,
      channels: {
        flow: { type: "vector" as const, data: "base64data==" },
      },
    };
    const json = serializeGenartData(original);
    const parsed = parseGenartData(JSON.parse(json));
    expect(parsed.cols).toBe(50);
    expect(parsed.channels!["flow"]).toEqual(original.channels.flow);
  });
});
