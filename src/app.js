import UI from './ui/UI.js';
import World from './world/World.js';
import Earth from './world/presets/Earth.js';
import * as Config from './ui/Config.js';

function createWorld() {
    if (Config.has('seed')) {
        const seed = Config.get('seed');

        Math.seedrandom(seed); // always seed, gives presets a consistent seed too

        if (seed === 'earth') {
            return new Earth();
        }
    } else {
        Math.seedrandom();
    }

    return new World({
        numberOfControlPoints: Config.get('numberOfControlPoints', 256),
        seaLevel: Config.get('seaLevel', 0.7),
    });
}

export default function start() {
    const ui = new UI(createWorld(), {
        detailLevel: Config.get('detailLevel', 4), // number of times to subdivide world
        textureHeight: Config.get('textureHeight', 512), // width = height * 2
    });

    ui.start();
}
