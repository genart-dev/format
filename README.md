# @genart-dev/format

File format types, parsers, and canvas presets for the `.genart` and `.genart-workspace` formats.

Part of [genart.dev](https://genart.dev) — a generative art platform with an MCP server, desktop app, and IDE extensions.

## Install

```bash
npm install @genart-dev/format
```

Zero dependencies.

## Usage

```typescript
import {
  parseGenart,
  serializeGenart,
  parseWorkspace,
  serializeWorkspace,
  CANVAS_PRESETS,
  resolvePreset,
  convertLegacySketch,
} from "@genart-dev/format";

// Parse and validate a .genart file
const sketch = parseGenart(JSON.parse(fileContents));

// Serialize back to formatted JSON
const json = serializeGenart(sketch);

// Parse a .genart-workspace file
const workspace = parseWorkspace(JSON.parse(workspaceContents));

// Resolve a canvas preset to dimensions
const { width, height } = resolvePreset("square-1200"); // → 1200×1200

// Convert a legacy .js sketch file to .genart
const converted = convertLegacySketch(legacyJsSource);
```

## The `.genart` Format

Each `.genart` file is a single JSON document — one self-contained, shareable sketch:

```json
{
  "genart": "1.1",
  "id": "orchestrated-opposition",
  "title": "Orchestrated Opposition",
  "created": "2025-01-15T10:30:00Z",
  "modified": "2025-01-15T12:00:00Z",
  "renderer": { "type": "p5", "version": "1.x" },
  "canvas": { "preset": "square-1200", "width": 1200, "height": 1200 },
  "parameters": [
    { "key": "margin", "label": "Margin", "min": 30, "max": 120, "step": 5, "default": 60 }
  ],
  "colors": [
    { "key": "color1", "label": "Primary", "default": "#1a1a1a" }
  ],
  "state": {
    "seed": 12345,
    "params": { "margin": 60 },
    "colorPalette": ["#1a1a1a"]
  },
  "algorithm": "function sketch(p, state) { ... }"
}
```

**Required fields**: `genart`, `id`, `title`, `created`, `modified`, `renderer`, `canvas`, `parameters`, `colors`, `state`, `algorithm`

**Optional fields**: `subtitle`, `agent`, `model`, `skills`, `philosophy`, `tabs`, `themes`, `snapshots`

### Renderers

The `renderer.type` field specifies which engine executes the algorithm:

| Type | Algorithm Language | Runtime |
|------|-------------------|---------|
| `p5` | JavaScript (p5.js instance mode) | p5.js |
| `three` | JavaScript (Three.js scene builder) | Three.js |
| `glsl` | GLSL (fragment shader) | WebGL2 |
| `canvas2d` | JavaScript (Canvas 2D API) | Native |
| `svg` | JavaScript (SVG generator) | Native |

For v1.0 files without a `renderer` field, the parser defaults to `{ "type": "p5" }`.

## The `.genart-workspace` Format

Multiple sketches coexist on an infinite canvas. A `.genart-workspace` file is the spatial layout manifest:

```json
{
  "genart-workspace": "1.0",
  "id": "typography-explorations",
  "title": "Typography Explorations",
  "created": "2025-01-15T10:30:00Z",
  "modified": "2025-01-15T12:00:00Z",
  "viewport": { "x": 0, "y": 0, "zoom": 0.5 },
  "sketches": [
    { "file": "orchestrated-opposition.genart", "position": { "x": 0, "y": 0 } },
    { "file": "cadenced-fields.genart", "position": { "x": 1400, "y": 0 } }
  ]
}
```

Individual `.genart` files remain the portable, shareable unit. The workspace is lightweight spatial metadata — file references and canvas positions.

## Canvas Presets

18 built-in presets across 5 categories:

| Category | Presets |
|----------|---------|
| Square | 600, 1200, 2400, 4096 |
| Landscape | HD 1920×1080, 2K, Ultrawide 21:9, 4K UHD |
| Portrait | Phone 390×844, Tablet 768×1024, Poster 2400×3600 |
| Print (300 DPI) | A4, A3, US Letter |
| Social | Instagram 1080², Twitter/X 1200×675, Open Graph 1200×630 |

## API Reference

### Types

| Type | Description |
|------|-------------|
| `SketchDefinition` | Complete `.genart` file structure |
| `WorkspaceDefinition` | Complete `.genart-workspace` file structure |
| `RendererType` | `"p5" \| "three" \| "glsl" \| "canvas2d" \| "svg"` |
| `RendererSpec` | Renderer engine + optional version constraint |
| `CanvasSpec` | Width, height, pixel density, optional preset |
| `CanvasPreset` | Named preset (id, label, category, width, height) |
| `ParamDef` | Numeric parameter definition (key, label, min, max, step, default) |
| `ColorDef` | Color slot definition (key, label, default hex) |
| `ThemeDef` | Named color palette (name + colors array) |
| `TabDef` | Parameter grouping tab (id, label) |
| `SketchState` | Runtime state (seed, params, colorPalette) |
| `Snapshot` | Saved state snapshot with optional thumbnail |
| `WorkspaceSketchRef` | Sketch reference with canvas position |
| `WorkspaceGroup` | Named group of sketches |

### Functions

| Function | Description |
|----------|-------------|
| `parseGenart(json)` | Parse and validate a `.genart` JSON object |
| `serializeGenart(sketch)` | Serialize a `SketchDefinition` to formatted JSON |
| `parseWorkspace(json)` | Parse and validate a `.genart-workspace` JSON object |
| `serializeWorkspace(workspace)` | Serialize a `WorkspaceDefinition` to formatted JSON |
| `convertLegacySketch(source)` | Convert a legacy `.js` sketch file to `SketchDefinition` |
| `extractLegacyInfo(source)` | Extract metadata from a legacy sketch without full conversion |
| `resolvePreset(preset)` | Look up `{ width, height }` for a preset ID |
| `CANVAS_PRESETS` | Array of all 18 built-in canvas presets |

## Specification Fixtures

The `specs/` directory contains concrete examples of valid and invalid `.genart` and `.genart-workspace` files. See [specs/README.md](specs/README.md) for the full listing.

## Related Packages

| Package | Purpose |
|---------|---------|
| [`@genart-dev/core`](https://github.com/genart-dev/core) | Renderer adapters + skill registry (depends on format) |
| [`@genart-dev/mcp-server`](https://github.com/genart-dev/mcp-server) | 33-tool MCP server + CLI (depends on core) |

## License

MIT
