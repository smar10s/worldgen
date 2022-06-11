import * as Random from '../math/Random.js';
import * as Range from '../math/Range.js';
import World from './World.js';

export default class InterpolatedWorld extends World {
    static createIteratively(
        startWorld,
        steps = 1,
        // between 0-1, higher = rougher
        roughness = startWorld.roughness || 0.5,
        // slightly lower initial roughness seems to look a bit nicer
        initialRoughness = startWorld.initialRoughness || 0.4,
    ) {
        const scale = 4; // number of points to increase by per step

        // set initial variance inversely proportional to roughness, i.e. if roughness = 0.5, then
        // we divide our variance by 2 every time we multiply the number of points by 4, so we can
        // solve for the starting variance for a given number of points and some assumed initial
        // roughness
        let variance = Math.PI * startWorld.controlPoints.length ** -(1 - initialRoughness);
        let world = startWorld;

        for (let i = 0; i < steps; i += 1, variance *= roughness) {
            world = new InterpolatedWorld(world, scale, variance);
        }

        return world;
    }

    constructor(world, scale, variance) {
        super(Object.assign(world.config, {
            numberOfControlPoints: world.controlPoints.length * scale,
            models: [], // override models, interpolate values later
        }));

        this.interpolateValues(world, variance);
    }

    interpolateValues(sourceWorld, variance) {
        const fuzz = (v, r) => Range.clampNormal(v + Random.floatRange(-r, r));

        for (let i = 0; i < this.controlPoints.length; i += 1) {
            const controlPoint = this.controlPoints[i];
            const values = sourceWorld.getValuesAt(controlPoint.lat, controlPoint.long);

            controlPoint.elevation = fuzz(values.elevation, variance);

            // lower variance for some properties that don't vary as much
            controlPoint.temperature = fuzz(values.temperature, variance * 0.2);
            controlPoint.precipitation = fuzz(values.precipitation, variance * 0.2);
        }

        this.updateStats();
    }
}
