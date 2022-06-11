import * as Sphere from '../math/Sphere.js';
import * as Range from '../math/Range.js';
import assignElevation from './models/RandomTectonicPlates.js';
import assignPrecipitation from './models/IdealizedPrecipitation.js';
import assignTemperature from './models/IdealizedTemperature.js';

export default class World {
    constructor(config) {
        const cls = this.constructor;
        const models = config.models || [
            // independent
            assignElevation,
            assignPrecipitation,

            // depends on precipitation and elevation
            assignTemperature,
        ];

        this.config = config;
        this.radius = config.radius || 1;
        this.seaLevel = typeof config.seaLevel !== 'undefined' ? config.seaLevel : 0.7;
        this.controlPoints = cls.createControlPoints(config.numberOfControlPoints || 256);

        models.forEach((model) => model(this));

        this.updateStats();
    }

    static createControlPoints(numberOfPoints) {
        const goldenRatio = ((Math.sqrt(5) + 1) / 2);
        const goldenAngle = (2 - goldenRatio) * (2 * Math.PI);
        const controlPoints = [];

        for (let i = 0; i < numberOfPoints; i += 1) {
            controlPoints.push({
                lat: Math.asin((2 * (i / numberOfPoints)) - 1),
                // subtract half a circle to make it more lat/long like
                // (and match the negative start in the sine wave above)
                long: Sphere.wrapAngle(goldenAngle * i) - Math.PI,
            });
        }

        return controlPoints;
    }

    updateStats() {
        this.minElevation = 1;
        this.maxElevation = 0;
        this.minTemperature = 1;
        this.maxTemperature = 0;
        this.minPrecipitation = 1;
        this.maxPrecipitation = 0;

        this.controlPoints.forEach((point) => {
            this.minElevation = Math.min(point.elevation, this.minElevation);
            this.maxElevation = Math.max(point.elevation, this.maxElevation);
            this.minTemperature = Math.min(point.temperature, this.minTemperature);
            this.maxTemperature = Math.max(point.temperature, this.maxTemperature);
            this.minPrecipitation = Math.min(point.precipitation, this.minPrecipitation);
            this.maxPrecipitation = Math.max(point.precipitation, this.maxPrecipitation);
        });
    }

    getClosestPoints(lat, long) {
        // maximumRadius is empirically derived, but seems to work..
        //  - TODO try to relate to number of points?
        //  - TODO move into (optional?) argument?
        const maximumRadius = Math.PI * 2 * this.controlPoints.length ** -0.5;
        const bounds = Sphere.boundingCircle(lat, long, maximumRadius);
        const crossingMeridian = bounds.minLong > bounds.maxLong;
        // determine starting point from min lat
        const start = Math.floor(((Math.sin(bounds.minLat) + 1) / 2) * this.controlPoints.length);
        const points = [];

        for (let i = start; i < this.controlPoints.length; i += 1) {
            const point = this.controlPoints[i];

            if (point.lat > bounds.maxLat) {
                break;
            }

            // see Sphere.boundingCircle comments
            if (
                (point.long >= bounds.minLong && point.long <= bounds.maxLong)
                || (
                    crossingMeridian
                    && (point.long >= bounds.minLong || point.long <= bounds.maxLong)
                )
            ) {
                points.push({
                    controlPoint: point,
                    distance: Sphere.distanceBetween(this.radius, lat, long, point.lat, point.long),
                });
            }
        }

        return points.sort((a, b) => a.distance - b.distance);
    }

    getValuesAt(lat, long) {
        const closestPoints = this.getClosestPoints(lat, long).slice(0, 4);

        if (closestPoints.length !== 4) {
            throw new Error(`Didn't find enough points for ${lat}, ${long}`);
        }

        if (closestPoints[0].distance === 0) {
            return closestPoints[0].controlPoint;
        }

        return this.getWeightedValues(closestPoints);
    }

    // inverse distance weighting
    getWeightedValues(closestPoints) {
        const power = 2;
        const totalInverseDistance = closestPoints.reduce(
            (total, point) => total + (1 / point.distance ** power),
            0,
        );

        let elevation = 0; let temperature = 0; let
            precipitation = 0;

        for (let i = 0; i < closestPoints.length; i += 1) {
            const { controlPoint } = closestPoints[i];
            const inverseDistance = closestPoints[i].distance ** power;

            elevation += controlPoint.elevation / inverseDistance;
            temperature += controlPoint.temperature / inverseDistance;
            precipitation += controlPoint.precipitation / inverseDistance;
        }

        // divide by inverse distance and clamp values to avoid floating point nonsense
        const clamped = (v, min, max) => Range.clamp(v / totalInverseDistance, min, max);

        return {
            elevation: clamped(elevation, this.minElevation, this.maxElevation),
            temperature: clamped(temperature, this.minTemperature, this.maxTemperature),
            precipitation: clamped(precipitation, this.minPrecipitation, this.maxPrecipitation),
        };
    }
}
