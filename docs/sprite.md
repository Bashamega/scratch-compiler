# Sprite

The `Sprite` class represents an individual Scratch sprite. It handles its own state (position, direction, size) and provides methods that mirror Scratch's block functionality.

## Constructor

```typescript
constructor(data: ScratchTarget)
```

- `data`: The `ScratchTarget` object containing costumes, variables, and initial state.

## Event Handling

Sprites provide an `on` method to wire up logic to Scratch events:

- `on('click', callback)`
- `on('flag', callback)`
- `on('keypress', key, callback)`

Shortcut methods are also available: `onClick(cb)`, `onFlag(cb)`, `onKeyPress(key, cb)`.

## Methods

### `draw(stage: Stage)`
Updates the sprite's visual representation on the provided `Stage`. This includes handling:
- Coordinate translation (Scratch -> Canvas).
- Rotation (adjusting for Scratch's 90-degree offset).
- Scaling (size and bitmap resolution).
- Visibility.
- Rotation centers.

### `move(steps: number)`
Moves the sprite forward in its current direction.

### `gotoXY(x: number, y: number)`
Moves the sprite instantly to the specified (x, y) coordinates on the stage.

### `turnRight(degrees: number)` / `turnLeft(degrees: number)`
Rotates the sprite relative to its current direction.

### `nextCostume()`
Cycles to the next costume in the sprite's costume list.

### `ifOnEdgeBounce()`
Checks if the sprite's bounding box is touching the stage edge and, if so, reflects its direction and snaps it back inside.

### `isTouching(targetName: string | "_mouse_" | "_edge_"): boolean`
Checks if this sprite is touching another sprite (by name), the mouse pointer (`"_mouse_"`), or the edge of the stage (`"_edge_"`). For collision with sprites, a simple bounding-box intersection is used; for the edge, checks against the stage bounds; for mouse, checks if the sprite contains the current pointer position.

## Technical Details

### Konva Integration
Each `Sprite` instance maintains a `Konva.Image` node (`konvaNode`). When `draw()` is called, the class updates the attributes of this node. If the sprite is drawn on a different stage than before, it automatically handles reparenting its node to the new stage's `spriteLayer`.

### Asset Loading
The constructor initiates the loading of all costumes. The `ready` promise resolves once all images are successfully loaded, ensuring that calls to `draw()` wait for the required assets.
