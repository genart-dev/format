import type {
  SketchDefinition,
  ParamDef,
  ColorDef,
  ThemeDef,
  TabDef,
  SketchState,
} from "../types.js";

// ---------------------------------------------------------------------------
// Legacy sketch format extraction
// ---------------------------------------------------------------------------

/**
 * Extracted metadata from a legacy upstream .js sketch file.
 * These files declare global constants (ART_ID, PARAM_DEFS, etc.)
 * in a p5.js global-mode format.
 */
interface LegacyExtracted {
  artId: string;
  artTitle: string;
  artSubtitle: string;
  paramTabs: Array<{ id: string; label: string }>;
  paramDefs: Array<{
    key: string;
    label: string;
    tab?: string;
    min: number;
    max: number;
    step: number;
    value: number;
  }>;
  colorDefs: Array<{ key: string; label: string; default: string }>;
  colorThemes: Array<{ name: string; colors: string[] }>;
  params: Record<string, unknown>;
  canvasWidth: number;
  canvasHeight: number;
  algorithm: string;
}

// ---------------------------------------------------------------------------
// Regex-based extraction (no eval, no sandbox — pure static analysis)
// ---------------------------------------------------------------------------

function extractStringConst(source: string, name: string): string {
  // Match: const NAME = 'value'; or const NAME = "value";
  const re = new RegExp(
    `const\\s+${name}\\s*=\\s*(['"\`])((?:(?!\\1).)*?)\\1`,
  );
  const m = source.match(re);
  if (!m || m[2] === undefined) throw new Error(`Missing const ${name} in legacy sketch`);
  return m[2];
}

