import type { ScratchCostume, ScratchTarget } from "@scratch-compiler/types";

const SCRATCH_STAGE_WIDTH = 480;
const SCRATCH_STAGE_HEIGHT = 360;

export class Stage {
  stage: ScratchTarget;
  currentCostume: ScratchCostume;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  readonly logicalWidth: number;
  readonly logicalHeight: number;

  // Static image cache: assetUrl -> Promise<HTMLImageElement>
  private static imageCache: Map<string, Promise<HTMLImageElement>> = new Map();

  constructor(data: ScratchTarget, canvas: HTMLCanvasElement) {
    if (!data.isStage) throw new Error("Please pass a stage not sprite");
    this.stage = data;
    this.currentCostume = data.costumes[data.currentCostume ?? 0];
    this.canvas = canvas;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D rendering context for Stage");
    this.ctx = ctx;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.logicalWidth = SCRATCH_STAGE_WIDTH;
    this.logicalHeight = SCRATCH_STAGE_HEIGHT;

    if (dpr > 1) {
      this.canvas.width = SCRATCH_STAGE_WIDTH * dpr;
      this.canvas.height = SCRATCH_STAGE_HEIGHT * dpr;
      this.canvas.style.width = SCRATCH_STAGE_WIDTH + "px";
      this.canvas.style.height = SCRATCH_STAGE_HEIGHT + "px";
      this.ctx.scale(dpr, dpr);
    }
  }

  private async loadImage(costume: ScratchCostume): Promise<HTMLImageElement> {
    const assetUrl = "./assets/" + costume.md5ext;

    // Use assetId as unique key per costume (md5ext can differ by backend but assetId is unique)
    const cacheKey = `${costume.assetId}:${costume.dataFormat}`;
    if (Stage.imageCache.has(cacheKey)) return Stage.imageCache.get(cacheKey)!;

    let promise: Promise<HTMLImageElement>;
    if (costume.dataFormat === "svg") {
      promise = (async () => {
        const response = await fetch(assetUrl);
        const svgText = await response.text();
        const svgBase64 = btoa(unescape(encodeURIComponent(svgText)));
        const img = new Image();
        img.src = `data:image/svg+xml;base64,${svgBase64}`;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        return img;
      })();
    } else {
      promise = (async () => {
        const img = new Image();
        img.src = assetUrl;
        await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
        return img;
      })();
    }

    Stage.imageCache.set(cacheKey, promise);
    promise.catch(() => Stage.imageCache.delete(cacheKey));
    return promise;
  }

  /** Kid-friendly draw: draws immediately if possible, otherwise auto on image load */
  draw() {
    if (!this.currentCostume) return;
  
    this.loadImage(this.currentCostume).then((img) => {
      const ctx = this.ctx;
      ctx.save();
      const prevComposite = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = "destination-over";
  
      const w = this.logicalWidth;
      const h = this.logicalHeight;

      // Use rotationCenterX/Y to position the image correctly
      const costume = this.currentCostume;
      const centerX = costume.rotationCenterX ?? img.width / 2;
      const centerY = costume.rotationCenterY ?? img.height / 2;

      // Place the rotation center of the costume at the center of the stage
      const stageCenterX = w / 2;
      const stageCenterY = h / 2;
      const drawX = stageCenterX - centerX;
      const drawY = stageCenterY - centerY;

      ctx.drawImage(img, drawX, drawY, img.width, img.height);

      ctx.globalCompositeOperation = prevComposite;
      ctx.restore();
    }).catch(console.warn);
  }

  async change(id: string): Promise<void> {
    const costume = this.stage.costumes.find((c) => c.assetId === id);
    if (!costume) throw new Error("This costume doesn't exist");
    this.currentCostume = costume;
    this.draw(); // auto draw after change
  }
}
