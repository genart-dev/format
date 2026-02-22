import type {
  WorkspaceDefinition,
  WorkspaceSketchRef,
  WorkspaceGroup,
} from "../types.js";

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

function parseSketchRef(raw: unknown, index: number): WorkspaceSketchRef {
  assertObject(raw, `sketches[${index}]`);
  assertString(raw["file"], `sketches[${index}].file`);
  assertObject(raw["position"], `sketches[${index}].position`);

  const pos = raw["position"] as Obj;
  assertNumber(pos["x"], `sketches[${index}].position.x`);
  assertNumber(pos["y"], `sketches[${index}].position.y`);

  return {
    file: raw["file"] as string,
    position: { x: pos["x"] as number, y: pos["y"] as number },
    ...(raw["label"] !== undefined
      ? (() => {
          assertString(raw["label"], `sketches[${index}].label`);
          return { label: raw["label"] as string };
        })()
      : {}),
    ...(raw["locked"] !== undefined ? { locked: Boolean(raw["locked"]) } : {}),
    ...(raw["visible"] !== undefined
      ? { visible: Boolean(raw["visible"]) }
      : {}),
  };
}

function parseGroup(raw: unknown, index: number): WorkspaceGroup {
  assertObject(raw, `groups[${index}]`);
  assertString(raw["id"], `groups[${index}].id`);
  assertString(raw["label"], `groups[${index}].label`);
  assertArray(raw["sketchFiles"], `groups[${index}].sketchFiles`);

  const sketchFiles = (raw["sketchFiles"] as unknown[]).map((f, i) => {
    assertString(f, `groups[${index}].sketchFiles[${i}]`);
    return f;
  });

  return {
    id: raw["id"] as string,
    label: raw["label"] as string,
    sketchFiles,
    ...(raw["color"] !== undefined
      ? (() => {
          assertString(raw["color"], `groups[${index}].color`);
          return { color: raw["color"] as string };
        })()
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse and validate a .genart-workspace JSON value.
 *
 * @param json - Parsed JSON value (output of JSON.parse or plain object).
 * @throws Error with descriptive message on validation failure.
 */
export function parseWorkspace(json: unknown): WorkspaceDefinition {
  assertObject(json, "root");

  if (json["genart-workspace"] === undefined) {
    throw new Error(
      'Missing required field "genart-workspace" (format version)',
    );
  }
  assertString(json["genart-workspace"], "genart-workspace");

  if (json["id"] === undefined) {
    throw new Error('Missing required field "id"');
  }
  assertString(json["id"], "id");

  if (json["title"] === undefined) {
    throw new Error('Missing required field "title"');
  }
  assertString(json["title"], "title");

  if (json["created"] === undefined) {
    throw new Error('Missing required field "created"');
  }
  assertString(json["created"], "created");

  if (json["modified"] === undefined) {
    throw new Error('Missing required field "modified"');
  }
  assertString(json["modified"], "modified");

  if (json["viewport"] === undefined) {
    throw new Error('Missing required field "viewport"');
  }
  assertObject(json["viewport"], "viewport");
  const vp = json["viewport"] as Obj;
  assertNumber(vp["x"], "viewport.x");
  assertNumber(vp["y"], "viewport.y");
  assertNumber(vp["zoom"], "viewport.zoom");

  if (json["sketches"] === undefined) {
    throw new Error('Missing required field "sketches"');
  }
  assertArray(json["sketches"], "sketches");
  const sketches = (json["sketches"] as unknown[]).map(parseSketchRef);

  let groups: WorkspaceGroup[] | undefined;
  if (json["groups"] !== undefined) {
    assertArray(json["groups"], "groups");
    groups = (json["groups"] as unknown[]).map(parseGroup);
  }

  return {
    "genart-workspace": json["genart-workspace"],
    id: json["id"],
    title: json["title"],
    created: json["created"],
    modified: json["modified"],
    viewport: {
      x: vp["x"] as number,
      y: vp["y"] as number,
      zoom: vp["zoom"] as number,
    },
    sketches,
    ...(groups !== undefined ? { groups } : {}),
  };
}

/**
 * Serialize a WorkspaceDefinition to a formatted JSON string.
 */
export function serializeWorkspace(workspace: WorkspaceDefinition): string {
  const out: Record<string, unknown> = {
    "genart-workspace": workspace["genart-workspace"],
    id: workspace.id,
    title: workspace.title,
    created: workspace.created,
    modified: workspace.modified,
    viewport: workspace.viewport,
    sketches: workspace.sketches,
  };

  if (workspace.groups !== undefined) {
    out["groups"] = workspace.groups;
  }

  return JSON.stringify(out, null, 2);
}
