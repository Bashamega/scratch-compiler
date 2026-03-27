import type { ScratchTarget } from "@scratch-compiler/types";
import { SCRATCH_STAGE_HEIGHT, SCRATCH_STAGE_WIDTH } from "../config";

export class Sprite {
  data: ScratchTarget;
  images: HTMLImageElement[] = [];
  private isReady = false;
  private ready: Promise<void>;

  constructor(data: ScratchTarget) {
    this.data = data;

    // Load all costumes and track when all are ready
    const promises = this.data.costumes.map((costume) => {
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
  draw(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
  ) {
    if (this.isReady) {
      this.performDraw(ctx, canvasWidth, canvasHeight);
    } else {
      this.ready
        .then(() => {
          this.performDraw(ctx, canvasWidth, canvasHeight);
        })
        .catch(console.error);
    }
  }

  private performDraw(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
  ) {
    if (!this.data.visible) return;

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
    // Stage scaling (optional)
    // Only scale if canvas size != 480x360
    // --------------------------
    const stageScale = Math.min(
      canvasWidth / SCRATCH_STAGE_WIDTH,
      canvasHeight / SCRATCH_STAGE_HEIGHT,
    );

    // --------------------------
    // Final sprite scale
    // --------------------------
    const scale = (size / 100) * stageScale;

    // --------------------------
    // Scratch coordinates -> canvas
    // --------------------------
    const canvasX = canvasWidth / 2 + x * stageScale;
    const canvasY = canvasHeight / 2 - y * stageScale; // flip y-axis

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

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Position + rotation
    ctx.translate(canvasX, canvasY);
    ctx.rotate(((direction - 90) * Math.PI) / 180);
    ctx.scale(scale, scale);

    // Draw image
    ctx.drawImage(
      image,
      -rotationCenterX,
      -rotationCenterY,
      drawWidth,
      drawHeight,
    );

    ctx.restore();
  }
}
