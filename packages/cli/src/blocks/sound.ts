import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { resolveTargetIdentifier } from "../ident";
import { generateDataBlockCode } from "./data";
import { generateOperatorBlockCode } from "./operator";
import { generateSensingBlockCode } from "./sensing";
import { readFieldString } from "./utils";

function resolveSoundInput(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
  inputName: "SOUND_MENU" | "VOLUME",
): string | null {
  const input = block.inputs[inputName];
  const value = Array.isArray(input) ? (input[1] ?? input[2]) : input;
  const coerce = inputName === "VOLUME" ? "Number" : "String";

  if (Array.isArray(value) && value[0] === 12 && typeof value[1] === "string") {
    const id = typeof value[2] === "string" ? value[2] : null;
    const variable = resolveTargetIdentifier(target, spriteVar, value[1], id, "variable");
    return `${coerce}(${variable})`;
  }

  let literal = Array.isArray(value) ? value[1] : value;
  if (typeof value === "string") {
    const nested = target.blocks[value];
    const opcode = nested?.opcode;
    if (typeof opcode === "string") {
      if (opcode === "sound_sounds_menu" && inputName === "SOUND_MENU") {
        return JSON.stringify(readFieldString(nested.fields, "SOUND_MENU") ?? "");
      }
      let expression: string | null = null;
      if (opcode === "data_variable" || opcode === "data_listcontents") {
        expression = generateDataBlockCode(target, nested, spriteVar);
      } else if (opcode.startsWith("operator_")) {
        expression = generateOperatorBlockCode(target, nested, spriteVar);
      } else if (opcode.startsWith("sensing_") && opcode !== "sensing_askandwait") {
        expression = generateSensingBlockCode(target, nested, spriteVar);
      }
      return expression === null ? null : `${coerce}(${expression})`;
    }
  }

  if (inputName === "SOUND_MENU") {
    return typeof literal === "string" || typeof literal === "number"
      ? JSON.stringify(String(literal))
      : null;
  }
  if (typeof literal === "string" && literal.trim()) literal = Number(literal);
  return typeof literal === "number" && Number.isFinite(literal) ? String(literal) : null;
}

/**
 * Generates runtime calls for supported sound blocks.
 */
export function generateSoundBlockCode(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "sound_play":
    case "sound_playuntildone": {
      const soundName = resolveSoundInput(target, block, spriteVar, "SOUND_MENU") ?? '""';
      return block.opcode === "sound_play"
        ? `${spriteVar}.playSound(${soundName});`
        : `await ${spriteVar}.playSoundUntilDone(${soundName});`;
    }
    case "sound_setvolumeto": {
      const volume = resolveSoundInput(target, block, spriteVar, "VOLUME") ?? "100";
      return `${spriteVar}.setVolume(${volume});`;
    }
    default:
      return null;
  }
}
