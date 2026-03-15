// ---------------------------------------------------------------------------
// Third-party attribution
// ---------------------------------------------------------------------------

/**
 * Attribution record for third-party content embedded in a .genart file.
 *
 * Required when any content (icons, images, fonts, etc.) is sourced from a
 * third-party library and embedded verbatim or in derived form. The `thirdParty`
 * array on `SketchDefinition` aggregates one entry per distinct upstream source.
 *
 * Consumers (exporters, display surfaces, CLI tools) should surface these notices
 * wherever the sketch is distributed or published.
 */
export interface ThirdPartyNotice {
  /** Human-readable library name, e.g. "Phosphor Icons". */
  readonly name: string;
  /** SPDX license identifier or short description, e.g. "MIT", "Apache-2.0". */
  readonly license: string;
  /** Full copyright line as it appears in the upstream LICENSE file. */
  readonly copyright: string;
  /** Canonical URL for the upstream project or license text. */
  readonly url: string;
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

/** Supported rendering engine types. */
export type RendererType = "p5" | "three" | "glsl" | "canvas2d" | "svg" | "genart";

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
// Symbols
// ---------------------------------------------------------------------------

/** Broad category for a symbol. */
export type SymbolCategory =
  | "nature" | "architecture" | "people" | "vehicles"
  | "objects" | "animals" | "abstract" | "celestial"
  | "flora" | "weather";

/** Visual rendering style for a symbol variant. */
export type SymbolStyle = "geometric" | "organic" | "silhouette" | "sketch";

/** A single path element within a symbol. */
export interface SymbolPath {
  /** SVG path d attribute. */
  readonly d: string;
  /** Fill color (hex, e.g. "#3a5c2e"). */
  readonly fill?: string;
  /** Stroke color (hex). */
  readonly stroke?: string;
  /** Stroke width. */
  readonly strokeWidth?: number;
  /** Semantic role, e.g. "trunk", "canopy", "hull", "sail". */
  readonly role?: string;
}

/** A variant of a symbol — a set of paths with a viewBox. */
export interface SymbolVariant {
  readonly paths: readonly SymbolPath[];
  readonly viewBox: string; // "0 0 100 100"
}

/**
 * A symbol value stored in a .genart file.
 * String = registry ID reference (not yet resolved).
 * Object = resolved/inline definition with SVG paths.
 */
export type SketchSymbolValue = string | SketchSymbolDef;

/** Resolved symbol definition with paths and viewBox. */
export interface SketchSymbolDef {
  /** Registry symbol ID, if resolved from registry. */
  readonly id?: string;
  /** Human-readable name. */
  readonly name?: string;
  /** Style variant this definition represents. */
  readonly style?: SymbolStyle;
  /** Ordered list of SVG paths. */
  readonly paths: readonly SymbolPath[];
  /** SVG viewBox string, e.g. "0 0 100 100". */
  readonly viewBox: string;
  /** True for AI-generated custom symbols. */
  readonly custom?: boolean;
  /** Iconify icon identifier, e.g. "ph:cat". Present for Iconify-sourced symbols. */
  readonly iconifyId?: string;
  /** License string, e.g. "MIT (Phosphor Icons)". Present for Iconify-sourced symbols. */
  readonly license?: string;
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
// Design Layers
// ---------------------------------------------------------------------------

/** Blend mode for design layer compositing. Maps to CanvasRenderingContext2D.globalCompositeOperation. */
export type BlendMode =
  | 'normal' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion'
  | 'hue' | 'saturation' | 'color' | 'luminosity';

/** Spatial transform for a design layer. */
export interface LayerTransform {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly rotation: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly anchorX: number;
  readonly anchorY: number;
}

/** A serialized design layer in the .genart file. */
export interface DesignLayer {
  readonly id: string;
  readonly type: string;
  readonly name: string;
  readonly visible: boolean;
  readonly locked: boolean;
  readonly opacity: number;
  readonly blendMode: BlendMode;
  readonly transform: LayerTransform;
  readonly properties: Readonly<Record<string, unknown>>;
  readonly children?: readonly DesignLayer[];
}

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------

/** Type of reference material. */
export type ReferenceType = "image" | "artwork" | "photograph" | "texture" | "palette";

/** A reference image or artwork attached to a series or sketch. */
export interface Reference {
  /** Unique reference identifier (kebab-case). */
  readonly id: string;
  /** Reference type. */
  readonly type: ReferenceType;
  /** Relative path to the reference image file in the workspace directory. */
  readonly path: string;
  /** Optional source attribution (artist, URL, collection). */
  readonly source?: string;
  /** Optional structured analysis of the reference (populated by analyze_reference). */
  readonly analysis?: ReferenceAnalysis;
}

/** Structured analysis of a reference image. */
export interface ReferenceAnalysis {
  /** Compositional structure observations. */
  readonly composition?: string;
  /** Dominant colors as hex values. */
  readonly palette?: readonly string[];
  /** Visual rhythm and pattern observations. */
  readonly rhythm?: string;
  /** Mood and emotional qualities. */
  readonly mood?: string;
  /** Technique and medium observations. */
  readonly technique?: string;
  /** Key qualities worth studying or incorporating. */
  readonly keyQualities?: readonly string[];
}

// ---------------------------------------------------------------------------
// Composition Level
// ---------------------------------------------------------------------------

/** Composition complexity/effort level for a sketch. */
export type CompositionLevel = "study" | "sketch" | "developed" | "exhibition";

// ---------------------------------------------------------------------------
// Lineage
// ---------------------------------------------------------------------------

/** Lineage metadata tracking a sketch's origin and derivation history. */
export interface SketchLineage {
  /** ID of the parent sketch this was forked/promoted from. */
  readonly parentId?: string;
  /** Title of the parent sketch at the time of derivation. */
  readonly parentTitle?: string;
  /** Generation number (1 = original, 2 = first fork, etc.). */
  readonly generation?: number;
  /** IDs of sketches blended/merged to create this one. */
  readonly blendSources?: readonly string[];
}

// ---------------------------------------------------------------------------
// Algorithm Data Channels (ADR 062)
// ---------------------------------------------------------------------------

/** Type of data in an algorithm-published channel. */
export type DataChannelType = "vector" | "scalar" | "path";

/** Algorithm data channel descriptor declared in sketch definition. */
export interface AlgorithmDataChannel {
  /** Channel name (e.g. "flowField", "valueMap", "mask", "strokePaths"). */
  readonly name: string;
  /** Data type: "vector" = [dx, dy, magnitude] triples, "scalar" = single float per cell, "path" = stroke path array. */
  readonly type: DataChannelType;
  /** Grid width (columns). Required for "vector" and "scalar", ignored for "path". */
  readonly cols?: number;
  /** Grid height (rows). Required for "vector" and "scalar", ignored for "path". */
  readonly rows?: number;
}

// ---------------------------------------------------------------------------
// Stroke Path Data (ADR 072)
// ---------------------------------------------------------------------------

/** A single point on an algorithm-generated stroke path. */
export interface AlgorithmStrokePathPoint {
  readonly x: number;
  readonly y: number;
}

/** A stroke path published by an algorithm via window.__genart_data.strokePaths. */
export interface AlgorithmStrokePath {
  /** Polyline points in canvas coordinates. */
  readonly points: readonly AlgorithmStrokePathPoint[];
  /** Per-point pressure values [0,1]. Defaults to 1.0 for all points if omitted. */
  readonly pressure?: readonly number[];
  /** Base width in pixels. */
  readonly width?: number;
  /** Semantic depth (0 = root/trunk, higher = leaf/tip). */
  readonly depth?: number;
  /** Grouping key for filtering paths. */
  readonly group?: string;
  /** Arbitrary scalar metadata. */
  readonly meta?: Readonly<Record<string, number>>;
}

/** Serialized stroke path data in a sketch definition. */
export interface StrokePathData {
  readonly paths: readonly AlgorithmStrokePath[];
}

// ---------------------------------------------------------------------------
// Sketch Data Sources (ADR 066)
// ---------------------------------------------------------------------------

/** Data source type indicating what kind of data is produced. */
export type DataSourceType = "flow-field" | "value-map" | "palette-map" | "custom";

/** Where the data comes from. */
export type DataSourceOrigin = "component" | "file" | "inline";

/**
 * A data source that provides pre-configured data to the algorithm.
 *
 * Three source modes:
 * - `component`: runtime resolves a component and calls its factory with `config`
 * - `file`: loads a `.genart-data` file from `path`
 * - `inline`: uses `value` directly (JSON-serializable)
 *
 * Resolved data is injected into the algorithm as `state.data.<key>`.
 */
export interface SketchDataSource {
  /** What kind of data this source produces. */
  readonly type: DataSourceType;
  /** Where the data comes from. */
  readonly source: DataSourceOrigin;
  /** Component name for source='component'. */
  readonly component?: string;
  /** Configuration passed to the component factory for source='component'. */
  readonly config?: Readonly<Record<string, unknown>>;
  /** Relative path to a .genart-data file for source='file'. */
  readonly path?: string;
  /** Inline data for source='inline' (JSON-serializable). */
  readonly value?: unknown;
}

// ---------------------------------------------------------------------------
// .genart-data file format (ADR 066)
// ---------------------------------------------------------------------------

/** Content type for a .genart-data file channel. */
export type DataChannelContentType = "scalar" | "vector" | "json";

/**
 * A single data channel within a .genart-data file.
 * For typed arrays, `data` is a base64-encoded Float32Array.
 * For JSON, `data` is the JSON value directly.
 */
export interface GenartDataChannel {
  /** Channel content type. */
  readonly type: DataChannelContentType;
  /** Channel data — base64 string for scalar/vector, JSON value for json. */
  readonly data: string | unknown;
}

/**
 * A .genart-data file — reusable data payload for sharing between sketches.
 *
 * Can contain either:
 * - Grid-based data with `cols`/`rows` and named `channels` (flow fields, value maps)
 * - A simple JSON `value` payload (palettes, configs)
 */
export interface GenartDataFile {
  /** Format identifier and version (always "1.0"). */
  readonly "genart-data": string;
  /** Data type hint (e.g. "flow-field", "value-map", "config", "palette"). */
  readonly type: string;
  /** Optional human-readable description. */
  readonly description?: string;
  /** Grid columns (for grid-based data). */
  readonly cols?: number;
  /** Grid rows (for grid-based data). */
  readonly rows?: number;
  /** Named data channels (for grid-based data). */
  readonly channels?: Readonly<Record<string, GenartDataChannel>>;
  /** Simple JSON value payload (for non-grid data). */
  readonly value?: unknown;
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
  /** Composition complexity/effort level (study, sketch, developed, exhibition). */
  readonly compositionLevel?: CompositionLevel;
  /** Lineage metadata tracking derivation history (parent, generation, blend sources). */
  readonly lineage?: SketchLineage;
  /** Reference images/artworks attached to this sketch for inspiration. */
  readonly references?: readonly Reference[];
  /** Algorithm data channels this sketch publishes for design layer consumption (ADR 062). */
  readonly dataChannels?: readonly AlgorithmDataChannel[];
  /** Reusable function components available to the algorithm.
   *  Keyed by component name (bare identifier, e.g., "prng", "noise-2d").
   *  String values are semver ranges resolved from the component registry.
   *  Object values provide inline code or cached source. */
  readonly components?: Readonly<Record<string, SketchComponentValue>>;
  /** Symbol data available to the algorithm via `__symbols__`.
   *  Keyed by symbol ID (e.g., "pine-tree", "sailboat").
   *  String values are registry ID references (unresolved).
   *  Object values are resolved definitions with SVG paths. */
  readonly symbols?: Readonly<Record<string, SketchSymbolValue>>;
  /** Data sources providing pre-configured data to the algorithm (ADR 066).
   *  Keyed by name (e.g., "scene", "heightmap", "palette").
   *  Resolved before algorithm execution and injected via `state.data`. */
  readonly data?: Readonly<Record<string, SketchDataSource>>;
  /** Design layers composited on top of the generative sketch output.
   *  Ordered bottom-to-top. Empty or absent means pure generative sketch. */
  readonly layers?: readonly DesignLayer[];
  /** Rendering engine specification. */
  readonly renderer: RendererSpec;
  /** Canvas dimensions. */
  readonly canvas: CanvasSpec;
  /** Third-party attribution notices for embedded content (icons, fonts, etc.). */
  readonly thirdParty?: readonly ThirdPartyNotice[];
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

// ---------------------------------------------------------------------------
// Workspace Series
// ---------------------------------------------------------------------------

/** Stage in a series progression (studio workflow). */
export type SeriesStage = "studies" | "drafts" | "refinements" | "finals";

/** A curated series of sketches with narrative and intent. */
export interface WorkspaceSeries {
  /** Unique series identifier (kebab-case). */
  readonly id: string;
  /** Display label for the series. */
  readonly label: string;
  /** Prose narrative describing the artistic exploration. */
  readonly narrative: string;
  /** Short statement of artistic intent. */
  readonly intent: string;
  /** Series progression type (e.g. "linear", "branching", "iterative"). */
  readonly progression?: string;
  /** Ordered stages in the studio workflow. */
  readonly stages?: readonly SeriesStage[];
  /** File paths of sketches in this series (ordered). */
  readonly sketchFiles: readonly string[];
  /** Reference images/artworks attached to this series for inspiration. */
  readonly references?: readonly Reference[];
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
  /** Optional curated series. */
  readonly series?: readonly WorkspaceSeries[];
}
