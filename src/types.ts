// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

/** Supported rendering engine types. */
export type RendererType = "p5" | "three" | "glsl" | "canvas2d" | "svg";

/** Renderer specification stored in a .genart file. */
export interface RendererSpec {
  /** The rendering engine type. */
  readonly type: RendererType;
  /** Optional version constraint (e.g. "1.x", "0.160.x"). */
  readonly version?: string;
}

// ---------------------------------------------------------------------------
// Canvas
// ---------------------------------------------------------------------------

/** Canvas dimensions and optional preset reference. */
export interface CanvasSpec {
  /** Named preset that was used to derive width/height. */
  readonly preset?: string;
  /** Canvas width in pixels. */
  readonly width: number;
  /** Canvas height in pixels. */
  readonly height: number;
  /** Device pixel density multiplier. */
  readonly pixelDensity?: number;
}

/** A named canvas dimension preset. */
export interface CanvasPreset {
  /** Preset identifier (e.g. "square-1200", "hd-1920x1080"). */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** Grouping category. */
  readonly category: "square" | "landscape" | "portrait" | "print" | "social";
  /** Preset width in pixels. */
  readonly width: number;
  /** Preset height in pixels. */
  readonly height: number;
}

// ---------------------------------------------------------------------------
// Parameters, Colors, Themes, Tabs
// ---------------------------------------------------------------------------

/** A numeric parameter definition. */
export interface ParamDef {
  /** Unique key used in state.params. */
  readonly key: string;
  /** Display label. */
  readonly label: string;
  /** Tab this parameter belongs to. */
  readonly tab?: string;
  /** Minimum value. */
  readonly min: number;
  /** Maximum value. */
  readonly max: number;
  /** Step increment. */
  readonly step: number;
  /** Default value (must be within [min, max]). */
  readonly default: number;
}

/** A color definition. */
export interface ColorDef {
  /** Unique key for this color slot. */
  readonly key: string;
  /** Display label. */
  readonly label: string;
  /** Default hex color value (e.g. "#1a1a1a"). */
  readonly default: string;
}

/** A named color theme — a set of colors applied as a palette. */
export interface ThemeDef {
  /** Theme display name. */
  readonly name: string;
  /** Ordered list of hex color values. */
  readonly colors: readonly string[];
}

/** A tab for grouping parameters in the UI. */
export interface TabDef {
  /** Tab identifier (referenced by ParamDef.tab). */
  readonly id: string;
  /** Display label. */
  readonly label: string;
}

// ---------------------------------------------------------------------------
// Sketch State & Snapshots
// ---------------------------------------------------------------------------

/** Runtime state for a sketch — seed, parameter values, and active palette. */
export interface SketchState {
  /** Random seed for deterministic generation. */
  readonly seed: number;
  /** Current parameter values keyed by ParamDef.key. */
  readonly params: Readonly<Record<string, number>>;
  /** Active color palette (ordered hex values). */
  readonly colorPalette: readonly string[];
}

/** A saved state snapshot for recall. */
export interface Snapshot {
  /** Unique snapshot identifier. */
  readonly id: string;
  /** Human-readable label. */
  readonly label: string;
  /** ISO 8601 timestamp when the snapshot was taken. */
  readonly timestamp: string;
  /** Captured sketch state. */
  readonly state: SketchState;
  /** Optional thumbnail data URL captured at snapshot time. */
  readonly thumbnailDataUrl?: string;
}

// ---------------------------------------------------------------------------
// Sketch Components
// ---------------------------------------------------------------------------

/**
 * A component value in the .genart file.
 * String = registry version range (e.g., "^1.0.0").
 * Object = expanded form with optional cached source.
 */
export type SketchComponentValue = string | SketchComponentDef;

/** Expanded component definition with optional cached source. */
export interface SketchComponentDef {
  /** SemVer version or range. Present for registry components. */
  readonly version?: string;
  /** Source code. Present for inline or cache-resolved components. */
  readonly code?: string;
  /** Exported function/variable names. */
  readonly exports?: readonly string[];
}

