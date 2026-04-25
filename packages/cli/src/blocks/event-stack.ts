import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { isTupleMetadataSlot, readFieldString, readInputBlockId } from "./utils";

function resolveBroadcastName(
  target: ScratchTarget,
  block: ScratchBlock,
): string | null {
  // Most commonly: inputs.BROADCAST_INPUT is a primitive tuple like [1, [11, "Message", "id"]]
  const input = block.inputs?.["BROADCAST_INPUT"];
  if (!Array.isArray(input)) return null;

  const value = input[1];

  // Sometimes it's an input block id (menu shadow), e.g. event_broadcast_menu
  if (typeof value === "string") {
    const inputBlockId = readInputBlockId(block.inputs, "BROADCAST_INPUT") ?? value;
    const inputBlock = target.blocks[inputBlockId];
    if (!inputBlock) return null;

    return (
      readFieldString(inputBlock.fields, "BROADCAST_OPTION") ??
      readFieldString(inputBlock.fields, "BROADCAST") ??
      null
    );
  }

  // Primitive tuples: try the second slot first (Scratch typically stores the visible value there)
  if (Array.isArray(value)) {
    if (typeof value[1] === "string") return value[1];

    // Fallback: find the first string slot that's not metadata.
    for (let index = 0; index < value.length; index += 1) {
      const entry = value[index];
      if (isTupleMetadataSlot(entry)) continue;
      if (typeof entry === "string") return entry;
    }
  }

  return null;
}

/**
 * Generates runtime calls for supported "event" stack blocks used inside scripts.
 */
export function generateEventStackBlockCode(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "event_broadcast": {
      const name = resolveBroadcastName(target, block);
      if (!name) {
        return `console.warn(${JSON.stringify("[Compiler] Missing broadcast name.")});`;
      }
      return `${spriteVar}.broadcast(${JSON.stringify(name)});`;
    }
    case "event_broadcastandwait": {
      const name = resolveBroadcastName(target, block);
      if (!name) {
        return `console.warn(${JSON.stringify("[Compiler] Missing broadcast name.")});`;
      }
      return `await ${spriteVar}.broadcastAndWait(${JSON.stringify(name)});`;
    }
    default:
      return null;
  }
}

