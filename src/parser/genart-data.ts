import type { GenartDataFile, GenartDataChannel } from "../types.js";

/**
 * Parse a raw JSON object into a validated GenartDataFile.
 * Throws on invalid structure.
 */
export function parseGenartData(raw: unknown): GenartDataFile {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("GenartDataFile must be a JSON object");
  }

  const obj = raw as Record<string, unknown>;

  // Version field
  const version = obj["genart-data"];
  if (typeof version !== "string" || !version) {
    throw new Error('GenartDataFile must have a "genart-data" version string');
  }

  // Type field
  const type = obj["type"];
  if (typeof type !== "string" || !type) {
    throw new Error('GenartDataFile must have a "type" string');
  }

  const result: Record<string, unknown> = {
    "genart-data": version,
    type,
  };

  // Optional description
  if (obj["description"] !== undefined) {
    if (typeof obj["description"] !== "string") {
      throw new Error('"description" must be a string');
    }
    result["description"] = obj["description"];
  }

  // Grid-based data: cols, rows, channels
  if (obj["cols"] !== undefined || obj["rows"] !== undefined || obj["channels"] !== undefined) {
    if (typeof obj["cols"] !== "number" || obj["cols"] < 1) {
      throw new Error('"cols" must be a positive number');
    }
    if (typeof obj["rows"] !== "number" || obj["rows"] < 1) {
      throw new Error('"rows" must be a positive number');
    }
    result["cols"] = obj["cols"];
    result["rows"] = obj["rows"];

    if (!obj["channels"] || typeof obj["channels"] !== "object" || Array.isArray(obj["channels"])) {
      throw new Error('"channels" must be an object when cols/rows are present');
    }
    const channels: Record<string, GenartDataChannel> = {};
    for (const [name, ch] of Object.entries(obj["channels"] as Record<string, unknown>)) {
      channels[name] = parseChannel(ch, name);
    }
    result["channels"] = channels;
  }

  // Simple value payload
  if (obj["value"] !== undefined) {
    result["value"] = obj["value"];
  }

  // Must have either channels or value
  if (result["channels"] === undefined && result["value"] === undefined) {
    throw new Error('GenartDataFile must have either "channels" or "value"');
  }

  return result as unknown as GenartDataFile;
}

const VALID_CHANNEL_TYPES = ["scalar", "vector", "json"] as const;

function parseChannel(raw: unknown, name: string): GenartDataChannel {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error(`Channel "${name}" must be an object`);
  }
  const obj = raw as Record<string, unknown>;

  if (typeof obj["type"] !== "string" || !VALID_CHANNEL_TYPES.includes(obj["type"] as typeof VALID_CHANNEL_TYPES[number])) {
    throw new Error(`Channel "${name}" type must be one of: ${VALID_CHANNEL_TYPES.join(", ")}`);
  }

  if (obj["data"] === undefined) {
    throw new Error(`Channel "${name}" must have a "data" field`);
  }

  // scalar/vector channels use base64 strings; json channels use any JSON value
  if ((obj["type"] === "scalar" || obj["type"] === "vector") && typeof obj["data"] !== "string") {
    throw new Error(`Channel "${name}" with type "${obj["type"]}" must have a base64 string "data" field`);
  }

  return {
    type: obj["type"] as GenartDataChannel["type"],
    data: obj["data"],
  };
}

/**
 * Serialize a GenartDataFile to a JSON string.
 */
export function serializeGenartData(file: GenartDataFile): string {
  return JSON.stringify(file, null, 2);
}
