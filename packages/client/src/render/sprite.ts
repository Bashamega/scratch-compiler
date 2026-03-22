import { ScratchTarget } from "@scratch-compiler/types";

export class Sprite {
  data: ScratchTarget;
  images: HTMLImageElement[] = [];

  constructor(data: ScratchTarget) {
    this.data = data;

    // Load all costumes as images
    this.data.costumes.forEach(costume => {
      const img = new Image();
      img.src = `./assets/${costume.md5ext}`;
      this.images.push(img);
    });
  }

  /**
   * Draws the sprite in Scratch coordinates:
   *   - (0,0) is center of the canvas
   *   - +y is up, +x is right
   * Renders correctly regardless of canvas size.
   *
   * @param ctx HTML CanvasRenderingContext2D to draw to (should be scaled for DPR).
   * @param logicalWidth Logical canvas width (e.g. 480).
   * @param logicalHeight Logical canvas height (e.g. 360).
   */
  draw(ctx: CanvasRenderingContext2D, logicalWidth: number, logicalHeight: number) {
    if (!this.data.visible) return;
    const currentCostumeIdx = this.data.currentCostume ?? 0;
    const costume = this.images[currentCostumeIdx];
    if (!costume?.complete) return;

    ctx.save();

    const canvasWidth = logicalWidth;
    const canvasHeight = logicalHeight;
  
    const x = this.data.x ?? 0;
    const y = this.data.y ?? 0;
    const direction = this.data.direction ?? 90;
    const size = this.data.size ?? 100;
  
    // Map Scratch coords → canvas
    const canvasX = canvasWidth / 2 + x;
    const canvasY = canvasHeight / 2 - y; // flip y once
  
    ctx.translate(canvasX, canvasY);
    ctx.rotate(((direction - 90) * Math.PI) / 180); // rotation matches Scratch
    ctx.scale(size / 100, size / 100); // scale by size %
  
    const rc = this.data.costumes[currentCostumeIdx];
    const rotationCenterX = rc.rotationCenterX ?? 0;
    const rotationCenterY = rc.rotationCenterY ?? 0;
  
    ctx.drawImage(
      costume,
      -rotationCenterX,
      -rotationCenterY,
      costume.width,
      costume.height
    );
  
    ctx.restore();
  }
  switchCostume(index: number) {
    if (index >= 0 && index < this.images.length) {
      this.data.currentCostume = index;
    }
  }

  move(dx: number, dy: number) {
    // Defensive: only update if defined, else set to dx/dy
    this.data.x = (this.data.x ?? 0) + dx;
    this.data.y = (this.data.y ?? 0) + dy;
  }

  setPosition(x: number, y: number) {
    this.data.x = x;
    this.data.y = y;
  }

  setDirection(deg: number) {
    this.data.direction = deg;
  }

  show() {
    this.data.visible = true;
  }

  hide() {
    this.data.visible = false;
  }
}
