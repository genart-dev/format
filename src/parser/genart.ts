import type {
  SketchDefinition,
  SketchComponentValue,
  SketchComponentDef,
  SketchSymbolValue,
  SketchSymbolDef,
  SketchDataSource,
  DataSourceType,
  DataSourceOrigin,
  SymbolPath,
  RendererType,
  RendererSpec,
  CanvasSpec,
  ParamDef,
  ColorDef,
  ThemeDef,
  TabDef,
  SketchState,
  Snapshot,
  BlendMode,
  DesignLayer,
  LayerTransform,
  ThirdPartyNotice,
  CompositionLevel,
  SketchLineage,
} from "../types.js";
import { resolvePreset, CANVAS_PRESETS } from "../presets.js";

const VALID_RENDERER_TYPES: readonly RendererType[] = [
  "p5",
  "three",
  "glsl",
  "canvas2d",
  "svg",
];

const VALID_BLEND_MODES: readonly BlendMode[] = [
  "normal", "multiply", "screen", "overlay",
  "darken", "lighten", "color-dodge", "color-burn",
  "hard-light", "soft-light", "difference", "exclusion",
  "hue", "saturation", "color", "luminosity",
];

const VALID_COMPOSITION_LEVELS: readonly CompositionLevel[] = [
  "study", "sketch", "developed", "exhibition",
];

const VALID_DATA_SOURCE_TYPES: readonly DataSourceType[] = [
  "flow-field", "value-map", "palette-map", "custom",
];

const VALID_DATA_SOURCE_ORIGINS: readonly DataSourceOrigin[] = [
  "component", "file", "inline",
];

/** Default renderer for v1.0 files that omit the renderer field. */
const DEFAULT_RENDERER: RendererSpec = { type: "p5" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Obj = Record<string, unknown>;

function assertString(value: unknown, field: string): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`"${field}" must be a string`);
  }
}

function assertNumber(value: unknown, field: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`"${field}" must be a finite number`);
  }
}

function assertObject(value: unknown, field: string): asserts value is Obj {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`"${field}" must be an object`);
  }
}

function assertArray(value: unknown, field: string): asserts value is unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`"${field}" must be an array`);
  }
}

// ---------------------------------------------------------------------------
// Sub-parsers
// ---------------------------------------------------------------------------

function parseRenderer(raw: unknown): RendererSpec {
  assertObject(raw, "renderer");
  const type = raw["type"];
  assertString(type, "renderer.type");
  if (!VALID_RENDERER_TYPES.includes(type as RendererType)) {
    throw new Error(
      `Unknown renderer type "${type}". Valid types: ${VALID_RENDERER_TYPES.join(", ")}`,
    );
  }
  const version = raw["version"];
  if (version !== undefined) {
    assertString(version, "renderer.version");
    return { type: type as RendererType, version };
  }
  return { type: type as RendererType };
}

function parseCanvas(raw: unknown): CanvasSpec {
  assertObject(raw, "canvas");

  const width = raw["width"];
  assertNumber(width, "canvas.width");
  const height = raw["height"];
  assertNumber(height, "canvas.height");

  if (raw["preset"] !== undefined) {
    assertString(raw["preset"], "canvas.preset");
    const known = CANVAS_PRESETS.map((p) => p.id);
    if (!known.includes(raw["preset"])) {
      resolvePreset(raw["preset"]); // throws with descriptive error
    }
  }

  return {
    width,
    height,
    ...(raw["preset"] !== undefined ? { preset: raw["preset"] as string } : {}),
    ...(raw["pixelDensity"] !== undefined
      ? (() => {
          assertNumber(raw["pixelDensity"], "canvas.pixelDensity");
          return { pixelDensity: raw["pixelDensity"] as number };
        })()
      : {}),
  };
}

