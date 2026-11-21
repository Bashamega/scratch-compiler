import type { ScratchBlock, ScratchTarget } from "@scratch-compiler/types";
import { readInputMenuString, readNumericInput } from "./utils";

/**
 * Generates runtime calls for supported sound blocks.
 */
export function generateSoundBlockCode(
  target: ScratchTarget,
  block: ScratchBlock,
  spriteVar: string,
): string | null {
  switch (block.opcode) {
    case "sound_play": {
      const soundName = readInputMenuString(
        target,
        block.inputs,
        "SOUND_MENU",
        "SOUND_MENU",
      );
      return `${spriteVar}.playSound(${JSON.stringify(soundName ?? "")});`;
    }
    case "sound_playuntildone": {
      const soundName = readInputMenuString(
        target,
        block.inputs,
        "SOUND_MENU",
        "SOUND_MENU",
      );
      return `await ${spriteVar}.playSoundUntilDone(${JSON.stringify(soundName ?? "")});`;
    }
    case "sound_setvolumeto": {
      const volume = readNumericInput(block.inputs, "VOLUME", 100);
      return `${spriteVar}.setVolume(${volume});`;
    }
    default:
      return null;
  }
}
