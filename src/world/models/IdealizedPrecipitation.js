// estimates precipitation based on elevation and latitude only.
// represented as a simple cosine function: rising air starts rain at the equator, cooling and
// descending near the 15th, peaking at the 30th to create the major deserts before rising again
// to cover the northern hemisphere in rain until falling again to create the arctic deserts above
// the 60th.
// references:
//  https://en.wikipedia.org/wiki/Hadley_cell#/media/File:Earth_Global_Circulation_-_en.svg
//  https://en.wikipedia.org/wiki/Precipitation#/media/File:Precipitation_longterm_mean.gif
export default function assignPrecipitation(world) {
    for (let i = 0; i < world.controlPoints.length; i += 1) {
        const controlPoint = world.controlPoints[i];
        // the higher, the more precipitation
        const Dampener = 0.5;
        // shift up (+1) get positives only, and normalize back (/2)
        const precipitation = (Math.cos(6 * controlPoint.lat) + 1) / 2;

        // dampen 'pure' cosine above
        controlPoint.precipitation = precipitation / (1 + (Math.abs(controlPoint.lat) / Dampener));
    }
}
