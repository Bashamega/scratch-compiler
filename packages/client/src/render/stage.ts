import type { ScratchCostume, ScratchTarget } from "@scratch-compiler/types";
import { SCRATCH_STAGE_HEIGHT, SCRATCH_STAGE_WIDTH } from "../config";
import {Stage as KonvaStage} from "konva/lib/Stage";
import { Layer as KonvaLayer } from "konva/lib/Layer";
import { Image as KonvaImage } from "konva/lib/shapes/Image";
import type { Sprite } from "./sprite";
import * as events from "../blocks/events"; // <-- IMPORT EVENTS like in sprite.ts
import { MonitorOverlay } from "./monitorOverlay";
import { loadCostumeImage } from "./costumeImage";

export class Stage {
  stage: ScratchTarget;
  currentCostume: ScratchCostume;
  konvaStage: KonvaStage;
  backdropLayer: KonvaLayer;
  spriteLayer: KonvaLayer;
  backdropImage: KonvaImage;
  sprites: Sprite[] = [];
  private monitors: MonitorOverlay;

  readonly logicalWidth: number;
  readonly logicalHeight: number;

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

    const containerEl =
      typeof container === "string"
        ? (document.getElementById(container) as HTMLDivElement | null)
        : container;
    if (!containerEl) {
      throw new Error(`Container not found: ${String(container)}`);
    }

    this.monitors = new MonitorOverlay(containerEl);

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

  /** Kid-friendly draw: draws immediately if possible, otherwise auto on image load */
  draw() {
    if (!this.currentCostume) return;
  
    loadCostumeImage(this.currentCostume).then((img) => {
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

  change(id: string) {
    const costume = this.stage.costumes.find(
      (c) => c.name === id || c.assetId === id,
    );
    if (!costume) throw new Error("This costume doesn't exist");
    this.currentCostume = costume;
    this.draw(); // auto draw after change
  }

  /**
   * Attaches a Scratch event callback to the stage.
   *
   * @param eventName The event type (e.g., 'flag')
   * @param callback The callback function.
   */
  on(
    eventName: "flag",
    callback: () => void
  ): void;
  on(
    eventName: string,
    callback: () => void
  ): void;
  on(
    eventName: string,
    callback: () => void
  ): void {
    switch (eventName) {
      case "flag":
        if (typeof callback === "function") {
          events.onFlag(true, callback);
        } else {
          console.warn(`[Stage] Callback must be provided for 'flag' event`);
        }
        break;
      default:
        console.warn(`[Stage] Unknown event type: ${eventName}`);
    }
  }

  /** Shortcut for on('flag', ...) */
  onFlag(callback: () => void) {
    this.on("flag", callback);
  }

  showVariable(name: string) {
    this.monitors.showVariable(name);
  }

  hideVariable(name: string) {
    this.monitors.hideVariable(name);
  }

  renderVariable(name: string, value: unknown) {
    this.monitors.renderVariable(name, value);
  }

  showList(name: string) {
    this.monitors.showList(name);
  }

  hideList(name: string) {
    this.monitors.hideList(name);
  }

  renderList(name: string, value: unknown) {
    this.monitors.renderList(name, value);
  }
}
