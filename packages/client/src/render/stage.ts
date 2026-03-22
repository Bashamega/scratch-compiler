import type { ScratchCostume, ScratchTarget } from "@scratch-compiler/types";

export class Stage {
  stage: ScratchTarget;
  currentCostume: ScratchCostume;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

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
  }

  private async loadImage(costume: ScratchCostume): Promise<HTMLImageElement> {
    const assetUrl = "./assets/" + costume.md5ext;

    // Use assetId as unique key per costume (md5ext can differ by backend but assetId is unique)
    const cacheKey = `${costume.assetId}:${costume.dataFormat}`;

    if (Stage.imageCache.has(cacheKey)) {
      // Return cached (promise resolves when image is ready)
      return Stage.imageCache.get(cacheKey)!;
    }

    // Not cached, need to fetch and create Image.
    let loadPromise: Promise<HTMLImageElement>;
    if (costume.dataFormat === 'svg') {
      loadPromise = (async () => {
        try {
          const response = await fetch(assetUrl);
          const svgText = await response.text();
          const svgBase64 = btoa(unescape(encodeURIComponent(svgText)));
          const img = new window.Image();
          img.src = `data:image/svg+xml;base64,${svgBase64}`;
          await new Promise((res, rej) => {
            img.onload = res;
            img.onerror = rej;
          });
          return img;
        } catch (e) {
          throw new Error(`Failed to load SVG costume asset: ${assetUrl}, ${e}`);
        }
      })();
    } else {
      loadPromise = (async () => {
        const img = new window.Image();
        img.src = assetUrl;
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });
        return img;
      })();
    }

    // Store promise in cache so concurrent requests share it.
    Stage.imageCache.set(cacheKey, loadPromise);

    // If it fails, remove from cache so retries work.
    loadPromise.catch(() => {
      Stage.imageCache.delete(cacheKey);
    });

    return loadPromise;
  }

  async render(): Promise<void> {
    if (!this.currentCostume) {
      console.warn("No costume to render.");
      return;
    }

    this.ctx.save();
    const prevComposite = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = "destination-over";

    let img: HTMLImageElement;
    try {
      img = await this.loadImage(this.currentCostume);
    } catch (e) {
      console.warn(e);
      this.ctx.globalCompositeOperation = prevComposite;
      this.ctx.restore();
      return;
    }

    // Draw the image: If it's smaller than the canvas, put it at the top; otherwise fill the canvas
    if (img.width < this.canvas.width || img.height < this.canvas.height) {
      // Center horizontally if narrower, stick to top if shorter
      const x = img.width < this.canvas.width ? (this.canvas.width - img.width) / 2 : 0;
      const y = 0; // Always top
      this.ctx.drawImage(img, x, y, img.width, img.height);
    } else {
      // Fill the canvas as before
      this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
    }

    this.ctx.globalCompositeOperation = prevComposite;
    this.ctx.restore();
  }

  async change(id: string): Promise<void> {
    const costume = this.stage.costumes.find((c) => c.assetId === id);
    if (!costume) throw new Error("This costume doesn't exist");
    this.currentCostume = costume;
    await this.render();
  }
}
