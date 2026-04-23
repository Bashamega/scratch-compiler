# Stage

The `Stage` class manages the Konva stage and the background layer. It is responsible for initializing the canvas and rendering the backdrop.

## Constructor

```typescript
constructor(data: ScratchTarget, container: HTMLDivElement | string)
```

- `data`: The Scratch stage target data (must have `isStage: true`).
- `container`: A DOM element or its ID where the canvas will be mounted.

## Properties

- `konvaStage`: The underlying `Konva.Stage` instance.
- `backdropLayer`: The layer containing the stage backdrop.
- `spriteLayer`: The layer where sprites are added.
- `logicalWidth`: Fixed at 480 (Scratch default).
- `logicalHeight`: Fixed at 360 (Scratch default).

## Methods

### `draw()`
Renders the current backdrop. It automatically handles SVG or bitmap conversion and applies the correct rotation centers and scaling based on `bitmapResolution`.

### `change(id: string)`
Changes the current backdrop to the costume with the matching `assetId` and triggers a redraw.

```typescript
await stage.change('some-asset-id');
```

## Internal Image Caching
The `Stage` class maintains a static image cache to ensure that assets used by multiple sprites or shared between backdrop changes are only loaded once.
