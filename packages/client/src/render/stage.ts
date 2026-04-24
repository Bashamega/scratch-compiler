import type { ScratchCostume, ScratchTarget } from "@scratch-compiler/types";
import { SCRATCH_STAGE_HEIGHT, SCRATCH_STAGE_WIDTH } from "../config";
import {Stage as KonvaStage} from "konva/lib/Stage";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import type { Sprite } from "./sprite";

export class Stage {
  stage: ScratchTarget;
  currentCostume: ScratchCostume;
  konvaStage: KonvaStage;
  backdropLayer: KonvaLayer;
  spriteLayer: KonvaLayer;
  backdropImage: KonvaImage;
  sprites: Sprite[] = [];

  readonly logicalWidth: number;
  readonly logicalHeight: number;

  // Static image cache: assetUrl -> Promise<HTMLImageElement>
  private static imageCache: Map<string, Promise<HTMLImageElement>> = new Map();

  constructor(data: ScratchTarget, container: HTMLDivElement | string) {
    if (!data.isStage) throw new Error("Please pass a stage not sprite");
    this.stage = data;
    this.currentCostume = data.costumes[data.currentCostume ?? 0];

    this.logicalWidth = SCRATCH_STAGE_WIDTH;
    this.logicalHeight = SCRATCH_STAGE_HEIGHT;

    this.konvaStage = new KonvaStage({
      container,
      width: SCRATCH_STAGE_WIDTH,
      height: SCRATCH_STAGE_HEIGHT,
    });

    this.backdropLayer = new KonvaLayer();
    this.spriteLayer = new KonvaLayer();
    
    this.konvaStage.add(this.backdropLayer);
    this.konvaStage.add(this.spriteLayer);

    this.backdropImage = new KonvaImage({
      name: "backdrop",
      image: new Image()
    });
    this.backdropLayer.add(this.backdropImage);
  }

  addSprite(sprite: Sprite) {
    if (!this.sprites.includes(sprite)) {
      this.sprites.push(sprite);
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
      const w = this.logicalWidth;
      const h = this.logicalHeight;

      // Use rotationCenterX/Y to position the image correctly
      const costume = this.currentCostume;
      const bitmapResolution = costume.bitmapResolution ?? 1;
      const centerX = (costume.rotationCenterX ?? img.width / 2) / bitmapResolution;
      const centerY = (costume.rotationCenterY ?? img.height / 2) / bitmapResolution;

      // Place the rotation center of the costume at the center of the stage
      const stageCenterX = w / 2;
      const stageCenterY = h / 2;
      const drawX = stageCenterX - centerX;
      const drawY = stageCenterY - centerY;

      const drawWidth = img.width / bitmapResolution;
      const drawHeight = img.height / bitmapResolution;

      this.backdropImage.setAttrs({
        image: img,
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });

      this.backdropLayer.batchDraw();
    }).catch(console.warn);
  }

  async change(id: string): Promise<void> {
    const costume = this.stage.costumes.find((c) => c.assetId === id);
    if (!costume) throw new Error("This costume doesn't exist");
    this.currentCostume = costume;
    this.draw(); // auto draw after change
  }
}
