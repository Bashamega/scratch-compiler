import type { ScratchBlock } from "@scratch-compiler/types";

/**
 * Generates runtime calls for supported motion blocks.
 */
export function generateMotionBlockCode(
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "motion_turnright": {
      const degrees = readNumericInput(block.inputs, "DEGREES", 15);
      return `${spriteVar}.turnRight(${degrees});`;
    }
    case "motion_turnleft": {
      const degrees = readNumericInput(block.inputs, "DEGREES", 15);
      return `${spriteVar}.turnLeft(${degrees});`;
    }
    default:
      return null;
  }
}

function readNumericInput(
  inputs: ScratchBlock["inputs"],
  inputName: string,
  fallback: number,
): number {
  const value = resolveNumericValue(inputs[inputName]);
  return value ?? fallback;
}

// Predicate to detect tuple metadata slots used in Scratch block arrays
function isTupleMetadataSlot(entry: unknown): boolean {
  // In Scratch block tuples, metadata slots are often in the form of a string marker,
  // e.g., "shadow", "field", or sometimes arrays whose first slot is a known marker
  if (typeof entry === "string") {
    // Possible metadata slot: "shadow" or similar marker
    return entry === "shadow" || entry === "field";
  }
  if (Array.isArray(entry)) {
    // In block tuple representations, metadata may be ["shadow", ...], or ["field", ...]
    const metaTag = entry[0];
    return metaTag === "shadow" || metaTag === "field";
  }
  return false;
}

function resolveNumericValue(value: unknown): number | null {
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