function parseParamDef(raw: unknown, index: number): ParamDef {
  assertObject(raw, `parameters[${index}]`);
  assertString(raw["key"], `parameters[${index}].key`);
  assertString(raw["label"], `parameters[${index}].label`);
  assertNumber(raw["min"], `parameters[${index}].min`);
  assertNumber(raw["max"], `parameters[${index}].max`);
  assertNumber(raw["step"], `parameters[${index}].step`);
  assertNumber(raw["default"], `parameters[${index}].default`);

  const def = raw["default"] as number;
  const min = raw["min"] as number;
  const max = raw["max"] as number;

  if (def < min || def > max) {
    throw new Error(
      `parameters[${index}] ("${raw["key"]}"): default value ${def} is outside range [${min}, ${max}]`,
    );
  }

  return {
    key: raw["key"] as string,
    label: raw["label"] as string,
    min,
    max,
    step: raw["step"] as number,
    default: def,
    ...(raw["tab"] !== undefined
      ? (() => {
          assertString(raw["tab"], `parameters[${index}].tab`);
          return { tab: raw["tab"] as string };
        })()
      : {}),
  };
}

function parseColorDef(raw: unknown, index: number): ColorDef {
  assertObject(raw, `colors[${index}]`);
  assertString(raw["key"], `colors[${index}].key`);
  assertString(raw["label"], `colors[${index}].label`);
  assertString(raw["default"], `colors[${index}].default`);
  return {
    key: raw["key"] as string,
    label: raw["label"] as string,
    default: raw["default"] as string,
  };
}

function parseThemeDef(raw: unknown, index: number): ThemeDef {
  assertObject(raw, `themes[${index}]`);
  assertString(raw["name"], `themes[${index}].name`);
  assertArray(raw["colors"], `themes[${index}].colors`);
  return {
    name: raw["name"] as string,
    colors: (raw["colors"] as unknown[]).map((c, i) => {
      assertString(c, `themes[${index}].colors[${i}]`);
      return c;
    }),
  };
}

function parseTabDef(raw: unknown, index: number): TabDef {
  assertObject(raw, `tabs[${index}]`);
  assertString(raw["id"], `tabs[${index}].id`);
  assertString(raw["label"], `tabs[${index}].label`);
  return { id: raw["id"] as string, label: raw["label"] as string };
}

function parseSketchState(raw: unknown, prefix = "state"): SketchState {
  assertObject(raw, prefix);
  assertNumber(raw["seed"], `${prefix}.seed`);
  assertObject(raw["params"], `${prefix}.params`);
  assertArray(raw["colorPalette"], `${prefix}.colorPalette`);
  return {
    seed: raw["seed"] as number,
    params: raw["params"] as Record<string, number>,
    colorPalette: (raw["colorPalette"] as unknown[]).map((c, i) => {
      assertString(c, `${prefix}.colorPalette[${i}]`);
      return c;
    }),
  };
}

function parseSnapshot(raw: unknown, index: number): Snapshot {
  assertObject(raw, `snapshots[${index}]`);
  assertString(raw["id"], `snapshots[${index}].id`);
  assertString(raw["label"], `snapshots[${index}].label`);
  assertString(raw["timestamp"], `snapshots[${index}].timestamp`);
  const snapshot: Snapshot = {
    id: raw["id"] as string,
    label: raw["label"] as string,
    timestamp: raw["timestamp"] as string,
    state: parseSketchState(raw["state"], `snapshots[${index}].state`),
  };
  if (typeof raw["thumbnailDataUrl"] === "string") {
    return { ...snapshot, thumbnailDataUrl: raw["thumbnailDataUrl"] };
  }
  return snapshot;
}

function parseComponentValue(
  raw: unknown,
  name: string,
): SketchComponentValue {
  if (typeof raw === "string") {
    if (raw.length === 0) {
      throw new Error(`components["${name}"] string value must not be empty`);
    }
    return raw;
  }

  assertObject(raw, `components["${name}"]`);
  const obj = raw as Obj;
  const def: Record<string, unknown> = {};

  if (obj["version"] !== undefined) {
    assertString(obj["version"], `components["${name}"].version`);
    def["version"] = obj["version"];
  }
  if (obj["code"] !== undefined) {
    assertString(obj["code"], `components["${name}"].code`);
    def["code"] = obj["code"];
  }
  if (obj["exports"] !== undefined) {
    assertArray(obj["exports"], `components["${name}"].exports`);
    def["exports"] = (obj["exports"] as unknown[]).map((e, i) => {
      assertString(e, `components["${name}"].exports[${i}]`);
      return e;
    });
  }

  // At least one of version or code must be present
  if (def["version"] === undefined && def["code"] === undefined) {
    throw new Error(
      `components["${name}"] must have at least "version" or "code"`,
    );
  }

  return def as unknown as SketchComponentDef;
}

