// eslint-disable-next-line import/no-unresolved
import * as THREE from 'https://unpkg.com/three@0.124.0/build/three.module.js';
import * as Range from '../math/Range.js';
import * as Colour from './colour/Colour.js';
import * as Config from './Config.js';

export default class Texture {
    constructor(world, textureWidth, textureHeight) {
        this.world = world;
        this.textureWidth = textureWidth;
        this.textureHeight = textureHeight;

        this.landFreezingPoint = Range.map(-2, -50, 30, world.minTemperature, world.maxTemperature);
        this.oceanFreezingPoint = Range.map(-25, -50, 30, world.minTemperature, world.maxTemperature);
    }

    getLatLongForTextureIndex(x, y) {
        const worldWidth = 360;
        const worldHeight = 180;

        return {
            lat: (y / (this.textureHeight / worldHeight) - (worldHeight / 2)) * (Math.PI / 180),
            long: -(x / (this.textureWidth / worldWidth) - (worldWidth / 2)) * (Math.PI / 180),
        };
    }

    getLandColour(values) {
        const { world } = this;
        const elevation = Range.normalize(values.elevation, world.seaLevel, world.maxElevation);
        const temperature = Range.normalize(values.temperature, world.minTemperature, world.maxTemperature);

        if (values.temperature < this.landFreezingPoint) {
            return Colour.rgbInGradient(elevation, Colour.Gradients.Ice);
        }

        const precipitation = Range.normalize(values.precipitation, 0, world.maxPrecipitation);
        // TODO some function of precipitation to scale to gradient properly
        const scaledPrecip = Range.clampNormal(precipitation * 2);

        const coldColour = Colour.rgbBetweenGradients(
            elevation,
            scaledPrecip,
            Colour.Gradients.AridLand,
            Colour.Gradients.HumidColdLand,
        );

        const warmColour = Colour.rgbBetweenGradients(
            elevation,
            scaledPrecip,
            Colour.Gradients.AridLand,
            Colour.Gradients.HumidWarmLand,
        );

        return Colour.mix(temperature, coldColour, warmColour);
    }

    getWaterColour(values) {
        const { world } = this;
        const elevation = Range.normalize(values.elevation, world.minElevation, world.seaLevel);

        if (values.temperature < this.oceanFreezingPoint) {
            return Colour.rgbInGradient(elevation, Colour.Gradients.Ice);
        }

        return Colour.rgbInGradient(elevation, Colour.Gradients.Water);
    }

    getColourForTerrain(values) {
        return values.elevation > this.world.seaLevel ? this.getLandColour(values) : this.getWaterColour(values);
    }

    getColourForTemperature(temperature) {
        const { world } = this;

        return Colour.rgbInGradient(
            Range.normalize(temperature, world.minTemperature, world.maxTemperature),
            Colour.Gradients.HeatMap,
        );
    }

    getColourForPrecipitation(precipitation) {
        const { world } = this;

        return Colour.rgbInGradient(
            Range.normalize(precipitation, 0, world.maxPrecipitation),
            Colour.Gradients.Precipitation,
        );
    }

    getBumpShadeForElevation(elevation) {
        const { world } = this;
        const shade = 255 * Range.normalize(elevation, world.minElevation, world.maxElevation);

        return [shade, shade, shade];
    }

    createMaterialMaps() {
        const height = this.textureHeight;
        const width = this.textureWidth;
        const terrainMap = new Uint8Array(width * height * 3);
        const temperatureMap = new Uint8Array(width * height * 3);
        const precipitationMap = new Uint8Array(width * height * 3);
        const bumpMap = new Uint8Array(width * height * 3);

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const i = ((y * width) + x) * 3;
                const latLong = this.getLatLongForTextureIndex(x, y, width, height);
                const values = this.world.getValuesAt(latLong.lat, latLong.long);

                terrainMap.set(this.getColourForTerrain(values), i);
                temperatureMap.set(this.getColourForTemperature(values.temperature), i);
                precipitationMap.set(this.getColourForPrecipitation(values.precipitation), i);
                bumpMap.set(this.getBumpShadeForElevation(values.elevation), i);
            }
        }

        return {
            terrain: new THREE.DataTexture(terrainMap, width, height, THREE.RGBFormat),
            temperature: new THREE.DataTexture(temperatureMap, width, height, THREE.RGBFormat),
            precipitation: new THREE.DataTexture(precipitationMap, width, height, THREE.RGBFormat),
            bump: new THREE.DataTexture(bumpMap, width, height, THREE.RGBFormat),
        };
    }

    createSphereMaterials() {
        const materialMaps = this.createMaterialMaps();

        return [
            new THREE.MeshStandardMaterial({
                map: materialMaps.terrain,
                bumpMap: Config.should('bumpMap') ? materialMaps.bump : null,
                bumpScale: 0.5,
            }),

            new THREE.MeshStandardMaterial({
                map: materialMaps.temperature,
                transparent: true,
                opacity: 0.9,
                visible: Config.should('showTemperature'),
            }),

            new THREE.MeshStandardMaterial({
                map: materialMaps.precipitation,
                transparent: true,
                opacity: 0.9,
                visible: Config.should('showPrecipitation'),
            }),
        ];
    }
}
