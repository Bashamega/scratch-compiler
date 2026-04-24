import type { ScratchCostume } from "@scratch-compiler/types";

// assetId:dataFormat -> Promise<HTMLImageElement>
const cache = new Map<string, Promise<HTMLImageElement>>();

function loadRaster(assetUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${assetUrl}`));
    img.src = assetUrl;
  });
}

async function loadSvg(assetUrl: string): Promise<HTMLImageElement> {
  const response = await fetch(assetUrl);
  const svgText = await response.text();
  const svgBase64 = btoa(unescape(encodeURIComponent(svgText)));
  const img = new Image();
  img.src = `data:image/svg+xml;base64,${svgBase64}`;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load svg: ${assetUrl}`));
  });
  return img;
}

export function loadCostumeImage(costume: ScratchCostume): Promise<HTMLImageElement> {
  const assetUrl = "./assets/" + costume.md5ext;
  const cacheKey = `${costume.assetId}:${costume.dataFormat}`;

  const existing = cache.get(cacheKey);
  if (existing) return existing;

  const promise =
    costume.dataFormat === "svg" ? loadSvg(assetUrl) : loadRaster(assetUrl);

  cache.set(cacheKey, promise);
  promise.catch(() => cache.delete(cacheKey));
  return promise;
}

