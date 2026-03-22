// Main Scratch Project type
interface ScratchProject {
  targets: ScratchTarget[];
  monitors: ScratchMonitor[];
  extensions: string[];
  meta: ScratchMeta;
}

interface ScratchTarget {
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
  // Sprite-specific properties (optional for Stage)
  visible?: boolean;
  x?: number;
  y?: number;
  size?: number;
  direction?: number;
  draggable?: boolean;
  rotationStyle?: string;
  // Stage-specific properties
  tempo?: number;
  videoTransparency?: number;
  videoState?: string;
  textToSpeechLanguage?: string | null;
}

type ScratchVariables = Record<string, [string, number]>;
type ScratchLists = Record<string, unknown>;
type ScratchBroadcasts = Record<string, unknown>;
type ScratchBlocks = Record<string, unknown>;
type ScratchComments = Record<string, unknown>;

interface ScratchCostume {
  name: string;
  dataFormat: string;
  assetId: string;
  md5ext: string;
  rotationCenterX: number;
  rotationCenterY: number;
  bitmapResolution?: number;
}

interface ScratchSound {
  name: string;
  assetId: string;
  dataFormat: string;
  format: string;
  rate: number;
  sampleCount: number;
  md5ext: string;
}

interface ScratchMonitor {
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

interface ScratchMeta {
  semver: string;
  vm: string;
  agent: string;
}
