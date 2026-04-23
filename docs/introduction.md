# Scratch Compiler Client Documentation

Welcome to the documentation for the `@scratch-compiler/client` rendering engine. This package is responsible for taking processed Scratch project data and rendering it in the browser using [Konva.js](https://konvajs.org/).

## Architecture Overview

The rendering engine is built around two primary classes:

1.  **`Stage`**: Manages the main canvas, backdrops, and coordinate system. It acts as the container for all sprites.
2.  **`Sprite`**: Represents a Scratch sprite. It handles costume loading, positioning, rotation, and movement logic, translating Scratch's coordinate system to the canvas.

## Coordinate System

Scratch uses a coordinate system where (0,0) is the center of the stage.
- **Stage Width**: 480 units
- **Stage Height**: 360 units
- **X-axis**: -240 to 240
- **Y-axis**: -180 to 180 (up is positive)

The rendering engine automatically handles the translation from these Scratch coordinates to standard canvas coordinates (where 0,0 is top-left and Y increases downwards).

## Event Handling

The `Sprite` class provides a scalable way to wire up converted JavaScript blocks to user interactions (clicks, flags, and keypresses), bridging the gap between the compiled Scratch logic and the browser environment.
