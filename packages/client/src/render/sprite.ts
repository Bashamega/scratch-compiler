import type { ScratchTarget } from "@scratch-compiler/types";
import { SCRATCH_STAGE_HEIGHT, SCRATCH_STAGE_WIDTH } from "../config";
import type { Stage } from "./stage";
import { Image as KonvaImage } from "konva/lib/shapes/Image";

export class Sprite {
  data: ScratchTarget;
  images: HTMLImageElement[] = [];
  konvaNode: KonvaImage;
  private isReady = false;
  private ready: Promise<void>;

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
}
