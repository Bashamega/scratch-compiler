import type { ScratchTarget } from "@scratch-compiler/types";
import { SCRATCH_STAGE_HEIGHT, SCRATCH_STAGE_WIDTH } from "../config";
import type { Stage } from "./stage";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import * as events from "../blocks/events";

export class Sprite {
  data: ScratchTarget;
  images: HTMLImageElement[] = [];
  konvaNode: KonvaImage;
  private isReady = false;
  private ready: Promise<void>;
  private stage?: Stage;

  /**
   * Attaches a Scratch event callback to this sprite.
   * This provides a scalable way for the CLI to wire up converted JS blocks.
   *
   * @param eventName The event type (e.g., 'click', 'flag', 'keypress')
   * @param keyOrCallback If eventName is 'keypress', this should be the key string; otherwise, the callback function.
   * @param maybeCallback The callback function if eventName is 'keypress', otherwise undefined.
   */
  on(
    eventName: "click" | "flag",
    callback: () => void
  ): void;
  on(
    eventName: "keypress",
    key: string,
    callback: () => void
  ): void;
  on(
    eventName: "click" | "flag" | "keypress",
    keyOrCallback: string | (() => void),
    maybeCallback?: () => void
  ): void {
    switch (eventName) {
      case "click":
        if (typeof keyOrCallback === "function") {
          events.onClick(this, keyOrCallback);
        } else {
          console.warn(`[Sprite] Callback must be provided for 'click' event`);
        }
        break;
      case "flag":
        if (typeof keyOrCallback === "function") {
          events.onFlag(true, keyOrCallback);
        } else {
          console.warn(`[Sprite] Callback must be provided for 'flag' event`);
        }
        break;
      case "keypress":
        if (typeof keyOrCallback === "string" && typeof maybeCallback === "function") {
          events.onKey(keyOrCallback, maybeCallback);
        } else {
          console.warn(`[Sprite] For 'keypress', provide a key and a callback: on('keypress', key, callback)`);
        }
        break;
      default:
        console.warn(`[Sprite] Unknown event type: ${eventName}`);
    }
  }

  /** Shortcut for on('click', ...) */
  onClick(callback: () => void) {
    this.on("click", callback);
  }

  /** Shortcut for on('flag', ...) */
  onFlag(callback: () => void) {
    this.on("flag", callback);
  }

  /**
   * Shortcut for on('keypress', key, callback)
   */
  onKeyPress(key: string, callback: () => void) {
    this.on("keypress", key, callback);
  }

