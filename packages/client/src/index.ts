import { Stage } from "./render/stage";

// Find the stage data from ScratchProject.targets (isStage === true)
if (window.sb3 && window.sb3.targets.length > 0) {
    const stageData = window.sb3.targets.find(target => target.isStage);
    if (stageData) {
        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);

        const stage = new Stage(stageData, canvas);
    }
}