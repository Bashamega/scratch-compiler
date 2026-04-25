import type { Sprite } from "../../render/sprite";

/**
 * Attaches a click event handler to the Konva node of a Sprite.
 * When the sprite is clicked on the canvas, the callback is executed.
 */
export function onClick(
  sprite: Sprite,
  callback: () => void | Promise<void>,
) {
  sprite.konvaNode.on("click", () => {
    callback();
  });
}
