# Scratch Compiler

A monorepo for compiling Scratch 3 (`.sb3`) projects into standalone, high-performance web applications using TypeScript and Konva.js.

## Overview

The Scratch Compiler transforms Scratch project files into a directory containing:
- **`index.html`**: A clean entry point for the web application.
- **`assets/`**: All costumes and sounds extracted from the original `.sb3` file.
- **`src/main.js`**: A generated JavaScript file that initializes the project state.
- **`src/engine.min.js`**: A lightweight runtime that handles rendering and execution.

## Project Structure

This project is managed as a PNPM workspace:

- **`packages/cli`**: The command-line interface used to compile `.sb3` files.
  - Extracts assets and `project.json`.
  - Generates the `main.js` loader.
  - Packages the static web template.
- **`packages/client`**: The browser runtime (engine).
  - Built with [Konva.js](https://konvajs.org/) for hardware-accelerated 2D rendering.
  - Defines the `Stage` and `Sprite` primitives.
- **`packages/types`**: Shared TypeScript definitions for the Scratch 3.0 file format.

## Current State

The project is currently in early development.

### Supported Features
- [x] Extraction of `.sb3` archives.
- [x] Automated asset extraction (Images, SVGs, Audio).
- [x] Migration of project structure (Stage and Sprite initial states).
- [x] Generation of a readable `main.js` file.
- [x] Basic rendering engine using Konva.js.
- [x] Monorepo setup with optimized build pipeline (esbuild + TSC).

### In Progress / Roadmap
- [ ] Block execution engine (interpreting Scratch scripts).
- [ ] Support for Scratch variables and lists.
- [ ] Sound playback integration.
- [ ] Advanced graphic effects (ghost, color, etc.).
- [ ] Pen extension support.

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or newer)
- [PNPM](https://pnpm.io/)

### Installation
```bash
pnpm install
```

### Building
Build the entire workspace:
```bash
pnpm run build
```

### Compiling a Scratch Project
To compile a `.sb3` file:
```bash
pnpm run cli:start --file path/to/your/project.sb3 --output ./dist-web
```

## License
MIT
