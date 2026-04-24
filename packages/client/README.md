# @scratch-compiler/client

Browser runtime used by `@scratch-compiler/cli` output.

It provides:

- `Stage` (backdrop rendering, variable/list monitors)
- `Sprite` (costumes, movement, basic events)

## Install

```bash
npm i @scratch-compiler/client
```

## Basic Usage

```js
import { Stage, Sprite } from "@scratch-compiler/client";

const myStage = new Stage(
  {
    name: "Stage",
    isStage: true,
    costumes: [
      // costumes from Scratch project.json (md5ext must exist in ./assets)
    ],
    currentCostume: 0,
  },
  "sb3-container",
);

myStage.draw();

const sprite = new Sprite({
  name: "Sprite1",
  isStage: false,
  costumes: [],
  currentCostume: 0,
  x: 0,
  y: 0,
  direction: 90,
  size: 100,
  visible: true,
});

sprite.draw(myStage);
```

## Assets

The runtime loads costume assets from `./assets/<md5ext>` at runtime. If you are not using the CLI output, ensure you serve an `assets/` folder next to your page.

## Variable/List Monitors (DOM)

```js
myStage.renderVariable("Score", 10);
myStage.renderList("Items", ["a", "b", "c"]);
```

