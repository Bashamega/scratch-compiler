import type { ScratchBlock } from "@scratch-compiler/types";

export function readFieldString(
  fields: ScratchBlock["fields"],
  fieldName: string,
): string | null {
  const field = fields[fieldName];
  if (!Array.isArray(field) || field.length === 0) {
    return null;
  }

  const value = field[0];
  return typeof value === "string" ? value : null;
}

/**
 * Resolves a block input to a block ID if it's a block reference.
 */
export function readInputBlockId(
  inputs: ScratchBlock["inputs"],
  inputName: string,
): string | null {
  const input = inputs[inputName];
  if (!Array.isArray(input)) return null;

  // Scratch input structure: [shadow, value, [optional shadow]]
  // value can be a string (block ID) or an array (primitive)
  const value = input[1];
  return typeof value === "string" ? value : null;
}

export function readNumericInput(
  inputs: ScratchBlock["inputs"],
  inputName: string,
  fallback: number,
): number {
  const value = resolveNumericValue(inputs[inputName]);
  return value ?? fallback;
}

// Predicate to detect tuple metadata slots used in Scratch block arrays
export function isTupleMetadataSlot(entry: unknown): boolean {
  if (typeof entry === "string") {
    return entry === "shadow" || entry === "field";
  }
  if (Array.isArray(entry)) {
    const metaTag = entry[0];
    return metaTag === "shadow" || metaTag === "field";
  }
  return false;
}

export function resolveNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      if (isTupleMetadataSlot(value[index])) {
        continue;
      }
      const resolved = resolveNumericValue(value[index]);
      if (resolved !== null) {
        return resolved;
      }
    }
  }

  return null;
}