// ---------------------------------------------------------------------------
// Sketch Definition (.genart file)
// ---------------------------------------------------------------------------

/** Complete .genart file structure — one sketch, self-contained and shareable. */
export interface SketchDefinition {
  /** Format version (e.g. "1.0", "1.1"). */
  readonly genart: string;
  /** Unique sketch identifier (kebab-case). */
  readonly id: string;
  /** Sketch title. */
  readonly title: string;
  /** Optional subtitle / description. */
  readonly subtitle?: string;
  /** ISO 8601 creation timestamp. */
  readonly created: string;
  /** ISO 8601 last-modified timestamp. */
  readonly modified: string;
  /** CLI agent that last modified this sketch (e.g. "claude-code", "codex-cli"). */
  readonly agent?: string;
  /** AI model that last modified this sketch (e.g. "claude-opus-4-6", "gpt-4o"). */
  readonly model?: string;
  /** Design knowledge skills used. */
  readonly skills?: readonly string[];
  /** Reusable function components available to the algorithm.
   *  Keyed by component name (bare identifier, e.g., "prng", "noise-2d").
   *  String values are semver ranges resolved from the component registry.
   *  Object values provide inline code or cached source. */
  readonly components?: Readonly<Record<string, SketchComponentValue>>;
  /** Rendering engine specification. */
  readonly renderer: RendererSpec;
  /** Canvas dimensions. */
  readonly canvas: CanvasSpec;
  /** Markdown philosophy / design intent documentation. */
  readonly philosophy?: string;
  /** Parameter grouping tabs. */
  readonly tabs?: readonly TabDef[];
  /** Numeric parameter definitions. */
  readonly parameters: readonly ParamDef[];
  /** Color slot definitions. */
  readonly colors: readonly ColorDef[];
  /** Named color themes. */
  readonly themes?: readonly ThemeDef[];
  /** Current runtime state. */
  readonly state: SketchState;
  /** Saved state snapshots. */
  readonly snapshots?: readonly Snapshot[];
  /** Algorithm source code (renderer-specific). */
  readonly algorithm: string;
}

// ---------------------------------------------------------------------------
// Workspace Definition (.genart-workspace file)
// ---------------------------------------------------------------------------

/** A sketch reference within a workspace — position on the infinite canvas. */
export interface WorkspaceSketchRef {
  /** Relative path to the .genart file. */
  readonly file: string;
  /** Position on the infinite canvas. */
  readonly position: Readonly<{ x: number; y: number }>;
  /** Optional display label (overrides sketch title on canvas). */
  readonly label?: string;
  /** Whether the sketch is locked from editing. */
  readonly locked?: boolean;
  /** Whether the sketch is visible on the canvas. */
  readonly visible?: boolean;
}

/** A named group of sketches for organization. */
export interface WorkspaceGroup {
  /** Group identifier. */
  readonly id: string;
  /** Display label. */
  readonly label: string;
  /** File paths of sketches in this group. */
  readonly sketchFiles: readonly string[];
  /** Optional group color for visual distinction. */
  readonly color?: string;
}

/** Complete .genart-workspace file structure. */
export interface WorkspaceDefinition {
  /** Format version (e.g. "1.0"). */
  readonly "genart-workspace": string;
  /** Unique workspace identifier. */
  readonly id: string;
  /** Workspace title. */
  readonly title: string;
  /** ISO 8601 creation timestamp. */
  readonly created: string;
  /** ISO 8601 last-modified timestamp. */
  readonly modified: string;
  /** Viewport position and zoom level. */
  readonly viewport: Readonly<{ x: number; y: number; zoom: number }>;
  /** Sketch references with canvas positions. */
  readonly sketches: readonly WorkspaceSketchRef[];
  /** Optional sketch groups. */
  readonly groups?: readonly WorkspaceGroup[];
}
