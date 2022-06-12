import * as Range from '../../math/Range.js';

function getAtmosphericAbsorption(precipitation) {
    const WaterRadiationAbsorption = 0.2; // TODO

    return precipitation * WaterRadiationAbsorption;
}

function getAtmosphericEnergy(lat, precipitation) {
    // the higher, the more atmospheric energy, until something else counteracts it
    const Dampener = 0.1;

    return (1 - precipitation) / (1 + (Math.abs(lat) / Dampener));
}

function getReflectedEnergy(surfaceInsolationEnergy, seaLevel, elevation, precipitation) {
    const landAlbedo = Range.map(precipitation, 0, 1, 0.2, 0.05); // TODO tweak this maybe?
    const oceanAlbedo = 0.05;
    const albedo = elevation < seaLevel ? oceanAlbedo : landAlbedo;

    return surfaceInsolationEnergy * albedo;
}

function getRadiatedEnergy(surfaceTotalEnergy) {
    const Sigma = 0.23; // actually 5.670374419e-8, but who knows what units our world is in...

    return Sigma * surfaceTotalEnergy ** 4;
}

function getTrappedEnergy(radiatedEnergy, reflectedEnergy, atmosphericAbsorption) {
    return (radiatedEnergy + reflectedEnergy) * atmosphericAbsorption;
}

// estimates temperature based on elevation and latitude only.
// - latitude provides the initial total insolation and precipitation (see assignPrecipitation).
// - precipitation absorbs some insolation, and some is immediately reflected, giving a lower total surface energy.
// - reflection is based on albedo, which in turn is again based on elevation and precipitation (i.e. sea level and
//   humidity).
// - the insolated body now radiates black body radiation, some of which is again trapped by precipitation
// - total surface energy is now final insolation minus radiation plus total trapped (radiation and reflection)
// https://www.desmos.com/calculator/nhxs526nws
// https://upload.wikimedia.org/wikipedia/commons/a/aa/Annual_Average_Temperature_Map.jpg
export default function assignTemperature(world) {
    for (let i = 0; i < world.controlPoints.length; i += 1) {
        const controlPoint = world.controlPoints[i];
        const { lat, elevation, precipitation } = controlPoint;
        const { seaLevel } = world;

        const atmosphericInsolationEnergy = Math.cos(lat);

        const atmosphericAbsorption = getAtmosphericAbsorption(precipitation);

        const reflectedEnergy = getReflectedEnergy(
            (atmosphericInsolationEnergy - atmosphericAbsorption),
            seaLevel,
            elevation,
            precipitation,
        );

        const surfaceInsolationEnergy = (atmosphericInsolationEnergy - atmosphericAbsorption) - reflectedEnergy;

        const atmosphericEnergy = getAtmosphericEnergy(lat, precipitation);

        const totalSurfaceEnergy = (surfaceInsolationEnergy + atmosphericEnergy);

        const radiatedEnergy = getRadiatedEnergy(totalSurfaceEnergy);

        const trappedEnergy = getTrappedEnergy(radiatedEnergy, reflectedEnergy, atmosphericAbsorption);

        const totalEnergy = (totalSurfaceEnergy - radiatedEnergy) + trappedEnergy;

        // 'spread' energy out over a column of air based on elevation
        controlPoint.temperature = totalEnergy - Math.max(0, elevation - seaLevel);
    }
}
