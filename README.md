# @genart-dev/format

File format types, parsers, and canvas presets for the `.genart` format.

## Install

```bash
npm install @genart-dev/format
```

## Usage

```typescript
import {
  parseGenart,
  serializeGenart,
  parseWorkspace,
  serializeWorkspace,
  CANVAS_PRESETS,
  resolvePreset,
} from "@genart-dev/format";

// Parse a .genart file
const sketch = parseGenart(JSON.parse(fileContents));

// Serialize back to JSON
const json = serializeGenart(sketch);

// Parse a .genart-workspace file
const workspace = parseWorkspace(JSON.parse(workspaceContents));

// Resolve a canvas preset
const { width, height } = resolvePreset("square-1200");
```

## What's Included

- **Types**: `SketchDefinition`, `WorkspaceDefinition`, `RendererType`, `ParamDef`, `ColorDef`, and more
- **Parsers**: `parseGenart()`, `serializeGenart()`, `parseWorkspace()`, `serializeWorkspace()`
- **Legacy**: `convertLegacySketch()` for converting v1 `.js` sketch files
- **Presets**: `CANVAS_PRESETS` (18 built-in canvas dimension presets) and `resolvePreset()`
- **Spec fixtures**: Example `.genart` and `.genart-workspace` files in `specs/`

## License

MIT
