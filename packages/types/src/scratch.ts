// Main Scratch Project type
export interface ScratchProject {
  targets: ScratchTarget[];
  monitors: ScratchMonitor[];
  extensions: string[];
  meta: ScratchMeta;
}

export interface ScratchTarget {
  isStage: boolean;
  name: string;
  variables: ScratchVariables;
  lists: ScratchLists;
  broadcasts: ScratchBroadcasts;
  blocks: ScratchBlocks;
  comments: ScratchComments;
  currentCostume: number;
  costumes: ScratchCostume[];
  sounds: ScratchSound[];
  volume: number;
  layerOrder: number;
  visible?: boolean;
  x?: number;
  y?: number;
  size?: number;
  direction?: number;
  draggable?: boolean;
  rotationStyle?: string;
  tempo?: number;
  videoTransparency?: number;
  videoState?: string;
  textToSpeechLanguage?: string | null;
}

export type ScratchVariables = Record<string, [string, number]>;
export type ScratchLists = Record<string, unknown>;
export type ScratchBroadcasts = Record<string, unknown>;

export interface ScratchBlock {
  opcode: string;
  next: string | null;
  parent: string | null;
  inputs: Record<string, unknown>;
  fields: Record<string, unknown[]>;
  shadow: boolean;
  topLevel: boolean;
  x?: number;
  y?: number;
}

export type ScratchBlocks = Record<string, ScratchBlock>;
export type ScratchComments = Record<string, unknown>;

export interface ScratchCostume {
  name: string;
  dataFormat: string;
  assetId: string;
  md5ext: string;
  rotationCenterX: number;
  rotationCenterY: number;
  bitmapResolution?: number;
}

export interface ScratchSound {
  name: string;
  assetId: string;
  dataFormat: string;
  format: string;
  rate: number;
  sampleCount: number;
  md5ext: string;
}

export interface ScratchMonitor {
  id: string;
  mode: string;
  opcode: string;
  params: Record<string, unknown>;
  spriteName: string | null;
  value: number;
  width: number;
  height: number;
  x: number;
  y: number;
  visible: boolean;
  sliderMin: number;
  sliderMax: number;
  isDiscrete: boolean;
}

export interface ScratchMeta {
  semver: string;
  vm: string;
  agent: string;
}
