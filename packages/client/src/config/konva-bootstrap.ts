// This file is responsible for initializing Konva's internal runtime systems BEFORE
// any Stage, Layer, or Shape is created in the application.
//
// IMPORTANT CONTEXT:
// When using Konva in modular mode (e.g. importing from "konva/lib/..."), Konva does NOT
// automatically load its internal side-effect modules. These modules are required for
// core runtime behavior such as event handling, pointer tracking, and drag-and-drop support.
//
// Without this bootstrap file, Konva may partially initialize, leading to runtime errors
// such as:
//   - "p.DD is undefined"
//   - "isDragging cannot be read"
//   - missing pointer or interaction behavior
//
// WHY THIS EXISTS:
// Konva internally relies on a shared global singleton system. Some features (like Drag & Drop)
// are not directly referenced by Stage or Layer imports, so bundlers like esbuild may remove them
// during tree-shaking unless they are explicitly imported as side effects.
//
// This file ensures those side effects are ALWAYS executed in the correct order and exactly once.

import { Konva } from "konva/lib/Global"; // Initializes Konva global environment, event system, and shared internal state
import { DD } from "konva/lib/DragAndDrop"; // Enables drag-and-drop subsystem and registers Konva.DD singleton

// @ts-ignore
Konva.DD = DD;