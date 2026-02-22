# .genart Format — Specification by Example

These files define the `.genart` and `.genart-workspace` formats through concrete examples. Every parser implementation must correctly handle all valid examples and reject all invalid examples with meaningful errors.

## Valid Examples

| File | Tests |
|------|-------|
| `minimal.genart` | Bare minimum valid file — only required fields |
| `full.genart` | Every optional field populated |
| `v1-no-renderer.genart` | v1.0 file without `renderer` field — parser defaults to `{ "type": "p5" }` |
| `canvas2d-sketch.genart` | Canvas 2D renderer type |
| `glsl-sketch.genart` | GLSL shader renderer type |
| `three-sketch.genart` | Three.js renderer type |
| `svg-sketch.genart` | SVG renderer type |
| `no-snapshots.genart` | Empty snapshots array |
| `minimal-workspace.genart-workspace` | Bare minimum workspace |
| `full-workspace.genart-workspace` | Workspace with groups, multiple sketches |

## Invalid Examples (`invalid/`)

| File | Expected Error |
|------|----------------|
| `missing-id.genart` | Required field `id` missing |
| `missing-algorithm.genart` | Required field `algorithm` missing |
| `invalid-renderer-type.genart` | Unknown renderer type |
| `invalid-canvas-preset.genart` | Unrecognized canvas preset |
| `duplicate-param-keys.genart` | Parameter keys must be unique |
| `param-default-out-of-range.genart` | Default value outside min/max |

## Usage

```typescript
import { parseGenart } from '@genart/core';
import { readFileSync } from 'fs';

// Valid files must parse without error
const sketch = parseGenart(JSON.parse(readFileSync('specs/genart-format/minimal.genart', 'utf-8')));

// Invalid files must throw descriptive errors
expect(() => parseGenart(JSON.parse(readFileSync('specs/genart-format/invalid/missing-id.genart', 'utf-8'))))
  .toThrow(/required field.*id/i);
```
