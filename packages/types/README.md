# @scratch-compiler/types

Shared TypeScript types for Scratch project JSON (`project.json`) and related compiler/runtime structures.

## Install

```bash
npm i @scratch-compiler/types
```

## Usage

```ts
import type { ScratchProject, ScratchTarget, ScratchBlock } from "@scratch-compiler/types";

function findStage(project: ScratchProject): ScratchTarget | undefined {
  return project.targets.find((t) => t.isStage);
}

function isTopLevelHat(block: ScratchBlock): boolean {
  return !!block.topLevel && block.parent === null;
}
```

