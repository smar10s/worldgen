import * as Random from '../../math/Random.js';
import * as Range from '../../math/Range.js';

function findRandomNeighbour(world, point) {
    const closestPoints = world.getClosestPoints(point.lat, point.long).slice(0, 4);
    const closestUnassignedPoints = closestPoints.filter((result) => typeof result.controlPoint.plate === 'undefined');
    const availablePoints = closestUnassignedPoints.length;

    if (!availablePoints) {
        return null;
    }

    return closestUnassignedPoints[Random.integerRange(0, availablePoints - 1)].controlPoint;
}

function removeEmpty(queues) {
    return queues.filter((queue) => !!queue.length);
}

// assigns each control point to a tectonic plate by selecting a random starting control point for
// each plate, then repeatedly adding one random neighbour point to each plate until all points have
// been assigned
function assignPlates(world, numberOfPlates) {
    const { controlPoints } = world;
    const startingIndexes = Random.integerSet(numberOfPlates, 0, controlPoints.length - 1);
    const plates = [...Array(numberOfPlates)].map(() => ({
        // limit base range to give actual elevation some room
        baseElevation: Random.floatRange(0.2, 0.8),
    }));

    let plateQueues = startingIndexes.map((i, plate) => {
        controlPoints[i].plate = plates[plate];
        return [controlPoints[i]];
    });

    for (plateQueues; plateQueues.length; plateQueues = removeEmpty(plateQueues)) {
        plateQueues.forEach((queue) => {
            let randomNeighbour = null;

            while (queue.length && !randomNeighbour) {
                const lastPoint = queue[queue.length - 1];

                randomNeighbour = findRandomNeighbour(world, lastPoint);

                if (randomNeighbour) {
                    randomNeighbour.plate = lastPoint.plate;
                    queue.push(randomNeighbour);
                } else {
                    queue.pop();
                }
            }
        });
    }
}

export default function assignElevation(world) {
    const { controlPoints } = world;
    const { config } = world;

    assignPlates(
        world,
        config.numberOfPlates || 16,
    );

    for (let i = 0; i < controlPoints.length; i += 1) {
        const elevation = controlPoints[i].plate.baseElevation + Random.floatRange(-0.01, 0.01);

        controlPoints[i].elevation = Range.clampNormal(elevation);
    }
}