  constructor(data: ScratchTarget) {
    this.data = data;
    this.konvaNode = new KonvaImage({
      name: data.name,
      image: new Image()
    });

    // Load all costumes and track when all are ready
    const promises = this.data.costumes.map((costume, index) => {
      const img = new Image();
      img.src = `./assets/${costume.md5ext}`;
      this.images.push(img);

      return new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(`Failed to load ${costume.md5ext}`);
      });
    });

    // This promise resolves when all images are loaded
    this.ready = Promise.all(promises).then(() => {
      this.isReady = true;
    });
  }

  /** Draws the sprite, waits for images if needed */
  draw(stage: Stage) {
    stage.addSprite(this);
    // If the stage is changing, reparent the konvaNode to the new stage's spriteLayer
    if (this.stage !== stage) {
      // Remove from old stage's layer if parented
      const parent = this.konvaNode.getParent();
      if (parent) {
        this.konvaNode.remove();
      }
      // Add to new stage's layer if not already present
      if (stage.spriteLayer && this.konvaNode.getParent() !== stage.spriteLayer) {
        stage.spriteLayer.add(this.konvaNode);
      }
      this.stage = stage;
    }

    if (this.isReady) {
      this.performDraw(stage);
    } else {
      this.ready
        .then(() => {
          this.performDraw(stage);
        })
        .catch(console.error);
    }
  }

  private performDraw(stage: Stage) {
    // We assume that draw() handles reparenting, so only add to spriteLayer if not parented
    if (!this.konvaNode.getParent()) {
      stage.spriteLayer.add(this.konvaNode);
    } else if (this.konvaNode.getParent() !== stage.spriteLayer) {
      // Defensive: ensure reparenting if something is mismatched.
      this.konvaNode.remove();
      stage.spriteLayer.add(this.konvaNode);
    }

    if (!this.data.visible) {
      this.konvaNode.visible(false);
      stage.spriteLayer.batchDraw();
      return;
    }

    const idx = this.data.currentCostume ?? 0;
    const image = this.images[idx];
    if (!image) return;

    const costume = this.data.costumes[idx];

    const x = this.data.x ?? 0;
    const y = this.data.y ?? 0;
    const direction = this.data.direction ?? 90;
    const size = this.data.size ?? 100;

    const bitmapResolution = costume.bitmapResolution ?? 1;

    // --------------------------
    // Scratch coordinates -> canvas
    // --------------------------
    const canvasX = SCRATCH_STAGE_WIDTH / 2 + x;
    const canvasY = SCRATCH_STAGE_HEIGHT / 2 - y; // flip y-axis

    // --------------------------
    // Rotation center (normalized by bitmap resolution)
    // --------------------------
    const rotationCenterX =
      (costume.rotationCenterX ?? image.width / 2) / bitmapResolution;
    const rotationCenterY =
      (costume.rotationCenterY ?? image.height / 2) / bitmapResolution;

    // --------------------------
    // Draw width/height normalized by bitmap resolution
    // --------------------------
    const drawWidth = image.width / bitmapResolution;
    const drawHeight = image.height / bitmapResolution;

    this.konvaNode.setAttrs({
      image: image,
      x: canvasX,
      y: canvasY,
      width: drawWidth,
      height: drawHeight,
      rotation: direction - 90,
      scaleX: size / 100,
      scaleY: size / 100,
      offsetX: rotationCenterX,
      offsetY: rotationCenterY,
      visible: true,
    });

    stage.spriteLayer.batchDraw();
  }
  nextCostume() {
    // Advances to the next costume, wrapping around as needed
    if (!Array.isArray(this.data.costumes) || this.data.costumes.length === 0) return;
    const current = this.data.currentCostume ?? 0;
    const next = (current + 1) % this.data.costumes.length;
    this.data.currentCostume = next;
    if (this.stage) {
      this.draw(this.stage);
    }
  }

  turnRight(degrees: number) {
    this.turnBy(degrees);
  }

  turnLeft(degrees: number) {
    this.turnBy(-degrees);
  }
  move(steps: number) {
    if (!Number.isFinite(steps)) {
      console.warn(`[Sprite] move expected a finite number, received ${steps}`);
      return;
    }

    // In Scratch, 0 degrees is up, 90 is right -- convert degrees to radians for math
    const direction = (this.data.direction ?? 90);
    const radians = (direction - 90) * (Math.PI / 180);

    // Each "step" is 1 unit in scratch coordinate space
    this.data.x = (this.data.x ?? 0) + steps * Math.cos(radians);
    this.data.y = (this.data.y ?? 0) + steps * Math.sin(radians);

    if (this.stage) {
      this.draw(this.stage);
    }
  }
  gotoXY(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.warn(`[Sprite] gotoXY expected finite numbers, received x: ${x}, y: ${y}`);
      return;
    }
    this.data.x = x;
    this.data.y = y;
    if (this.stage) {
      this.draw(this.stage);
    }
  }

  /**
   * Checks if this sprite is touching another object.
   * @param targetName The name of the target sprite, "_mouse_", or "_edge_".
   */
  isTouching(targetName: "_mouse_" | "_edge_"): boolean {
    if (!this.stage) return false;

    if (targetName === "_edge_") {
      // Ensure current bounds are updated
      const rect = this.konvaNode.getClientRect();
      return (
        rect.x < 0 ||
        rect.y < 0 ||
        rect.x + rect.width > SCRATCH_STAGE_WIDTH ||
        rect.y + rect.height > SCRATCH_STAGE_HEIGHT
      );
    }

    if (targetName === "_mouse_") {
      const pos = this.stage.konvaStage.getPointerPosition();
      if (!pos) return false;

      // Konva's getIntersection is perfect for checking if a point is over a node
      const intersected = this.stage.konvaStage.getIntersection(pos);
      return intersected === this.konvaNode;
    }

    // Otherwise, check for collision with another sprite by name
    const targetSprite = this.stage.sprites.find(
      (s) => s.data.name === targetName && s !== this
    );
    if (!targetSprite) return false;

    // A simple AABB intersection check for now. 
    // This can be upgraded to pixel-perfect if needed later.
    const r1 = this.konvaNode.getClientRect();
    const r2 = targetSprite.konvaNode.getClientRect();

    return !(
      r2.x > r1.x + r1.width ||
      r2.x + r2.width < r1.x ||
      r2.y > r1.y + r1.height ||
      r2.y + r2.height < r1.y
    );
  }

  /**
   * If the sprite is touching the edge of the stage, bounce it back.
   * This matches Scratch's "if on edge, bounce" block.
   */
  ifOnEdgeBounce() {
    if (!this.stage) return;

    // Ensure the node is updated with current data to get accurate bounding box
    this.performDraw(this.stage);

    // Get bounding box in canvas coordinates
    const rect = this.konvaNode.getClientRect();
    const stageWidth = SCRATCH_STAGE_WIDTH;
    const stageHeight = SCRATCH_STAGE_HEIGHT;

    let bounced = false;
    let direction = this.data.direction ?? 90;
    let x = this.data.x ?? 0;
    let y = this.data.y ?? 0;

    // Left edge
    if (rect.x < 0) {
      x += -rect.x;
      direction = -direction;
      bounced = true;
    }
    // Right edge
    else if (rect.x + rect.width > stageWidth) {
      x -= (rect.x + rect.width - stageWidth);
      direction = -direction;
      bounced = true;
    }

    // Top edge
    if (rect.y < 0) {
      y -= -rect.y; // canvas Y is inverted from Scratch Y
      direction = 180 - direction;
      bounced = true;
    }
    // Bottom edge
    else if (rect.y + rect.height > stageHeight) {
      y += (rect.y + rect.height - stageHeight);
      direction = 180 - direction;
      bounced = true;
    }

    if (bounced) {
      // Normalize direction to (-180, 180]
      direction = direction % 360;
      if (direction <= -180) direction += 360;
      if (direction > 180) direction -= 360;

      this.data.direction = direction;
      this.data.x = x;
      this.data.y = y;
      this.draw(this.stage);
    }
  }

  private turnBy(delta: number) {
    if (!Number.isFinite(delta)) {
      console.warn(`[Sprite] turnBy expected a finite number, received ${delta}`);
      return;
    }

    this.data.direction = (this.data.direction ?? 90) + delta;

    if (this.stage) {
      this.draw(this.stage);
    }
  }
}