function parseComponents(
  raw: unknown,
): Readonly<Record<string, SketchComponentValue>> {
  assertObject(raw, "components");
  const result: Record<string, SketchComponentValue> = {};
  for (const [key, value] of Object.entries(raw as Obj)) {
    if (key.length === 0) {
      throw new Error("components key must not be empty");
    }
    result[key] = parseComponentValue(value, key);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Symbol parsers
// ---------------------------------------------------------------------------

function parseSymbolPath(raw: unknown, path: string): SymbolPath {
  assertObject(raw, path);
  const obj = raw as Obj;
  assertString(obj["d"], `${path}.d`);
  const result: Record<string, unknown> = { d: obj["d"] };
  if (obj["fill"] !== undefined) {
    assertString(obj["fill"], `${path}.fill`);
    result["fill"] = obj["fill"];
  }
  if (obj["stroke"] !== undefined) {
    assertString(obj["stroke"], `${path}.stroke`);
    result["stroke"] = obj["stroke"];
  }
  if (obj["strokeWidth"] !== undefined) {
    assertNumber(obj["strokeWidth"], `${path}.strokeWidth`);
    result["strokeWidth"] = obj["strokeWidth"];
  }
  if (obj["role"] !== undefined) {
    assertString(obj["role"], `${path}.role`);
    result["role"] = obj["role"];
  }
  return result as unknown as SymbolPath;
}

function parseSymbolValue(raw: unknown, name: string): SketchSymbolValue {
  if (typeof raw === "string") {
    if (raw.length === 0) {
      throw new Error(`symbols["${name}"] string value must not be empty`);
    }
    return raw;
  }

  assertObject(raw, `symbols["${name}"]`);
  const obj = raw as Obj;
  const def: Record<string, unknown> = {};

  if (obj["id"] !== undefined) {
    assertString(obj["id"], `symbols["${name}"].id`);
    def["id"] = obj["id"];
  }
  if (obj["name"] !== undefined) {
    assertString(obj["name"], `symbols["${name}"].name`);
    def["name"] = obj["name"];
  }
  if (obj["style"] !== undefined) {
    assertString(obj["style"], `symbols["${name}"].style`);
    def["style"] = obj["style"];
  }

  if (obj["paths"] === undefined) {
    throw new Error(`symbols["${name}"] must have "paths"`);
  }
  assertArray(obj["paths"], `symbols["${name}"].paths`);
  def["paths"] = (obj["paths"] as unknown[]).map((p, i) =>
    parseSymbolPath(p, `symbols["${name}"].paths[${i}]`),
  );

  if (obj["viewBox"] === undefined) {
    throw new Error(`symbols["${name}"] must have "viewBox"`);
  }
  assertString(obj["viewBox"], `symbols["${name}"].viewBox`);
  def["viewBox"] = obj["viewBox"];

  if (obj["custom"] !== undefined) {
    if (typeof obj["custom"] !== "boolean") {
      throw new Error(`symbols["${name}"].custom must be a boolean`);
    }
    def["custom"] = obj["custom"];
  }
  if (obj["iconifyId"] !== undefined) {
    assertString(obj["iconifyId"], `symbols["${name}"].iconifyId`);
    def["iconifyId"] = obj["iconifyId"];
  }
  if (obj["license"] !== undefined) {
    assertString(obj["license"], `symbols["${name}"].license`);
    def["license"] = obj["license"];
  }

  return def as unknown as SketchSymbolDef;
}

function parseSymbols(
  raw: unknown,
): Readonly<Record<string, SketchSymbolValue>> {
  assertObject(raw, "symbols");
  const result: Record<string, SketchSymbolValue> = {};
  for (const [key, value] of Object.entries(raw as Obj)) {
    if (key.length === 0) {
      throw new Error("symbols key must not be empty");
    }
    result[key] = parseSymbolValue(value, key);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Layer parsers
// ---------------------------------------------------------------------------

function parseLayerTransform(value: unknown, field: string): LayerTransform {
  assertObject(value, field);
  const obj = value as Obj;
  const fields = ["x", "y", "width", "height", "rotation", "scaleX", "scaleY", "anchorX", "anchorY"] as const;
  for (const f of fields) {
    assertNumber(obj[f], `${field}.${f}`);
  }
  return {
    x: obj["x"] as number,
    y: obj["y"] as number,
    width: obj["width"] as number,
    height: obj["height"] as number,
    rotation: obj["rotation"] as number,
    scaleX: obj["scaleX"] as number,
    scaleY: obj["scaleY"] as number,
    anchorX: obj["anchorX"] as number,
    anchorY: obj["anchorY"] as number,
  };
}

function parseDesignLayer(value: unknown, path: string): DesignLayer {
  assertObject(value, path);
  const obj = value as Obj;

  assertString(obj["id"], `${path}.id`);
  assertString(obj["type"], `${path}.type`);
  assertString(obj["name"], `${path}.name`);

  if (typeof obj["visible"] !== "boolean") {
    throw new Error(`"${path}.visible" must be a boolean`);
  }
  if (typeof obj["locked"] !== "boolean") {
    throw new Error(`"${path}.locked" must be a boolean`);
  }

  assertNumber(obj["opacity"], `${path}.opacity`);
  const opacity = obj["opacity"] as number;
  if (opacity < 0 || opacity > 1) {
    throw new Error(`"${path}.opacity" must be between 0 and 1, got ${opacity}`);
  }

  assertString(obj["blendMode"], `${path}.blendMode`);
  if (!VALID_BLEND_MODES.includes(obj["blendMode"] as BlendMode)) {
    throw new Error(
      `"${path}.blendMode" must be a valid blend mode, got "${obj["blendMode"]}". Valid modes: ${VALID_BLEND_MODES.join(", ")}`,
    );
  }

  const transform = parseLayerTransform(obj["transform"], `${path}.transform`);

  assertObject(obj["properties"], `${path}.properties`);

  const layer: DesignLayer = {
    id: obj["id"] as string,
    type: obj["type"] as string,
    name: obj["name"] as string,
    visible: obj["visible"] as boolean,
    locked: obj["locked"] as boolean,
    opacity,
    blendMode: obj["blendMode"] as BlendMode,
    transform,
    properties: obj["properties"] as Readonly<Record<string, unknown>>,
  };

  if (obj["children"] !== undefined) {
    assertArray(obj["children"], `${path}.children`);
    return {
      ...layer,
      children: (obj["children"] as unknown[]).map((child, i) =>
        parseDesignLayer(child, `${path}.children[${i}]`),
      ),
    };
  }

  return layer;
}

function parseLayers(value: unknown): readonly DesignLayer[] {
  assertArray(value, "layers");
  return (value as unknown[]).map((item, i) =>
    parseDesignLayer(item, `layers[${i}]`),
  );
}

// ---------------------------------------------------------------------------
// Data source parsers (ADR 066)
// ---------------------------------------------------------------------------

function parseDataSource(raw: unknown, name: string): SketchDataSource {
  assertObject(raw, `data["${name}"]`);
  const obj = raw as Obj;

  assertString(obj["type"], `data["${name}"].type`);
  if (!VALID_DATA_SOURCE_TYPES.includes(obj["type"] as DataSourceType)) {
    throw new Error(
      `data["${name}"].type must be one of: ${VALID_DATA_SOURCE_TYPES.join(", ")}. Got "${obj["type"]}"`,
    );
  }

  assertString(obj["source"], `data["${name}"].source`);
  if (!VALID_DATA_SOURCE_ORIGINS.includes(obj["source"] as DataSourceOrigin)) {
    throw new Error(
      `data["${name}"].source must be one of: ${VALID_DATA_SOURCE_ORIGINS.join(", ")}. Got "${obj["source"]}"`,
    );
  }

  const result: Record<string, unknown> = {
    type: obj["type"],
    source: obj["source"],
  };

  if (obj["component"] !== undefined) {
    assertString(obj["component"], `data["${name}"].component`);
    result["component"] = obj["component"];
  }
  if (obj["config"] !== undefined) {
    assertObject(obj["config"], `data["${name}"].config`);
    result["config"] = obj["config"];
  }
  if (obj["path"] !== undefined) {
    assertString(obj["path"], `data["${name}"].path`);
    result["path"] = obj["path"];
  }
  if (obj["value"] !== undefined) {
    result["value"] = obj["value"];
  }

  // Validate required fields per source type
  const source = obj["source"] as string;
  if (source === "component" && result["component"] === undefined) {
    throw new Error(`data["${name}"] with source="component" must have a "component" field`);
  }
  if (source === "file" && result["path"] === undefined) {
    throw new Error(`data["${name}"] with source="file" must have a "path" field`);
  }

  return result as unknown as SketchDataSource;
}

function parseDataSources(
  raw: unknown,
): Readonly<Record<string, SketchDataSource>> {
  assertObject(raw, "data");
  const result: Record<string, SketchDataSource> = {};
  for (const [key, value] of Object.entries(raw as Obj)) {
    if (key.length === 0) {
      throw new Error("data key must not be empty");
    }
    result[key] = parseDataSource(value, key);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Optionals helper — parse optional fields into a partial
// ---------------------------------------------------------------------------

function parseOptionals(obj: Obj): Partial<
  Pick<
    SketchDefinition,
    "subtitle" | "agent" | "model" | "skills" | "compositionLevel" | "lineage" | "dataChannels" | "data" | "components" | "symbols" | "thirdParty" | "layers" | "philosophy" | "tabs" | "themes" | "snapshots"
  >
> {
  const out: Record<string, unknown> = {};

  if (obj["subtitle"] !== undefined) {
    assertString(obj["subtitle"], "subtitle");
    out["subtitle"] = obj["subtitle"];
  }
  if (obj["agent"] !== undefined) {
    assertString(obj["agent"], "agent");
    out["agent"] = obj["agent"];
  }
  if (obj["model"] !== undefined) {
    assertString(obj["model"], "model");
    out["model"] = obj["model"];
  }
  if (obj["skills"] !== undefined) {
    assertArray(obj["skills"], "skills");
    out["skills"] = (obj["skills"] as unknown[]).map((s, i) => {
      assertString(s, `skills[${i}]`);
      return s;
    });
  }
  if (obj["compositionLevel"] !== undefined) {
    assertString(obj["compositionLevel"], "compositionLevel");
    if (!VALID_COMPOSITION_LEVELS.includes(obj["compositionLevel"] as CompositionLevel)) {
      throw new Error(
        `"compositionLevel" must be one of: ${VALID_COMPOSITION_LEVELS.join(", ")}. Got "${obj["compositionLevel"]}"`,
      );
    }
    out["compositionLevel"] = obj["compositionLevel"];
  }
  if (obj["lineage"] !== undefined) {
    assertObject(obj["lineage"], "lineage");
    const lin = obj["lineage"] as Obj;
    const lineage: Record<string, unknown> = {};
    if (lin["parentId"] !== undefined) {
      assertString(lin["parentId"], "lineage.parentId");
      lineage["parentId"] = lin["parentId"];
    }
    if (lin["parentTitle"] !== undefined) {
      assertString(lin["parentTitle"], "lineage.parentTitle");
      lineage["parentTitle"] = lin["parentTitle"];
    }
    if (lin["generation"] !== undefined) {
      assertNumber(lin["generation"], "lineage.generation");
      lineage["generation"] = lin["generation"];
    }
    if (lin["blendSources"] !== undefined) {
      assertArray(lin["blendSources"], "lineage.blendSources");
      lineage["blendSources"] = (lin["blendSources"] as unknown[]).map((s, i) => {
        assertString(s, `lineage.blendSources[${i}]`);
        return s;
      });
    }
    out["lineage"] = lineage as SketchLineage;
  }
  if (obj["data"] !== undefined) {
    out["data"] = parseDataSources(obj["data"]);
  }
  if (obj["components"] !== undefined) {
    out["components"] = parseComponents(obj["components"]);
  }
  if (obj["symbols"] !== undefined) {
    out["symbols"] = parseSymbols(obj["symbols"]);
  }
  if (obj["thirdParty"] !== undefined) {
    assertArray(obj["thirdParty"], "thirdParty");
    out["thirdParty"] = (obj["thirdParty"] as unknown[]).map((entry, i) => {
      assertObject(entry, `thirdParty[${i}]`);
      const e = entry as Obj;
      assertString(e["name"], `thirdParty[${i}].name`);
      assertString(e["license"], `thirdParty[${i}].license`);
      assertString(e["copyright"], `thirdParty[${i}].copyright`);
      assertString(e["url"], `thirdParty[${i}].url`);
      return { name: e["name"], license: e["license"], copyright: e["copyright"], url: e["url"] } as ThirdPartyNotice;
    });
  }
  if (obj["layers"] !== undefined) {
    out["layers"] = parseLayers(obj["layers"]);
  }
  if (obj["philosophy"] !== undefined) {
    assertString(obj["philosophy"], "philosophy");
    out["philosophy"] = obj["philosophy"];
  }
  if (obj["tabs"] !== undefined) {
    assertArray(obj["tabs"], "tabs");
    out["tabs"] = (obj["tabs"] as unknown[]).map(parseTabDef);
  }
  if (obj["themes"] !== undefined) {
    assertArray(obj["themes"], "themes");
    out["themes"] = (obj["themes"] as unknown[]).map(parseThemeDef);
  }
  if (obj["snapshots"] !== undefined) {
    assertArray(obj["snapshots"], "snapshots");
    out["snapshots"] = (obj["snapshots"] as unknown[]).map(parseSnapshot);
  }

  if (obj["dataChannels"] !== undefined) {
    assertArray(obj["dataChannels"], "dataChannels");
    out["dataChannels"] = (obj["dataChannels"] as unknown[]).map((ch, i) => {
      assertObject(ch, `dataChannels[${i}]`);
      const c = ch as Obj;
      assertString(c["name"], `dataChannels[${i}].name`);
      assertString(c["type"], `dataChannels[${i}].type`);
      if (c["type"] !== "vector" && c["type"] !== "scalar") {
        throw new Error(`dataChannels[${i}].type must be "vector" or "scalar". Got "${c["type"]}"`);
      }
      assertNumber(c["cols"], `dataChannels[${i}].cols`);
      assertNumber(c["rows"], `dataChannels[${i}].rows`);
      return {
        name: c["name"] as string,
        type: c["type"] as string,
        cols: c["cols"] as number,
        rows: c["rows"] as number,
      };
    });
  }

  return out as Partial<
    Pick<
      SketchDefinition,
      "subtitle" | "agent" | "model" | "skills" | "compositionLevel" | "lineage" | "dataChannels" | "data" | "components" | "symbols" | "thirdParty" | "layers" | "philosophy" | "tabs" | "themes" | "snapshots"
    >
  >;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse and validate a .genart JSON value into a typed SketchDefinition.
 * Handles v1.0 backward compatibility (missing renderer defaults to p5).
 *
 * @param json - Parsed JSON value (output of JSON.parse or plain object).
 * @throws Error with descriptive message on validation failure.
 */
export function parseGenart(json: unknown): SketchDefinition {
  assertObject(json, "root");

  // Required: genart version
  if (json["genart"] === undefined) {
    throw new Error('Missing required field "genart" (format version)');
  }
  assertString(json["genart"], "genart");

  // Required: id
  if (json["id"] === undefined) {
    throw new Error('Missing required field "id"');
  }
  assertString(json["id"], "id");

  // Required: title
  if (json["title"] === undefined) {
    throw new Error('Missing required field "title"');
  }
  assertString(json["title"], "title");

  // Required: created, modified
  if (json["created"] === undefined) {
    throw new Error('Missing required field "created"');
  }
  assertString(json["created"], "created");
  if (json["modified"] === undefined) {
    throw new Error('Missing required field "modified"');
  }
  assertString(json["modified"], "modified");

  // Renderer — default to p5 for v1.0 files
  const renderer =
    json["renderer"] !== undefined
      ? parseRenderer(json["renderer"])
      : DEFAULT_RENDERER;

  // Required: canvas
  if (json["canvas"] === undefined) {
    throw new Error('Missing required field "canvas"');
  }
  const canvas = parseCanvas(json["canvas"]);

  // Required: parameters
  if (json["parameters"] === undefined) {
    throw new Error('Missing required field "parameters"');
  }
  assertArray(json["parameters"], "parameters");
  const parameters = (json["parameters"] as unknown[]).map(parseParamDef);

  // Validate unique parameter keys
  const paramKeys = new Set<string>();
  for (const p of parameters) {
    if (paramKeys.has(p.key)) {
      throw new Error(`Duplicate parameter key "${p.key}"`);
    }
    paramKeys.add(p.key);
  }

  // Required: colors
  if (json["colors"] === undefined) {
    throw new Error('Missing required field "colors"');
  }
  assertArray(json["colors"], "colors");
  const colors = (json["colors"] as unknown[]).map(parseColorDef);

  // Required: state
  if (json["state"] === undefined) {
    throw new Error('Missing required field "state"');
  }
  const state = parseSketchState(json["state"]);

  // Required: algorithm
  if (json["algorithm"] === undefined) {
    throw new Error('Missing required field "algorithm"');
  }
  assertString(json["algorithm"], "algorithm");

  return {
    genart: json["genart"],
    id: json["id"],
    title: json["title"],
    created: json["created"],
    modified: json["modified"],
    renderer,
    canvas,
    parameters,
    colors,
    state,
    algorithm: json["algorithm"],
    ...parseOptionals(json),
  };
}

/**
 * Serialize a SketchDefinition to a formatted JSON string.
 * The output is a valid .genart file.
 */
export function serializeGenart(sketch: SketchDefinition): string {
  const out: Record<string, unknown> = {
    genart: sketch.genart,
    id: sketch.id,
    title: sketch.title,
  };

  if (sketch.subtitle !== undefined) out["subtitle"] = sketch.subtitle;

  out["created"] = sketch.created;
  out["modified"] = sketch.modified;

  if (sketch.agent !== undefined) out["agent"] = sketch.agent;
  if (sketch.model !== undefined) out["model"] = sketch.model;

  if (sketch.skills !== undefined) out["skills"] = sketch.skills;
  if (sketch.compositionLevel !== undefined) out["compositionLevel"] = sketch.compositionLevel;
  if (sketch.lineage !== undefined) out["lineage"] = sketch.lineage;

  if (sketch.dataChannels !== undefined && sketch.dataChannels.length > 0) {
    out["dataChannels"] = sketch.dataChannels;
  }

  if (sketch.data !== undefined && Object.keys(sketch.data).length > 0) {
    out["data"] = sketch.data;
  }

  if (sketch.components !== undefined && Object.keys(sketch.components).length > 0) {
    out["components"] = sketch.components;
  }

  if (sketch.symbols !== undefined && Object.keys(sketch.symbols).length > 0) {
    out["symbols"] = sketch.symbols;
  }

  if (sketch.thirdParty !== undefined && sketch.thirdParty.length > 0) {
    out["thirdParty"] = sketch.thirdParty;
  }

  if (sketch.layers !== undefined && sketch.layers.length > 0) {
    out["layers"] = sketch.layers;
  }

  out["renderer"] = sketch.renderer;
  out["canvas"] = sketch.canvas;

  if (sketch.philosophy !== undefined) out["philosophy"] = sketch.philosophy;
  if (sketch.tabs !== undefined) out["tabs"] = sketch.tabs;

  out["parameters"] = sketch.parameters;
  out["colors"] = sketch.colors;

  if (sketch.themes !== undefined) out["themes"] = sketch.themes;

  out["state"] = sketch.state;

  if (sketch.snapshots !== undefined) out["snapshots"] = sketch.snapshots;

  out["algorithm"] = sketch.algorithm;

  return JSON.stringify(out, null, 2);
}