function extractArrayLiteral(source: string, name: string): string {
  // Find the start of the const declaration
  const startRe = new RegExp(`const\\s+${name}\\s*=\\s*\\[`);
  const startMatch = startRe.exec(source);
  if (!startMatch) {
    throw new Error(`Missing const ${name} in legacy sketch`);
  }

  // Find the matching closing bracket
  let depth = 0;
  let start = startMatch.index + startMatch[0].length - 1; // at the '['
  for (let i = start; i < source.length; i++) {
    if (source[i] === "[") depth++;
    else if (source[i] === "]") {
      depth--;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  throw new Error(`Unterminated array for const ${name}`);
}

function extractObjectLiteral(source: string, name: string): string {
  // Match: let NAME = { ... }; — find opening brace, count depth
  const startRe = new RegExp(`(?:let|const|var)\\s+${name}\\s*=\\s*\\{`);
  const startMatch = startRe.exec(source);
  if (!startMatch) {
    throw new Error(`Missing variable ${name} in legacy sketch`);
  }

  let depth = 0;
  const start = startMatch.index + startMatch[0].length - 1; // at the '{'
  for (let i = start; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }
  throw new Error(`Unterminated object for variable ${name}`);
}

/**
 * Parse a JavaScript object/array literal into a value.
 * Uses JSON.parse after converting JS literal syntax to valid JSON.
 */
function parseJsLiteral<T>(literal: string): T {
  // Convert single-quoted strings to double-quoted
  // Handle JS object shorthand: unquoted keys → quoted keys
  let json = literal
    // Replace single-quoted strings with double-quoted
    .replace(/'/g, '"')
    // Quote unquoted object keys: word characters followed by :
    .replace(/(\{|\,)\s*(\w+)\s*:/g, '$1 "$2":')
    // Remove trailing commas before } or ]
    .replace(/,\s*([\]}])/g, "$1");

  return JSON.parse(json) as T;
}

function extractCanvasSize(source: string): { width: number; height: number } {
  const re = /createCanvas\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/;
  const m = source.match(re);
  if (!m) {
    return { width: 1200, height: 1200 }; // default
  }
  return { width: parseInt(m[1]!, 10), height: parseInt(m[2]!, 10) };
}

function extractAlgorithm(source: string): string {
  // Extract everything from the first function that isn't a const/let declaration
  // We want the actual drawing code — from setup() onward, excluding UI handlers
  // For legacy sketches, the algorithm is the body of draw() plus helper functions

  // Find all function definitions and classes (the algorithm body)
  const lines = source.split("\n");
  const algorithmLines: string[] = [];
  let inAlgorithm = false;
  let skipSection = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();

    // Skip top-level const/let declarations (metadata already extracted)
    if (
      trimmed.startsWith("const ART_ID") ||
      trimmed.startsWith("const ART_TITLE") ||
      trimmed.startsWith("const ART_SUBTITLE") ||
      trimmed.startsWith("const PARAM_TABS") ||
      trimmed.startsWith("const PARAM_DEFS") ||
      trimmed.startsWith("const COLOR_DEFS") ||
      trimmed.startsWith("const COLOR_THEMES")
    ) {
      skipSection = true;
      continue;
    }

    // Skip let params = { ... } and let defaultParams = ...
    if (trimmed.startsWith("let params =") || trimmed.startsWith("let defaultParams =")) {
      skipSection = true;
      continue;
    }

    // Skip UI handlers (updateParam, updateColor)
    if (trimmed.startsWith("function updateParam") || trimmed.startsWith("function updateColor")) {
      skipSection = true;
      continue;
    }

    // Track bracket depth to skip multi-line declarations
    if (skipSection) {
      // Count if we've reached a balanced state (simple heuristic: next function or end)
      if (trimmed.startsWith("function ") || trimmed.startsWith("class ") ||
          (trimmed.startsWith("//") && trimmed.includes("═══"))) {
        skipSection = false;
        inAlgorithm = true;
        algorithmLines.push(line);
      }
      continue;
    }

    // Start collecting once we pass the declarations
    if (
      trimmed.startsWith("function ") ||
      trimmed.startsWith("class ") ||
      trimmed.startsWith("let ") ||
      trimmed.startsWith("const ") ||
      inAlgorithm
    ) {
      // Skip UI handler function bodies
      if (trimmed.startsWith("function updateParam") || trimmed.startsWith("function updateColor")) {
        skipSection = true;
        continue;
      }
      inAlgorithm = true;
      algorithmLines.push(line);
    } else if (
      trimmed.startsWith("//") && inAlgorithm
    ) {
      algorithmLines.push(line);
    }
  }

  return algorithmLines.join("\n").trim();
}

/**
 * Extract metadata from a legacy upstream .js sketch file using
 * static analysis (regex-based parsing — no eval).
 */
function extractLegacyMetadata(source: string): LegacyExtracted {
  const artId = extractStringConst(source, "ART_ID");
  const artTitle = extractStringConst(source, "ART_TITLE");
  const artSubtitle = extractStringConst(source, "ART_SUBTITLE");

  const tabsLiteral = extractArrayLiteral(source, "PARAM_TABS");
  const paramTabs = parseJsLiteral<Array<{ id: string; label: string }>>(tabsLiteral);

  const defsLiteral = extractArrayLiteral(source, "PARAM_DEFS");
  const paramDefs = parseJsLiteral<LegacyExtracted["paramDefs"]>(defsLiteral);

  const colorDefsLiteral = extractArrayLiteral(source, "COLOR_DEFS");
  const colorDefs = parseJsLiteral<LegacyExtracted["colorDefs"]>(colorDefsLiteral);

  const themesLiteral = extractArrayLiteral(source, "COLOR_THEMES");
  const colorThemes = parseJsLiteral<LegacyExtracted["colorThemes"]>(themesLiteral);

  const paramsLiteral = extractObjectLiteral(source, "params");
  const params = parseJsLiteral<Record<string, unknown>>(paramsLiteral);

  const { width, height } = extractCanvasSize(source);
  const algorithm = extractAlgorithm(source);

  return {
    artId,
    artTitle,
    artSubtitle,
    paramTabs,
    paramDefs,
    colorDefs,
    colorThemes,
    params,
    canvasWidth: width,
    canvasHeight: height,
    algorithm,
  };
}

// ---------------------------------------------------------------------------
// Conversion to SketchDefinition
// ---------------------------------------------------------------------------

/**
 * Convert extracted legacy metadata into a SketchDefinition.
 *
 * @param extracted - Parsed legacy sketch metadata.
 * @returns A valid SketchDefinition with renderer: { type: 'p5' }.
 */
function toSketchDefinition(extracted: LegacyExtracted): SketchDefinition {
  const now = new Date().toISOString();

  const tabs: TabDef[] = extracted.paramTabs.map((t) => ({
    id: t.id,
    label: t.label,
  }));

  const parameters: ParamDef[] = extracted.paramDefs.map((p) => ({
    key: p.key,
    label: p.label,
    min: p.min,
    max: p.max,
    step: p.step,
    default: p.value, // legacy uses 'value', .genart uses 'default'
    ...(p.tab !== undefined ? { tab: p.tab } : {}),
  }));

  const colors: ColorDef[] = extracted.colorDefs.map((c) => ({
    key: c.key,
    label: c.label,
    default: c.default,
  }));

  const themes: ThemeDef[] = extracted.colorThemes.map((t) => ({
    name: t.name,
    colors: [...t.colors],
  }));

  // Build initial state from the params object
  const seed = typeof extracted.params["seed"] === "number"
    ? extracted.params["seed"]
    : 12345;

  const paramValues: Record<string, number> = {};
  for (const def of extracted.paramDefs) {
    const val = extracted.params[def.key];
    paramValues[def.key] = typeof val === "number" ? val : def.value;
  }

  const colorPalette = Array.isArray(extracted.params["colorPalette"])
    ? (extracted.params["colorPalette"] as string[])
    : extracted.colorDefs.map((c) => c.default);

  const state: SketchState = {
    seed,
    params: paramValues,
    colorPalette,
  };

  return {
    genart: "1.1",
    id: extracted.artId,
    title: extracted.artTitle,
    subtitle: extracted.artSubtitle,
    created: now,
    modified: now,
    renderer: { type: "p5" },
    canvas: {
      width: extracted.canvasWidth,
      height: extracted.canvasHeight,
    },
    tabs,
    parameters,
    colors,
    themes,
    state,
    algorithm: extracted.algorithm,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a legacy upstream .js sketch file to a SketchDefinition.
 *
 * Uses static analysis (regex extraction) — no eval or sandbox required.
 * Extracts ART_ID, PARAM_DEFS, COLOR_DEFS, COLOR_THEMES, params, and
 * the algorithm body. Produces a SketchDefinition with renderer: { type: 'p5' }.
 *
 * @param source - The full source text of a legacy .js sketch file.
 * @returns A valid SketchDefinition.
 * @throws Error if required constants are missing or malformed.
 */
export function convertLegacySketch(source: string): SketchDefinition {
  const extracted = extractLegacyMetadata(source);
  return toSketchDefinition(extracted);
}

/**
 * Extract only the metadata from a legacy sketch (without algorithm body).
 * Useful for indexing/cataloging without full conversion.
 */
export function extractLegacyInfo(source: string): {
  id: string;
  title: string;
  subtitle: string;
  paramCount: number;
  colorCount: number;
  themeCount: number;
} {
  const extracted = extractLegacyMetadata(source);
  return {
    id: extracted.artId,
    title: extracted.artTitle,
    subtitle: extracted.artSubtitle,
    paramCount: extracted.paramDefs.length,
    colorCount: extracted.colorDefs.length,
    themeCount: extracted.colorThemes.length,
  };
}
