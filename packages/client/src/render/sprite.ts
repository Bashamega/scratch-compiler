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
    this.stage = stage;

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
    if (!this.konvaNode.getParent()) {
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

  turnRight(degrees: number) {
    this.turnBy(degrees);
  }

  turnLeft(degrees: number) {
    this.turnBy(-degrees);
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
