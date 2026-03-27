import type { ScratchTarget } from "@scratch-compiler/types";

export class Sprite {
  data: ScratchTarget;
  images: HTMLImageElement[] = [];
  private ready: Promise<void>;

  constructor(data: ScratchTarget) {
    this.data = data;

    // Load all costumes and track when all are ready
    const promises = this.data.costumes.map((costume) => {
      const img = new Image();
      img.src = `./assets/${costume.md5ext}`;
      this.images.push(img);

      return new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(`Failed to load ${costume.md5ext}`);
      });
    });

    // This promise resolves when all images are loaded
    this.ready = Promise.all(promises).then(() => {});
  }

  /** Draws the sprite, waits for images if needed */
  draw(ctx: CanvasRenderingContext2D, logicalWidth: number, logicalHeight: number) {
    this.ready.then(() => {
      if (!this.data.visible) return;
  
      const currentCostumeIdx = this.data.currentCostume ?? 0;
      const costume = this.images[currentCostumeIdx];
      if (!costume) return;
  
      ctx.save();
  
      const x = this.data.x ?? 0; // Scratch x
      const y = this.data.y ?? 0; // Scratch y
      const direction = this.data.direction ?? 90;
      const size = this.data.size ?? 100;
  
      // Convert Scratch coordinates -> canvas
      const canvasX = logicalWidth / 2 + x;
      const canvasY = logicalHeight / 2 - y; // flip y-axis
  
      ctx.translate(canvasX, canvasY);
      ctx.rotate(((direction - 90) * Math.PI) / 180); // Scratch rotation
      ctx.scale(size / 100, size / 100);
  
      const rc = this.data.costumes[currentCostumeIdx];
      const rotationCenterX = rc.rotationCenterX ?? costume.width / 2;
      const rotationCenterY = rc.rotationCenterY ?? costume.height / 2;
  
      ctx.drawImage(
        costume,
        -rotationCenterX,
        -rotationCenterY,
        costume.width,
        costume.height
      );
  
      ctx.restore();
    }).catch(console.error);
  }
}
